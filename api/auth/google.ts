// api/auth/google.ts
// POST /api/auth/google
// Verifies a Google ID token, upserts visitor_account, creates session

import { OAuth2Client } from 'google-auth-library';
import { v4 as uuidv4 } from 'uuid';
import type { ApiRequest, ApiResponse } from '../lib/response.js';
import { getDb } from '../db/client.js';
import { createSession, setSessionCookie } from '../lib/session.js';
import { rateLimit, maybePruneStore } from '../lib/ratelimit.js';
import { getConfig } from '../lib/config.js';
import { verifyGoogleIdToken } from '../lib/googleAuth.js';

const client = new OAuth2Client();

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // Only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  maybePruneStore();

  const cfg = getConfig();
  if (!cfg.enabled || !cfg.googleSignIn.enabled) {
    return res.status(503).json({ error: 'Google Sign-In is not enabled' });
  }

  // Rate limit: 10 attempts per IP per 5 minutes
  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const rl = rateLimit(`auth:${ip}`, 10, 5 * 60_000);
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const { credential } = (req.body || {}) as { credential?: string };
  if (!credential || typeof credential !== 'string') {
    return res.status(400).json({ error: 'Missing credential' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    console.error('[auth/google] Server configuration error: GOOGLE_CLIENT_ID is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // Verify token cryptographically
  let googleSub: string;
  let email: string;
  let name: string;

  try {
    const verified = await verifyGoogleIdToken(credential, clientId, client);
    googleSub = verified.sub;
    email = verified.email;
    name = verified.name;
  } catch (err) {
    console.error('[auth/google] Token verification failed:', err instanceof Error ? (err.stack || err.message) : err);
    return res.status(401).json({ error: 'Token verification failed' });
  }

  try {
    const sql = getDb();

    // Upsert visitor account — trust ONLY server-verified claims
    const rows = (await sql`
      INSERT INTO visitor_accounts (google_sub, display_name, email, first_seen_at, last_seen_at, total_visits)
      VALUES (${googleSub}, ${name}, ${email}, NOW(), NOW(), 1)
      ON CONFLICT (google_sub) DO UPDATE
        SET last_seen_at = NOW(),
            total_visits = visitor_accounts.total_visits + 1,
            display_name = EXCLUDED.display_name
      RETURNING id, total_visits, first_seen_at, display_name
    `) as Array<{
      id: string;
      total_visits: number;
      first_seen_at: Date;
      display_name: string;
    }>;

    const account = rows[0];
    if (!account) {
      console.error('[auth/google] Database returned no rows on account upsert');
      return res.status(500).json({ error: 'Database error' });
    }

    const sessionToken = uuidv4();
    const jwt = await createSession({
      sub: account.id,
      googleSub,
      sessionToken,
    });

    setSessionCookie(res, jwt);

    return res.status(200).json({
      ok: true,
      displayName: account.display_name,
      visitNumber: account.total_visits,
      isNew: account.total_visits === 1,
    });
  } catch (err) {
    console.error('[auth/google] Database operation failed:', err instanceof Error ? (err.stack || err.message) : err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
