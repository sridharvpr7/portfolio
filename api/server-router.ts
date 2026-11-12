/**
 * api/server-router.ts
 *
 * Testable routing utilities extracted from server.mjs.
 * This module contains pure functions that can be unit-tested without
 * spinning up a full HTTP server or touching the filesystem.
 *
 * server.mjs imports these helpers and wires them together with the
 * actual static-file serving and handler loading.
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { adaptResponse, type ApiResponse, type ApiRequest } from './lib/response.js';

export { adaptResponse, type ApiResponse, type ApiRequest };

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApiHandler = (req: ApiRequest, res: ApiResponse) => Promise<void> | void;

export interface ApiHandlers {
  track: ApiHandler;
  heartbeat: ApiHandler;
  stats: ApiHandler;
  authGoogle: ApiHandler;
  authLogout: ApiHandler;
  adminDelete: ApiHandler;
  emailConsent: ApiHandler;
  telegramWebhook: ApiHandler;
  contact?: ApiHandler;
  aiChat?: ApiHandler;
  githubActivity?: ApiHandler;
}

// ── Cache header logic ────────────────────────────────────────────────────────

/**
 * Returns the appropriate Cache-Control header value for a given URL path.
 * Mirrors the rules in vercel.json.
 */
export function getCacheHeader(urlPath: string): string {
  if (urlPath.startsWith('/assets/profile/')) {
    // Profile and social preview images — revalidation supported
    return 'public, max-age=86400, stale-while-revalidate=604800';
  }
  if (urlPath.startsWith('/assets/')) {
    // Vite content-hashed bundles — safe to cache indefinitely
    return 'public, max-age=31536000, immutable';
  }
  if (urlPath.startsWith('/data/')) {
    // JSON content files — no stale reads
    return 'public, max-age=0, must-revalidate';
  }
  // Default for everything else (HTML, root, etc.)
  return 'no-cache';
}

// ── SPA route classification ──────────────────────────────────────────────────

/**
 * Returns true if the path should fall back to index.html for SPA routing.
 * Returns false for API routes, static assets, and data files.
 */
export function isSpaRoute(urlPath: string): boolean {
  if (urlPath.startsWith('/api/')) return false;
  if (urlPath.startsWith('/assets/')) return false;
  if (urlPath.startsWith('/data/')) return false;
  return true;
}

// ── JSON body parser ──────────────────────────────────────────────────────────

/**
 * Reads the request body and parses it as JSON.
 * Returns an empty object if the content-type is not application/json,
 * if the body is empty, or if the JSON is malformed.
 * Never throws.
 */
export function parseJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    const ct = (req.headers['content-type'] || '').split(';')[0].trim();
    if (ct !== 'application/json') {
      resolve({});
      return;
    }
    let data = '';
    req.on('data', (chunk: Buffer | string) => { data += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(JSON.parse(data) as Record<string, unknown>);
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// ── API route dispatcher ──────────────────────────────────────────────────────

/**
 * Dispatches an /api/* request to the matching handler.
 * Returns 404 JSON if no route matches.
 * Expects req.body to already be populated (call parseJsonBody first).
 */
export async function dispatchApi(
  req: IncomingMessage,
  res: ServerResponse,
  handlers?: Partial<ApiHandlers>
): Promise<boolean> {
  const url   = new URL(req.url!, 'http://localhost');
  const path  = url.pathname;

  const apiReq = req as ApiRequest;
  if (!apiReq.query) {
    apiReq.query = Object.fromEntries(url.searchParams.entries());
  }

  const apiRes = adaptResponse(res);

  apiRes.setHeader('Cache-Control', 'no-store');

  // CORS allowed origins configuration
  const allowedOrigins = new Set([
    'https://sridharvpr-portfolio.onrender.com',
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.APP_BASE_URL,
  ].filter(Boolean));

  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    apiRes.setHeader('Access-Control-Allow-Origin', origin);
    apiRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    apiRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    apiRes.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    apiRes.status(204).end();
    return true;
  }

  // Health-check endpoint — always available, reports system & DB status
  if (path === '/api/health') {
    const hasDbUrl = Boolean(process.env.DATABASE_URL);
    const hasTgToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
    const hasTgChat = Boolean(process.env.TELEGRAM_CHAT_ID);
    let dbStatus: { ok: boolean; error?: string } | undefined;
    if (hasDbUrl && apiReq.query?.checkDb === '1') {
      try {
        const { checkDbConnection } = await import('./db/client.js');
        dbStatus = await checkDbConnection();
      } catch (err) {
        dbStatus = { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    apiRes.status(200).json({
      status: 'ok',
      service: 'portfolio-api',
      ts: new Date().toISOString(),
      databaseConfigured: hasDbUrl,
      telegramConfigured: hasTgToken,
      telegramChatConfigured: hasTgChat,
      ...(dbStatus ? { databaseConnection: dbStatus } : {}),
    });
    return true;
  }

  if (path === '/api/track')            { if (handlers?.track) await handlers.track(apiReq, apiRes); return true; }
  if (path === '/api/heartbeat')        { if (handlers?.heartbeat) await handlers.heartbeat(apiReq, apiRes); return true; }
  if (path === '/api/stats')            { if (handlers?.stats) await handlers.stats(apiReq, apiRes); return true; }
  if (path === '/api/auth/google')      { if (handlers?.authGoogle) await handlers.authGoogle(apiReq, apiRes); return true; }
  if (path === '/api/auth/logout')      { if (handlers?.authLogout) await handlers.authLogout(apiReq, apiRes); return true; }
  if (path === '/api/admin/delete')     { if (handlers?.adminDelete) await handlers.adminDelete(apiReq, apiRes); return true; }
  if (path === '/api/email/consent')    { if (handlers?.emailConsent) await handlers.emailConsent(apiReq, apiRes); return true; }
  if (path === '/api/contact')          { if (handlers?.contact) await handlers.contact(apiReq, apiRes); return true; }
  if (path === '/api/ai/chat')          { if (handlers?.aiChat) await handlers.aiChat(apiReq, apiRes); return true; }
  if (path === '/api/github/activity')  { if (handlers?.githubActivity) await handlers.githubActivity(apiReq, apiRes); return true; }
  if (path === '/api/telegram/webhook' || path === '/api/telegram/webhook/') {
    if (handlers?.telegramWebhook) await handlers.telegramWebhook(apiReq, apiRes);
    return true;
  }

  // Unknown /api/* path
  apiRes.status(404).json({ error: 'Not found' });
  return false;
}
