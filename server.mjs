/**
 * server.mjs
 * Render Web Service entry-point.
 *
 * Run with:  node --import tsx/esm server.mjs
 * (tsx is listed in devDependencies and installed by `npm ci`)
 *
 * Responsibilities:
 *  - Serve the Vite-built dist/ directory as static files.
 *  - Mount all API route handlers (ported from Vercel serverless functions).
 *  - Fall back to dist/index.html for SPA navigation.
 *  - Apply the same caching headers that vercel.json declared.
 *  - Listen on 0.0.0.0:PORT (Render sets PORT automatically).
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Routing helpers (pure functions, independently testable)
import {
  dispatchApi,
  parseJsonBody,
  getCacheHeader,
  isSpaRoute,
} from './api/server-router.ts';

// ── Path helpers ─────────────────────────────────────────────────────────────
const __dirname  = fileURLToPath(new URL('.', import.meta.url));
const DIST_DIR   = join(__dirname, 'dist');
const INDEX_HTML = join(DIST_DIR, 'index.html');

// ── MIME types for static files ───────────────────────────────────────────────
const MIME = /** @type {Record<string, string>} */ ({
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript; charset=utf-8',
  '.mjs':   'application/javascript; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.json':  'application/json; charset=utf-8',
  '.svg':   'image/svg+xml',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.webp':  'image/webp',
  '.gif':   'image/gif',
  '.ico':   'image/x-icon',
  '.pdf':   'application/pdf',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.txt':   'text/plain; charset=utf-8',
  '.xml':   'application/xml',
  '.webmanifest': 'application/manifest+json',
});

function getMime(filePath) {
  return MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

// ── Static file helper ────────────────────────────────────────────────────────
function serveFile(res, filePath, cacheHeader) {
  if (!existsSync(filePath)) return false;
  // Ensure it's a file, not a directory
  try {
    const st = statSync(filePath);
    if (!st.isFile()) return false;
  } catch {
    return false;
  }
  const content = readFileSync(filePath);
  res.writeHead(200, {
    'Content-Type':   getMime(filePath),
    'Cache-Control':  cacheHeader,
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(content);
  return true;
}

// ── Lazy-import API route handlers ───────────────────────────────────────────
async function loadHandlers() {
  const [
    { default: track },
    { default: heartbeat },
    { default: stats },
    { default: authGoogle },
    { default: authLogout },
    { default: adminDelete },
    { default: emailConsent },
    { default: telegramWebhook },
    { default: contact },
    { default: aiChat },
    { default: githubActivity },
  ] = await Promise.all([
    import('./api/track.ts'),
    import('./api/heartbeat.ts'),
    import('./api/stats.ts'),
    import('./api/auth/google.ts'),
    import('./api/auth/logout.ts'),
    import('./api/admin/delete.ts'),
    import('./api/email/consent.ts'),
    import('./api/telegram/webhook.ts'),
    import('./api/contact.ts'),
    import('./api/ai/chat.ts'),
    import('./api/github/activity.ts'),
  ]);

  return {
    track,
    heartbeat,
    stats,
    authGoogle,
    authLogout,
    adminDelete,
    emailConsent,
    telegramWebhook,
    contact,
    aiChat,
    githubActivity,
  };
}

// ── Request router ────────────────────────────────────────────────────────────
async function router(req, res, handlers) {
  const url  = new URL(req.url, 'http://localhost');
  const path = url.pathname;

  // Security header on every response
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // ── API routes ────────────────────────────────────────────────────────────
  if (path.startsWith('/api/')) {
    // Parse JSON body (Vercel does this automatically; we replicate it here)
    req.body = await parseJsonBody(req);

    try {
      await dispatchApi(req, res, handlers);
    } catch (err) {
      console.error(`[server] Unhandled error in ${path}:`, err);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
    return;
  }

  // ── Static assets with immutable cache headers ────────────────────
  if (!isSpaRoute(path)) {
    // /assets/* (Vite-hashed bundles) or /data/* (JSON content files)
    const filePath = join(DIST_DIR, path);
    if (serveFile(res, filePath, getCacheHeader(path))) return;
    res.writeHead(404); res.end(); return;
  }

  // ── Exact static file match (favicon.svg, robots.txt, PDFs, etc.) ────────
  if (path !== '/') {
    const candidate = join(DIST_DIR, path);
    if (serveFile(res, candidate, getCacheHeader(path))) return;
  }

  // ── SPA fallback — all remaining GET requests → index.html ───────────────
  if (req.method === 'GET') {
    if (serveFile(res, INDEX_HTML, 'no-cache')) return;
  }

  res.writeHead(404); res.end();
}

// ── Server startup ────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(INDEX_HTML)) {
    console.error(
      '[server] dist/index.html not found.\n' +
      '         Run `npm run build` before starting the server.\n' +
      '         On Render this is handled automatically by the build command.'
    );
    process.exit(1);
  }

  let handlers;
  try {
    handlers = await loadHandlers();
    console.log('[server] All API handlers loaded successfully.');
  } catch (err) {
    console.error('[server] Failed to load API handlers:', err);
    process.exit(1);
  }

  const PORT = parseInt(process.env.PORT ?? '3000', 10);
  const HOST = '0.0.0.0';  // Required for Render — do not use 'localhost'

  const server = createServer((req, res) => {
    router(req, res, handlers).catch(err => {
      console.error('[server] Unhandled router error:', err);
      if (!res.headersSent) { res.writeHead(500); res.end(); }
    });
  });

  server.listen(PORT, HOST, async () => {
    console.log(`[server] Listening on http://${HOST}:${PORT}`);
    console.log(`[server] Health-check:  http://${HOST}:${PORT}/api/health`);
    const tgToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
    const tgChat = Boolean(process.env.TELEGRAM_CHAT_ID);
    const tgSecret = Boolean(process.env.TELEGRAM_WEBHOOK_SECRET);
    console.log(`[telegram] Integration: Bot token = ${tgToken ? 'CONFIGURED' : 'NOT SET'}, Chat ID = ${tgChat ? 'CONFIGURED' : 'NOT SET'}, Secret = ${tgSecret ? 'CONFIGURED' : 'NOT SET'}`);
    const host = (process.env.APP_BASE_URL || `http://${HOST}:${PORT}`).replace(/\/+$/, '');
    const webhookEndpoint = `${host}/api/telegram/webhook`;
    console.log(`[telegram] Webhook endpoint: ${webhookEndpoint}`);

    // Auto-register webhook with Telegram if TELEGRAM_BOT_TOKEN is present and host is HTTPS
    if (tgToken) {
      try {
        const { setupTelegramWebhook, getTelegramWebhookInfo } = await import('./api/lib/telegram.ts');
        if (webhookEndpoint.startsWith('https://')) {
          const current = await getTelegramWebhookInfo();
          if (current.ok && current.info?.url !== webhookEndpoint) {
            console.log(`[telegram] Current Telegram webhook URL is "${current.info?.url || '(none)'}". Registering: ${webhookEndpoint}...`);
            const res = await setupTelegramWebhook(host, false);
            console.log(`[telegram] Webhook auto-registration: ${res.ok ? 'SUCCESS' : 'FAILED'} — ${res.description || ''}`);
          } else if (current.ok && current.info?.url === webhookEndpoint) {
            console.log(`[telegram] Webhook is already correctly registered on Telegram: ${webhookEndpoint}`);
          } else {
            console.warn(`[telegram] Could not query getWebhookInfo (${current.error || 'unknown error'}). Attempting registration...`);
            const res = await setupTelegramWebhook(host, false);
            console.log(`[telegram] Webhook registration: ${res.ok ? 'SUCCESS' : 'FAILED'} — ${res.description || ''}`);
          }
        } else {
          console.log(`[telegram] Webhook auto-registration skipped (non-HTTPS URL: ${host}). Configure APP_BASE_URL=https://... in Render.`);
        }
      } catch (err) {
        console.warn('[telegram] Error during webhook auto-registration:', err instanceof Error ? err.message : err);
      }
    }
  });

  // Graceful shutdown on Render SIGTERM
  for (const sig of ['SIGTERM', 'SIGINT']) {
    process.on(sig, () => {
      console.log(`[server] ${sig} — shutting down gracefully.`);
      server.close(() => process.exit(0));
    });
  }
}

main();
