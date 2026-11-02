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

// ── Types ─────────────────────────────────────────────────────────────────────

export type ApiHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;

export interface ApiHandlers {
  track: ApiHandler;
  heartbeat: ApiHandler;
  stats: ApiHandler;
  authGoogle: ApiHandler;
  authLogout: ApiHandler;
  adminDelete: ApiHandler;
  emailConsent: ApiHandler;
  telegramWebhook: ApiHandler;
}

// ── Cache header logic ────────────────────────────────────────────────────────

/**
 * Returns the appropriate Cache-Control header value for a given URL path.
 * Mirrors the rules in vercel.json.
 */
export function getCacheHeader(urlPath: string): string {
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
  handlers: ApiHandlers
): Promise<void> {
  const url   = new URL(req.url!, 'http://localhost');
  const path  = url.pathname;

  res.setHeader('Cache-Control', 'no-store');

  // Health-check endpoint — always available, no DB required
  if (path === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, ts: new Date().toISOString() }));
    return;
  }

  if (path === '/api/track')            { await handlers.track(req, res); return; }
  if (path === '/api/heartbeat')        { await handlers.heartbeat(req, res); return; }
  if (path === '/api/stats')            { await handlers.stats(req, res); return; }
  if (path === '/api/auth/google')      { await handlers.authGoogle(req, res); return; }
  if (path === '/api/auth/logout')      { await handlers.authLogout(req, res); return; }
  if (path === '/api/admin/delete')     { await handlers.adminDelete(req, res); return; }
  if (path === '/api/email/consent')    { await handlers.emailConsent(req, res); return; }
  if (path === '/api/telegram/webhook') { await handlers.telegramWebhook(req, res); return; }

  // Unknown /api/* path
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
}
