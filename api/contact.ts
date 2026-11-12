// api/contact.ts
// POST /api/contact
// Handles contact form submissions with persistent PostgreSQL idempotency,
// independent Telegram notifications, and Resend automated replies.

import crypto from 'node:crypto';
import type { ApiRequest, ApiResponse } from './lib/response.js';
import { rateLimit, maybePruneStore } from './lib/ratelimit.js';
import { notifyContactSubmission } from './lib/telegram.js';
import { sendContactAutoReply } from './lib/email.js';
import { getDb } from './db/client.js';

interface ContactRequestBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  _hp?: string;
}

// In-memory sliding cache as resilient fallback if database is offline/unconfigured
interface RecentSubmission {
  id: string;
  timestamp: number;
}
const recentSubmissions = new Map<string, RecentSubmission>();

function pruneRecentSubmissions(): void {
  const now = Date.now();
  for (const [key, sub] of recentSubmissions.entries()) {
    if (now - sub.timestamp > 60_000) {
      recentSubmissions.delete(key);
    }
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  maybePruneStore();
  pruneRecentSubmissions();

  // Rate limiting by client IP (5 requests per minute)
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const rl = rateLimit(`contact:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment before sending another message.' });
  }

  const body = (req.body || {}) as ContactRequestBody;

  // Bot honeypot check — silently absorb spam bots
  if (body._hp) {
    return res.status(200).json({ ok: true, submissionId: 'ack_bot' });
  }

  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();

  // Input validation
  if (!name || name.length > 100) {
    return res.status(400).json({ error: 'Please enter a valid name (1-100 characters).' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!subject || subject.length > 200) {
    return res.status(400).json({ error: 'Please enter a valid subject (1-200 characters).' });
  }
  if (!message || message.length < 5 || message.length > 5000) {
    return res.status(400).json({ error: 'Please enter a message (between 5 and 5000 characters).' });
  }

  // Generate SHA-256 idempotency key based on message contents and sender
  const hash = crypto.createHash('sha256').update(`${email}:${subject}:${message}`).digest('hex');
  const idempotencyKey = `contact:${hash}`;

  // 1. Persistent idempotency check via Neon PostgreSQL
  if (process.env.DATABASE_URL) {
    try {
      const sql = getDb();

      // Ensure idempotency schema exists
      await sql`
        CREATE TABLE IF NOT EXISTS contact_submissions (
          id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          idempotency_key  TEXT UNIQUE NOT NULL,
          submission_id    TEXT UNIQUE NOT NULL,
          visitor_name     TEXT NOT NULL,
          visitor_email    TEXT NOT NULL,
          subject          TEXT NOT NULL,
          message          TEXT NOT NULL,
          telegram_sent    BOOLEAN NOT NULL DEFAULT FALSE,
          telegram_error   TEXT,
          email_sent       BOOLEAN NOT NULL DEFAULT FALSE,
          email_error      TEXT,
          created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_contact_submissions_key ON contact_submissions(idempotency_key);
      `;

      const existingRows = await sql`
        SELECT submission_id, email_sent, telegram_sent, created_at 
        FROM contact_submissions 
        WHERE idempotency_key = ${idempotencyKey} 
        LIMIT 1
      ` as Array<{ submission_id: string; email_sent: boolean; telegram_sent: boolean }>;

      if (existingRows.length > 0) {
        const existing = existingRows[0];
        console.log(`[contact] Duplicate submission prevented via Neon DB idempotency key: ${idempotencyKey}`);
        return res.status(200).json({
          ok: true,
          submissionId: existing.submission_id,
          duplicate: true,
          emailSent: existing.email_sent,
          message: existing.email_sent
            ? 'Message already received! An acknowledgment email was previously sent to your inbox.'
            : 'Message already received! Thank you for getting in touch.',
        });
      }
    } catch (dbErr) {
      console.warn('[contact] Database idempotency lookup warning:', dbErr instanceof Error ? dbErr.message : String(dbErr));
    }
  }

  // In-memory duplicate fallback (within 30s)
  const memExisting = recentSubmissions.get(idempotencyKey);
  if (memExisting && Date.now() - memExisting.timestamp < 30_000) {
    console.log(`[contact] Duplicate submission prevented via in-memory cache: ${idempotencyKey}`);
    return res.status(200).json({
      ok: true,
      submissionId: memExisting.id,
      duplicate: true,
      emailSent: false,
      message: 'Message already received! Thank you.',
    });
  }

  const submissionId = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  recentSubmissions.set(idempotencyKey, { id: submissionId, timestamp: Date.now() });

  // Record initial submission row in Neon DB
  if (process.env.DATABASE_URL) {
    try {
      const sql = getDb();
      await sql`
        INSERT INTO contact_submissions (
          idempotency_key, submission_id, visitor_name, visitor_email, subject, message
        ) VALUES (
          ${idempotencyKey}, ${submissionId}, ${name}, ${email}, ${subject}, ${message}
        ) ON CONFLICT (idempotency_key) DO NOTHING
      `;
    } catch (dbInsertErr) {
      console.warn('[contact] Database insert warning:', dbInsertErr instanceof Error ? dbInsertErr.message : String(dbInsertErr));
    }
  }

  // 2. Dispatch Telegram notification (verified independently)
  let telegramSent = false;
  let telegramError: string | null = null;
  try {
    const tgRes = await notifyContactSubmission({
      visitorName: name,
      visitorEmail: email,
      subject,
      visitorMessage: message,
      submissionId,
    });
    telegramSent = Boolean(tgRes.ok);
    if (!tgRes.ok) {
      telegramError = tgRes.description || 'Unknown Telegram error';
      console.warn('[contact] Telegram notification could not be delivered:', telegramError);
    }
  } catch (tgErr) {
    telegramError = tgErr instanceof Error ? tgErr.message : String(tgErr);
    console.error('[contact] Telegram notification failed:', telegramError);
  }

  // 3. Dispatch automated acknowledgment email via Resend (verified independently)
  let emailSent = false;
  let emailError: string | null = null;
  try {
    const emailRes = await sendContactAutoReply({
      to: email,
      name,
      subject,
      replyTo: 'sridharvpr7@gmail.com',
      submissionId,
    });
    emailSent = Boolean(emailRes.ok);
    if (!emailRes.ok) {
      emailError = emailRes.error || 'Unknown email delivery error';
      console.warn(`[contact] Auto-reply email delivery failed for ${email}: ${emailError}`);
    }
  } catch (emailErr) {
    emailError = emailErr instanceof Error ? emailErr.message : String(emailErr);
    console.error('[contact] Resend auto-reply exception:', emailError);
  }

  // 4. Update Neon DB with delivery telemetry
  if (process.env.DATABASE_URL) {
    try {
      const sql = getDb();
      await sql`
        UPDATE contact_submissions
        SET telegram_sent = ${telegramSent},
            telegram_error = ${telegramError},
            email_sent = ${emailSent},
            email_error = ${emailError}
        WHERE submission_id = ${submissionId}
      `;
    } catch (dbUpdateErr) {
      console.warn('[contact] Database status update warning:', dbUpdateErr instanceof Error ? dbUpdateErr.message : String(dbUpdateErr));
    }
  }

  // 5. Construct accurate response message: do not claim email was sent if it failed
  const responseMessage = emailSent
    ? 'Thank you for reaching out! Your message has been sent, and an acknowledgment email has been sent to your inbox.'
    : 'Thank you for reaching out! Your message has been delivered to Sridhar.';

  return res.status(200).json({
    ok: true,
    submissionId,
    emailSent,
    telegramSent,
    message: responseMessage,
  });
}
