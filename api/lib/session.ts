// api/lib/session.ts
// HTTP-only cookie-based JWT sessions using jose

import { SignJWT, jwtVerify } from 'jose';
import type { IncomingMessage, ServerResponse } from 'http';

const COOKIE_NAME = 'pf_session';
const COOKIE_OPTS =
  'HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=2592000'; // 30 days

export interface SessionPayload {
  sub: string;          // internal visitor_account.id (UUID)
  googleSub: string;    // verified Google sub claim
  sessionToken: string; // random opaque session id for heartbeats
  iat?: number;
  exp?: number;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET is missing or too short');
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: ServerResponse, token: string): void {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; ${COOKIE_OPTS}`);
}

export function clearSessionCookie(res: ServerResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
}

export function getSessionFromRequest(req: IncomingMessage): string | null {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}

export async function getAuthenticatedVisitor(req: IncomingMessage): Promise<SessionPayload | null> {
  const token = getSessionFromRequest(req);
  if (!token) return null;
  return verifySession(token);
}
