import type { ApiRequest, ApiResponse } from '../lib/response.js';
import { getDb } from '../db/client.js';
import { buildStatsReply, sendTelegram } from '../lib/telegram.js';
import { isTelegramEnabled, getConfig } from '../lib/config.js';
import { rateLimit } from '../lib/ratelimit.js';
import type { VisitorStats } from '../lib/telegram.js';

// All commands the bot understands.
// "views" is an alias that returns the full expanded report (total, today, unique, top pages).
const ALLOWED_COMMANDS = [
  'views',
  'unique visitor',
  'live visitors',
  'total visits',
  'today',
  'top pages',
  'help',
];

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  if (!isTelegramEnabled()) {
    return res.status(503).end();
  }

  // Verify webhook secret if configured
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const headerSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (headerSecret !== webhookSecret) {
      return res.status(403).end();
    }
  }

  const update = (req.body || {}) as {
    message?: {
      chat?: { id: number };
      text?: string;
    };
  };

  const chatId = update?.message?.chat?.id;
  const text = update?.message?.text?.trim() ?? '';

  if (!chatId || !text) {
    return res.status(200).end();
  }

  // Security: only owner can run commands
  const allowedChatId = Number(process.env.TELEGRAM_CHAT_ID);
  if (!allowedChatId || chatId !== allowedChatId) {
    return res.status(200).end(); // silently ignore
  }

  // Rate limit commands per chat ID: 20 per minute
  const rl = rateLimit(`telegram:${chatId}`, 20, 60_000);
  if (!rl.allowed) {
    return res.status(429).end();
  }

  // Normalize command: handles case-insensitivity, leading slashes (/help, /live_visitors, /views)
  let cmd = text.toLowerCase().replace(/^\//, '').replace(/_/g, ' ').trim();
  if (cmd === 'start') {
    cmd = 'help';
  }

  if (!ALLOWED_COMMANDS.includes(cmd)) {
    await sendTelegram(`Unknown command\\. Send \`Help\` for available commands\\.`);
    return res.status(200).end();
  }

  try {
    const stats = await fetchStats();
    const reply = buildStatsReply(cmd, stats);
    await sendTelegram(reply);
  } catch (err) {
    console.error('[telegram/webhook] Database/processing error:', err instanceof Error ? (err.stack || err.message) : err);
    await sendTelegram('❌ Failed to fetch stats\\. Check server logs\\.');
  }

  return res.status(200).end();
}

async function fetchStats(): Promise<VisitorStats> {
  const sql = getDb();
  const cfg = getConfig();
  const timeoutSec = cfg.visitorAnalytics.activeTimeoutSeconds;

  const [liveRows, totalRows, todayRows, uniqueRows, anonRows, topRows] = (await Promise.all([
    sql`
      SELECT
        COUNT(*) AS total,
        COUNT(CASE WHEN visitor_account_id IS NOT NULL THEN 1 END) AS auth,
        COUNT(CASE WHEN visitor_account_id IS NULL THEN 1 END) AS anon
      FROM active_sessions
      WHERE last_heartbeat_at > NOW() - (${timeoutSec} || ' seconds')::interval
        AND is_bot = FALSE
    `,
    sql`
      SELECT COUNT(*) AS total
      FROM visit_events WHERE is_bot = FALSE
    `,
    sql`
      SELECT COUNT(*) AS today
      FROM visit_events
      WHERE is_bot = FALSE AND visited_at >= CURRENT_DATE AT TIME ZONE 'UTC'
    `,
    sql`
      SELECT
        COUNT(DISTINCT google_sub) AS unique_accounts,
        COUNT(DISTINCT CASE WHEN total_visits > 1 THEN id END) AS returning_accounts,
        COUNT(DISTINCT CASE WHEN DATE(first_seen_at) = CURRENT_DATE THEN id END) AS new_today,
        COUNT(DISTINCT CASE WHEN DATE(last_seen_at) = CURRENT_DATE THEN id END) AS today_unique
      FROM visitor_accounts
      WHERE deleted_at IS NULL
    `,
    sql`
      SELECT COUNT(DISTINCT session_token) AS unique_anon
      FROM visit_events
      WHERE is_bot = FALSE AND visitor_account_id IS NULL
    `,
    sql`
      SELECT page_path AS path, COUNT(*) AS count
      FROM visit_events
      WHERE is_bot = FALSE
        AND visited_at > NOW() - INTERVAL '30 days'
      GROUP BY page_path
      ORDER BY count DESC
      LIMIT 10
    `,
  ])) as [
    Array<{ total: string; auth: string; anon: string }>,
    Array<{ total: string }>,
    Array<{ today: string }>,
    Array<{ unique_accounts: string; returning_accounts: string; new_today: string; today_unique: string }>,
    Array<{ unique_anon: string }>,
    Array<{ path: string; count: string }>
  ];

  const live = liveRows[0] || { total: '0', auth: '0', anon: '0' };
  const total = totalRows[0] || { total: '0' };
  const today = todayRows[0] || { today: '0' };
  const uniq = uniqueRows[0] || {
    unique_accounts: '0',
    returning_accounts: '0',
    new_today: '0',
    today_unique: '0',
  };
  const anon = anonRows[0] || { unique_anon: '0' };

  return {
    liveCount: Number(live.total) || 0,
    liveAuthenticated: Number(live.auth) || 0,
    liveAnonymous: Number(live.anon) || 0,
    totalVisits: Number(total.total) || 0,
    todayVisits: Number(today.today) || 0,
    uniqueAccounts: Number(uniq.unique_accounts) || 0,
    uniqueAnonymous: Number(anon.unique_anon) || 0,
    returningAccounts: Number(uniq.returning_accounts) || 0,
    newToday: Number(uniq.new_today) || 0,
    todayUnique: Number(uniq.today_unique) || 0,
    topPages: topRows.map((r) => ({
      path: r.path,
      count: Number(r.count),
    })),
  };
}
