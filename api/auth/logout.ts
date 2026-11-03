// api/auth/logout.ts
// POST /api/auth/logout
// Clears the session cookie

import type { ApiRequest, ApiResponse } from '../lib/response.js';
import { clearSessionCookie } from '../lib/session.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}
