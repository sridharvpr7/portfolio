// api/email/consent.ts
// POST /api/email/consent
// Records explicit email-greeting consent and sends the welcome email.
// Requires an authenticated session.

import type { ApiRequest, ApiResponse } from '../lib/response.js';
import { getAuthenticatedVisitor } from '../lib/session.js';
import { getDb } from '../db/client.js';
import { sendWelcomeEmail } from '../lib/email.js';
import { isEmailEnabled, getConfig } from '../lib/config.js';
import { rateLimit } from '../lib/ratelimit.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  if (!isEmailEnabled()) {
    return res.status(503).json({ error: 'Email greeting is not enabled' });
  }

  const session = await getAuthenticatedVisitor(req);
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Rate limit per visitor
  const rl = rateLimit(`email:${session.sub}`, 3, 60 * 60_000);
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { consent, unsubscribe } = (req.body || {}) as { consent?: boolean; unsubscribe?: boolean };
  if (consent === false || unsubscribe === true) {
    // Visitor declined or opted out — update database
    try {
      const sql = getDb();
      await sql`
        UPDATE visitor_accounts
        SET email_consent = FALSE, email_unsubscribed = TRUE, email_unsub_at = NOW()
        WHERE id = ${session.sub}
      `;
      return res.status(200).json({ ok: true, sent: false, unsubscribed: true });
    } catch (err) {
      console.error('[email/consent] Error updating opt-out:', err instanceof Error ? (err.stack || err.message) : err);
      return res.status(200).json({ ok: true, sent: false });
    }
  }

  try {
    const sql = getDb();
    const rows = (await sql`
      SELECT id, display_name, email, greeting_sent, email_unsubscribed, email_consent
      FROM visitor_accounts WHERE id = ${session.sub} AND deleted_at IS NULL
    `) as Array<{
      id: string;
      display_name: string;
      email: string;
      greeting_sent: boolean;
      email_unsubscribed: boolean;
      email_consent: boolean;
    }>;
    if (!rows.length || !rows[0]) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const acc = rows[0];

    const cfg = getConfig();

    // Never send if already sent (deduplication)
    if (acc.greeting_sent && cfg.emailGreeting.sendOnlyOnce) {
      return res.status(200).json({ ok: true, sent: false, reason: 'already_sent' });
    }

    // Never send to unsubscribed
    if (acc.email_unsubscribed) {
      return res.status(200).json({ ok: true, sent: false, reason: 'unsubscribed' });
    }

    // Record consent first
    await sql`
      UPDATE visitor_accounts
      SET email_consent = TRUE, email_consent_at = NOW()
      WHERE id = ${session.sub}
    `;

    // Send email
    const sent = await sendWelcomeEmail({
      to: acc.email,
      name: acc.display_name || 'there',
      subject: cfg.emailGreeting.subject,
    });

    if (sent) {
      await sql`
        UPDATE visitor_accounts SET greeting_sent = TRUE, greeting_sent_at = NOW()
        WHERE id = ${session.sub}
      `;
    }

    return res.status(200).json({ ok: true, sent });
  } catch (err) {
    console.error('[email/consent] Database operation failed:', err instanceof Error ? (err.stack || err.message) : err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
