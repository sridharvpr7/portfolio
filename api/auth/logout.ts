// api/auth/logout.ts
// Vercel Serverless Function: POST /api/auth/logout
// Clears the session cookie

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearSessionCookie } from '../lib/session.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  clearSessionCookie(res as unknown as import('http').ServerResponse);
  return res.status(200).json({ ok: true });
}
