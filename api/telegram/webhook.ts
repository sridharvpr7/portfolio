// api/telegram/webhook.ts
// POST /api/telegram/webhook — Incoming Telegram Bot webhook update handler
// GET  /api/telegram/webhook — Safe Telegram integration diagnostics & webhook verification

import type { ApiRequest, ApiResponse } from '../lib/response.js';
import { getDb } from '../db/client.js';
import {
  buildStatsReply,
  sendTelegram,
  esc,
  parseTelegramCommand,
  getAllowedChatIds,
  recordTelegramUpdate,
  recordTelegramCommand,
  getTelegramActivity,
  getTelegramWebhookInfo,
  getTelegramBotInfo,
  setupTelegramWebhook,
  deleteTelegramWebhook,
} from '../lib/telegram.js';
import { getConfig } from '../lib/config.js';
import { rateLimit } from '../lib/ratelimit.js';
import type { VisitorStats } from '../lib/telegram.js';

interface TelegramUpdate {
  update_id?: number;
  message?: {
    message_id?: number;
    from?: { id?: number; first_name?: string; username?: string };
    chat?: { id?: number | string; type?: string };
    date?: number;
    text?: string;
  };
  edited_message?: {
    message_id?: number;
    chat?: { id?: number | string };
    text?: string;
  };
  channel_post?: {
    message_id?: number;
    chat?: { id?: number | string };
    text?: string;
  };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // ── 1. GET: Diagnostics & Webhook Health Endpoint ───────────────────────────
  if (req.method === 'GET') {
    const tokenConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN);
    const secretConfigured = Boolean(process.env.TELEGRAM_WEBHOOK_SECRET);
    const allowedChatIds = getAllowedChatIds();
    const maskedChatIds = allowedChatIds.map((id) =>
      id.length > 4 ? `${id.slice(0, 2)}***${id.slice(-2)}` : '***'
    );

    // Optional query actions: setWebhook / deleteWebhook
    const action = req.query?.action;
    let actionResult: Record<string, unknown> | undefined;

    if (action === 'setWebhook') {
      const drop = req.query?.drop === '1' || req.query?.drop === 'true';
      actionResult = await setupTelegramWebhook(
        (req.query?.url as string) || process.env.APP_BASE_URL,
        drop
      );
    } else if (action === 'deleteWebhook') {
      const drop = req.query?.drop === '1' || req.query?.drop === 'true';
      actionResult = await deleteTelegramWebhook(drop);
    }

    // Probe live Telegram Bot API if token is available
    let liveBot: Record<string, unknown> | undefined;
    let liveWebhook: Record<string, unknown> | undefined;

    if (tokenConfigured) {
      const [botRes, whRes] = await Promise.all([
        getTelegramBotInfo(),
        getTelegramWebhookInfo(),
      ]);
      if (botRes.ok) liveBot = botRes.bot;
      if (whRes.ok) liveWebhook = whRes.info;
    }

    return res.status(200).json({
      ok: true,
      service: 'portfolio-telegram-bot',
      timestamp: new Date().toISOString(),
      configured: {
        botToken: tokenConfigured,
        chatId: allowedChatIds.length > 0,
        allowedChatIdsCount: allowedChatIds.length,
        allowedChatIdsMasked: maskedChatIds,
        webhookSecret: secretConfigured,
      },
      webhookEndpoint: `${(process.env.APP_BASE_URL || 'https://sridhar-portfolio-gyoy.onrender.com').replace(/\/+$/, '')}/api/telegram/webhook`,
      activity: getTelegramActivity(),
      ...(liveBot ? { bot: liveBot } : {}),
      ...(liveWebhook ? { webhookInfo: liveWebhook } : {}),
      ...(actionResult ? { actionResult } : {}),
    });
  }

  // ── 2. Reject unsupported HTTP methods ──────────────────────────────────────
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ── 3. Validate Bot Token configuration ─────────────────────────────────────
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('[telegram/webhook] Update received, but TELEGRAM_BOT_TOKEN is not configured on Render.');
    return res.status(503).json({ error: 'TELEGRAM_BOT_TOKEN not configured' });
  }

  // ── 4. Verify webhook secret token header if configured ────────────────────
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const headerSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (headerSecret !== webhookSecret) {
      console.warn('[telegram/webhook] 403 Forbidden: Secret token header mismatch.');
      return res.status(403).json({ error: 'Webhook secret mismatch' });
    }
  }

  // ── 5. Record update telemetry & extract message payload ────────────────────
  recordTelegramUpdate();

  const update = (req.body || {}) as TelegramUpdate;
  const message = update?.message || update?.edited_message || update?.channel_post;

  const chatId = message?.chat?.id;
  const text = message?.text?.trim() ?? '';

  if (!chatId || !text) {
    return res.status(200).json({ ok: true, ignored: 'no_text_or_chat' });
  }

  // ── 6. Rate limit commands per chat ID: 20 per minute ───────────────────────
  const rl = rateLimit(`telegram:${chatId}`, 20, 60_000);
  if (!rl.allowed) {
    console.warn(`[telegram/webhook] Rate limit exceeded for chatId ${chatId}`);
    await sendTelegram('⏳ Rate limit reached. Please wait a minute before sending more commands.', chatId);
    return res.status(200).json({ ok: true, status: 'rate_limited' });
  }

  // ── 7. Authorization check ──────────────────────────────────────────────────
  const allowedChatIds = getAllowedChatIds();

  // If owner hasn't configured TELEGRAM_CHAT_ID yet, provide friendly discovery notice
  if (allowedChatIds.length === 0) {
    console.warn(`[telegram/webhook] Message received from chatId ${chatId}, but TELEGRAM_CHAT_ID is not configured in Render.`);
    await sendTelegram(
      `👋 *Welcome to Sridhar\\'s Portfolio Bot\\!*\n\n` +
      `Your Telegram Chat ID is: \`${esc(String(chatId))}\`\n\n` +
      `⚠️ *Setup Required:* Add \`TELEGRAM_CHAT_ID=${esc(String(chatId))}\` to your Render Dashboard Environment Variables to authorize analytics commands\\.`,
      chatId
    );
    return res.status(200).json({ ok: true, status: 'setup_notice_sent' });
  }

  // If configured, verify incoming chatId is in allowed list
  if (!allowedChatIds.includes(String(chatId))) {
    console.warn(`[telegram/webhook] Unauthorized command from chatId: ${chatId}`);
    await sendTelegram(
      `⛔ *Access Denied*\n\n` +
      `Your Telegram Chat ID is: \`${esc(String(chatId))}\`\\.\n\n` +
      `This bot provides private analytics for sridhar-portfolio-gyoy.onrender.com\\. If you are the owner, add your Chat ID to \`TELEGRAM_CHAT_ID\` in Render\\.`,
      chatId
    );
    return res.status(200).json({ ok: true, status: 'unauthorized_notice_sent' });
  }

  // ── 8. Command Parsing & Central Router ──────────────────────────────────────
  const parsed = parseTelegramCommand(text);

  if (!parsed || !parsed.command) {
    await sendTelegram(
      `❓ Unknown command: \`${esc(text)}\`\n\nSend /help to see all available commands\\.`,
      chatId
    );
    return res.status(200).json({ ok: true, status: 'unknown_command' });
  }

  const cmd = parsed.command;
  recordTelegramCommand(cmd);
  console.log(`[telegram/webhook] Routing command /${cmd} for chat ${chatId}`);

  // Instant commands: /start and /help do NOT hit the database
  if (cmd === 'start' || cmd === 'help') {
    const reply = buildStatsReply(cmd, {
      totalVisits: 0,
      uniqueAccounts: 0,
      todayVisits: 0,
      todayUnique: 0,
      liveCount: 0,
      liveAuthenticated: 0,
      liveAnonymous: 0,
      returningAccounts: 0,
      newToday: 0,
      topPages: [],
    });
    await sendTelegram(reply, chatId);
    return res.status(200).json({ ok: true, command: cmd });
  }

  // Stats commands: /views, /today, /live, /unique, /total, /top
  try {
    const stats = await fetchStats();
    const reply = buildStatsReply(cmd, stats);
    await sendTelegram(reply, chatId);
    return res.status(200).json({ ok: true, command: cmd });
  } catch (err) {
    console.error(`[telegram/webhook] Database/processing error for /${cmd}:`, err instanceof Error ? (err.stack || err.message) : err);
    await sendTelegram(
      `❌ *Failed to fetch stats from database*\n\n` +
      `\`${esc(err instanceof Error ? err.message : String(err))}\`\n\n` +
      `Please check DATABASE_URL connectivity on Render\\.`,
      chatId
    );
    return res.status(200).json({ ok: true, command: cmd, error: 'db_error' });
  }
}

async function fetchStats(): Promise<VisitorStats> {
  const sql = getDb();
  const cfg = getConfig();
  const timeoutSec = cfg.visitorAnalytics?.activeTimeoutSeconds || 120;

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
    topPages: (topRows || []).map((r) => ({
      path: r.path,
      count: Number(r.count),
    })),
  };
}
