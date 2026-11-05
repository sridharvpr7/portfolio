// api/contact.ts
// POST /api/contact
// Handles contact form submissions with Telegram notifications and Resend auto-replies.

import type { ApiRequest, ApiResponse } from './lib/response.js';
import { rateLimit, maybePruneStore } from './lib/ratelimit.js';
import { notifyContactSubmission } from './lib/telegram.js';
import { sendContactAutoReply } from './lib/email.js';

interface ContactRequestBody {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  _hp?: string;
}

// In-memory cache to prevent duplicate submissions within a short window
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

  // Rate limiting by client IP
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const rl = rateLimit(`contact:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment before sending another message.' });
  }

  const body = (req.body || {}) as ContactRequestBody;

  // Bot honeypot check — silently succeed
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

  // Idempotency: detect double-click / identical re-submission within 30s
  const idempotencyKey = `${email}:${subject}:${message.slice(0, 80)}`;
  const existing = recentSubmissions.get(idempotencyKey);
  if (existing && Date.now() - existing.timestamp < 30_000) {
    return res.status(200).json({
      ok: true,
      submissionId: existing.id,
      duplicate: true,
      message: 'Message already received! Thank you.',
    });
  }

  const submissionId = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  recentSubmissions.set(idempotencyKey, { id: submissionId, timestamp: Date.now() });

  // 1. Dispatch Telegram notification (asynchronous, non-blocking failure)
  try {
    await notifyContactSubmission({
      visitorName: name,
      visitorEmail: email,
      subject,
      visitorMessage: message,
      submissionId,
    });
  } catch (tgErr) {
    console.error('[contact] Telegram notification failed:', tgErr);
  }

  // 2. Dispatch automated email reply to visitor via Resend (non-blocking failure)
  try {
    await sendContactAutoReply({
      to: email,
      name,
      subject,
      replyTo: 'sridharvpr7@gmail.com',
      submissionId,
    });
  } catch (emailErr) {
    console.error('[contact] Resend auto-reply failed:', emailErr);
  }

  return res.status(200).json({
    ok: true,
    submissionId,
    message: 'Thank you for reaching out! Your message has been sent.',
  });
}

