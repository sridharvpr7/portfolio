// api/track.ts
// POST /api/track
// Records a visit event. Called once per session, not on every heartbeat.

import { v4 as uuidv4 } from 'uuid';
import type { ApiRequest, ApiResponse } from './lib/response.js';
import { getDb } from './db/client.js';
import { getAuthenticatedVisitor } from './lib/session.js';
import { rateLimit, maybePruneStore } from './lib/ratelimit.js';
import { notifyVisitor } from './lib/telegram.js';
import { isAnalyticsEnabled, isTelegramEnabled, getConfig } from './lib/config.js';

const BOT_PATTERNS = /bot|crawler|spider|headless|preview|lighthouse|pagespeed/i;

function classifyUserAgent(ua: string): { isBot: boolean; deviceClass: string } {
  if (BOT_PATTERNS.test(ua)) return { isBot: true, deviceClass: 'Bot' };
  if (/mobile|android|iphone|ipad/i.test(ua)) return { isBot: false, deviceClass: 'Mobile' };
  return { isBot: false, deviceClass: 'Desktop' };
}

export function sanitizePath(path: string): string {
  if (!path || typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
    return '/';
  }
  try {
    const url = new URL(path, 'http://localhost');
    if (url.origin !== 'http://localhost' || url.protocol !== 'http:') return '/';
    return url.pathname.slice(0, 200);
  } catch {
    return '/';
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  maybePruneStore();

  if (!isAnalyticsEnabled()) {
    return res.status(200).json({ ok: true, disabled: true });
  }

  const ip = String(req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const rl = rateLimit(`track:${ip}`, 5, 60_000);
  if (!rl.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const body = (req.body || {}) as {
    sessionToken?: string;
    pagePath?: string;
    referrer?: string;
  };

  const sessionToken = body.sessionToken || uuidv4();
  const pagePath = sanitizePath(body.pagePath || '/');
  const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 200) : null;
  const ua = String(req.headers['user-agent'] || '');
  const { isBot, deviceClass } = classifyUserAgent(ua);

  const cfg = getConfig();
  if (isBot && !cfg.visitorAnalytics.anonymousTracking) {
    return res.status(200).json({ ok: true, skipped: true });
  }

  // Check if authenticated visitor
  const session = await getAuthenticatedVisitor(req);

  try {
    const sql = getDb();

    await sql`
      INSERT INTO visit_events (session_token, visitor_account_id, page_path, referrer, user_agent_class, is_bot)
      VALUES (${sessionToken}, ${session?.sub ?? null}, ${pagePath}, ${referrer}, ${deviceClass}, ${isBot})
    `;

    // Upsert into active_sessions for live counter
    await sql`
      INSERT INTO active_sessions (session_token, visitor_account_id, page_path, is_bot, last_heartbeat_at)
      VALUES (${sessionToken}, ${session?.sub ?? null}, ${pagePath}, ${isBot}, NOW())
      ON CONFLICT (session_token) DO UPDATE
        SET last_heartbeat_at = NOW(), page_path = EXCLUDED.page_path
    `;

    // Telegram notification (skip bots, skip if disabled)
    if (isTelegramEnabled() && !isBot) {
      const tgCfg = cfg.telegram;

      if (session) {
        // Authenticated: fetch account details
        const rows = (await sql`
          SELECT display_name, total_visits, first_seen_at, last_seen_at
          FROM visitor_accounts WHERE id = ${session.sub}
        `) as Array<{
          display_name: string;
          total_visits: number;
          first_seen_at: Date;
          last_seen_at: Date;
        }>;
        if (rows.length > 0 && rows[0]) {
          const acc = rows[0];
          const isNew = acc.total_visits <= 1;
          const shouldNotify =
            isNew || (tgCfg.repeatVisitNotificationsEnabled && acc.total_visits > 1);

          if (shouldNotify) {
            await notifyVisitor({
              isNew,
              isAnonymous: false,
              displayName: acc.display_name,
              visitNumber: acc.total_visits,
              firstSeenAt: acc.first_seen_at,
              lastSeenAt: acc.last_seen_at,
              pagePath,
              deviceClass,
              referrer: referrer || undefined,
            });
          }
        }
      } else if (tgCfg.anonymousNotificationsEnabled) {
        await notifyVisitor({
          isNew: false,
          isAnonymous: true,
          pagePath,
          deviceClass,
          referrer: referrer || undefined,
        });
      }
    }

    return res.status(200).json({ ok: true, sessionToken });
  } catch (err) {
    console.error('[track] Database operation failed:', err instanceof Error ? (err.stack || err.message) : err);
    // Never expose raw DB error messages to client
    return res.status(500).json({ error: 'Internal server error' });
  }
}
