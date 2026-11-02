// api/heartbeat.ts
// Vercel Serverless Function: POST /api/heartbeat
// Updates last_heartbeat_at for the active session (live visitor counter)
// Called every heartbeatIntervalSeconds by the frontend

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './db/client.js';
import { isAnalyticsEnabled } from './lib/config.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!isAnalyticsEnabled()) {
    return res.status(200).json({ ok: true, disabled: true });
  }

  const { sessionToken } = req.body as { sessionToken?: string };
  if (!sessionToken || typeof sessionToken !== 'string' || sessionToken.length > 128) {
    return res.status(400).json({ error: 'Invalid sessionToken' });
  }

  try {
    const sql = getDb();
    await sql`
      UPDATE active_sessions SET last_heartbeat_at = NOW()
      WHERE session_token = ${sessionToken}
    `;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[heartbeat] DB error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
