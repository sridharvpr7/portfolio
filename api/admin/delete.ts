// api/admin/delete.ts
// Vercel Serverless Function: POST /api/admin/delete
// Allows an authenticated visitor to soft-delete their own data (GDPR-style).

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedVisitor, clearSessionCookie } from '../lib/session.js';
import { getDb } from '../db/client.js';
import { isAnalyticsEnabled } from '../lib/config.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!isAnalyticsEnabled()) return res.status(503).json({ error: 'Not enabled' });

  const session = await getAuthenticatedVisitor(req as unknown as import('http').IncomingMessage);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const sql = getDb();

    // Soft-delete: clear PII, set deleted_at
    await sql`
      UPDATE visitor_accounts
      SET
        display_name = '[deleted]',
        email = NULL,
        email_consent = FALSE,
        greeting_sent = FALSE,
        deleted_at = NOW()
      WHERE id = ${session.sub} AND deleted_at IS NULL
    `;

    // Remove active sessions
    await sql`
      DELETE FROM active_sessions WHERE visitor_account_id = ${session.sub}
    `;

    // Clear cookie
    clearSessionCookie(res as unknown as import('http').ServerResponse);

    return res.status(200).json({ ok: true, message: 'Your data has been deleted.' });
  } catch (err) {
    console.error('[admin/delete] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
