// api/stats.ts
// GET /api/stats
// Returns public visitor statistics for the footer counter widget.
// No personal data exposed — only aggregate counts.

import type { ApiRequest, ApiResponse } from './lib/response.js';
import { getDb } from './db/client.js';
import { isAnalyticsEnabled, getConfig } from './lib/config.js';

export interface StatsResponse {
  liveVisitors: number;
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  enabled: boolean;
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  if (!isAnalyticsEnabled()) {
    return res.status(200).json({
      enabled: false,
      liveVisitors: 0,
      totalVisits: 0,
      uniqueVisitors: 0,
      todayVisits: 0,
    } satisfies StatsResponse);
  }

  try {
    const cfg = getConfig();
    const timeoutSec = cfg.visitorAnalytics.activeTimeoutSeconds;
    const sql = getDb();

    const [liveRow, totalsRow, todayRow] = (await Promise.all([
      // Live: sessions with heartbeat within timeout window
      sql`
        SELECT COUNT(*) AS count
        FROM active_sessions
        WHERE last_heartbeat_at > NOW() - (${timeoutSec} || ' seconds')::interval
          AND is_bot = FALSE
      `,
      // Total visits and unique (non-bot)
      sql`
        SELECT
          COUNT(*) AS total,
          COUNT(DISTINCT session_token) AS unique_sessions
        FROM visit_events
        WHERE is_bot = FALSE
      `,
      // Today (UTC date, consistent)
      sql`
        SELECT COUNT(*) AS today
        FROM visit_events
        WHERE is_bot = FALSE
          AND visited_at >= CURRENT_DATE AT TIME ZONE 'UTC'
      `,
    ])) as [
      Array<{ count: string }>,
      Array<{ total: string; unique_sessions: string }>,
      Array<{ today: string }>
    ];

    const live = Number(liveRow[0]?.count) || 0;
    const total = Number(totalsRow[0]?.total) || 0;
    const unique = Number(totalsRow[0]?.unique_sessions) || 0;
    const today = Number(todayRow[0]?.today) || 0;

    // Cache for 15s — stale-while-revalidate
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    return res.status(200).json({
      enabled: true,
      liveVisitors: live,
      totalVisits: total,
      uniqueVisitors: unique,
      todayVisits: today,
    } satisfies StatsResponse);
  } catch (err) {
    console.error('[stats] Database query error:', err instanceof Error ? (err.stack || err.message) : err);
    return res.status(500).json({
      enabled: false,
      liveVisitors: 0,
      totalVisits: 0,
      uniqueVisitors: 0,
      todayVisits: 0,
    } satisfies StatsResponse);
  }
}
