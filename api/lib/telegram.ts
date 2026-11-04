// api/lib/telegram.ts
// Telegram notification and bot command helpers — server-side only

const TG_API = 'https://api.telegram.org';
const IST_TZ = 'Asia/Kolkata';

export interface VisitorNotificationData {
  isNew: boolean;
  isAnonymous: boolean;
  displayName?: string | null;
  visitNumber?: number;
  firstSeenAt?: Date | string;
  lastSeenAt?: Date | string;
  pagePath?: string;
  deviceClass?: string;
  referrer?: string;
}

export interface VisitorStats {
  totalVisits: number;
  uniqueAccounts: number;
  uniqueAnonymous?: number;
  todayVisits: number;
  todayUnique: number;
  liveCount: number;
  liveAuthenticated: number;
  liveAnonymous: number;
  returningAccounts: number;
  newToday: number;
  topPages: Array<{ path: string; count: number }>;
}

export interface SendTelegramOptions {
  chatId?: number | string;
  parseMode?: 'MarkdownV2' | 'HTML' | 'None';
  disableWebPagePreview?: boolean;
}

export interface TelegramSendResult {
  ok: boolean;
  description?: string;
  messageId?: number;
}

export interface TelegramActivity {
  initializedAt: string;
  updatesReceivedTotal: number;
  commandsRoutedTotal: number;
  repliesSentTotal: number;
  repliesFailedTotal: number;
  lastUpdateReceivedAt?: string;
  lastCommandRouted?: string;
  lastReplySentAt?: string;
  lastReplyError?: string;
}

const activity: TelegramActivity = {
  initializedAt: new Date().toISOString(),
  updatesReceivedTotal: 0,
  commandsRoutedTotal: 0,
  repliesSentTotal: 0,
  repliesFailedTotal: 0,
};

export function getTelegramActivity(): TelegramActivity {
  return { ...activity };
}

export function recordTelegramUpdate(): void {
  activity.updatesReceivedTotal++;
  activity.lastUpdateReceivedAt = new Date().toISOString();
}

export function recordTelegramCommand(cmd: string): void {
  activity.commandsRoutedTotal++;
  activity.lastCommandRouted = cmd;
}

export function recordTelegramReply(success: boolean, error?: string): void {
  if (success) {
    activity.repliesSentTotal++;
    activity.lastReplySentAt = new Date().toISOString();
    activity.lastReplyError = undefined;
  } else {
    activity.repliesFailedTotal++;
    activity.lastReplyError = error;
  }
}

export function istNow(): string {
  const timeStr = new Date().toLocaleTimeString('en-US', {
    timeZone: IST_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${timeStr} IST`;
}

export function istDate(date: Date | string): string {
  const formatted = new Date(date).toLocaleString('en-IN', {
    timeZone: IST_TZ,
    hour12: true,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${formatted} IST`;
}

// Escape for Telegram MarkdownV2
export function esc(s: string | null | undefined): string {
  if (!s) return '—';
  return String(s).replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

// Strip Markdown symbols for safe fallback delivery
export function stripMarkdown(text: string): string {
  return text
    .replace(/\\([_*[\]()~`>#+\-=|{}.!\\])/g, '$1')
    .replace(/[*_`~]/g, '');
}

export function getAllowedChatIds(): string[] {
  const raw = process.env.TELEGRAM_CHAT_ID ?? '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Sends a message via Telegram Bot API with automatic MarkdownV2 error fallback.
 * Can be called with either targetChatId as string/number or SendTelegramOptions object.
 * Falls back to process.env.TELEGRAM_CHAT_ID if targetChatId is omitted.
 */
export async function sendTelegram(
  message: string,
  target?: number | string | SendTelegramOptions
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  let targetChatId: string | number | undefined;
  let parseMode: 'MarkdownV2' | 'HTML' | 'None' = 'MarkdownV2';
  let disablePreview = true;

  if (typeof target === 'number' || typeof target === 'string') {
    targetChatId = target;
  } else if (target && typeof target === 'object') {
    targetChatId = target.chatId;
    if (target.parseMode) parseMode = target.parseMode;
    if (typeof target.disableWebPagePreview === 'boolean') {
      disablePreview = target.disableWebPagePreview;
    }
  }

  if (!targetChatId) {
    targetChatId = process.env.TELEGRAM_CHAT_ID;
  }

  if (!token) {
    console.warn('[telegram] Cannot send message: TELEGRAM_BOT_TOKEN is not configured.');
    recordTelegramReply(false, 'Missing TELEGRAM_BOT_TOKEN');
    return { ok: false, description: 'Missing TELEGRAM_BOT_TOKEN' };
  }

  if (!targetChatId) {
    console.warn('[telegram] Cannot send message: No target chatId provided and TELEGRAM_CHAT_ID is not configured.');
    recordTelegramReply(false, 'Missing chatId');
    return { ok: false, description: 'Missing chatId' };
  }

  try {
    const payload: Record<string, unknown> = {
      chat_id: targetChatId,
      text: message,
      disable_web_page_preview: disablePreview,
    };
    if (parseMode !== 'None') {
      payload.parse_mode = parseMode;
    }

    const res = await fetch(`${TG_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      description?: string;
      result?: { message_id?: number };
      error_code?: number;
    };

    if (res.ok && data.ok) {
      recordTelegramReply(true);
      return { ok: true, messageId: data.result?.message_id };
    }

    const errDesc = data.description || `HTTP ${res.status}`;

    // If MarkdownV2 parsing fails, fall back to plain text
    if (parseMode === 'MarkdownV2') {
      console.warn(`[telegram] MarkdownV2 failed for chat ${targetChatId} (${errDesc}). Retrying in plain text...`);
      const fallbackRes = await fetch(`${TG_API}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: targetChatId,
          text: stripMarkdown(message),
          disable_web_page_preview: disablePreview,
        }),
      });

      const fallbackData = (await fallbackRes.json().catch(() => ({}))) as {
        ok?: boolean;
        description?: string;
        result?: { message_id?: number };
      };

      if (fallbackRes.ok && fallbackData.ok) {
        console.log(`[telegram] Plain text fallback succeeded for chat ${targetChatId}`);
        recordTelegramReply(true);
        return { ok: true, messageId: fallbackData.result?.message_id };
      }
    }

    console.error(`[telegram] sendMessage failed (${data.error_code || res.status}): ${errDesc}`);
    recordTelegramReply(false, errDesc);
    return { ok: false, description: errDesc };
  } catch (err) {
    console.error('[telegram] Network error:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    recordTelegramReply(false, errMsg);
    return { ok: false, description: errMsg };
  }
}

export async function notifyVisitor(data: VisitorNotificationData): Promise<void> {
  const type = data.isAnonymous
    ? 'Anonymous visit'
    : data.isNew
    ? '🆕 New recognized visitor'
    : '🔁 Returning recognized visitor';

  const lines: string[] = [
    `*📊 Portfolio Visitor Alert*`,
    ``,
    `*Visitor type:* ${esc(type)}`,
  ];

  if (!data.isAnonymous && data.displayName) {
    lines.push(`*Name:* ${esc(data.displayName)}`);
  }
  if (data.visitNumber !== undefined) {
    lines.push(`*Visit \\#:* ${esc(String(data.visitNumber))}`);
  }
  if (data.firstSeenAt) {
    lines.push(`*First visit:* ${esc(istDate(data.firstSeenAt))}`);
  }
  if (data.lastSeenAt && !data.isNew) {
    lines.push(`*Last visit:* ${esc(istDate(data.lastSeenAt))}`);
  }
  if (data.pagePath) {
    lines.push(`*Page:* ${esc(data.pagePath)}`);
  }
  if (data.deviceClass) {
    lines.push(`*Device:* ${esc(data.deviceClass)}`);
  }
  if (data.referrer) {
    lines.push(`*Referrer:* ${esc(data.referrer)}`);
  }
  lines.push(`*Time \\(IST\\):* ${esc(istNow())}`);

  await sendTelegram(lines.join('\n'));
}

// ── Command Parsing and Normalization ───────────────────

export interface ParsedTelegramCommand {
  command: string;
  rawCommand: string;
  args: string[];
  isSlashCommand: boolean;
}

export function normalizeCommandName(cmd: string): string {
  const c = cmd.toLowerCase().trim().replace(/_/g, ' ');
  if (c === 'start') return 'start';
  if (c === 'help') return 'help';
  if (c === 'views' || c === 'view') return 'views';
  if (c === 'unique' || c === 'unique visitor' || c === 'unique visitors') return 'unique';
  if (c === 'live' || c === 'live visitor' || c === 'live visitors') return 'live';
  if (c === 'total' || c === 'total visit' || c === 'total visits') return 'total';
  if (c === 'today' || c === "today's stats" || c === 'today stats' || c === 'today visits') return 'today';
  if (c === 'top' || c === 'top page' || c === 'top pages') return 'top';
  return '';
}

export function parseTelegramCommand(text: string): ParsedTelegramCommand | null {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  const tokens = trimmed.split(/\s+/);
  const first = tokens[0];

  // Slash commands: e.g. /views or /views@BotUsername
  if (first.startsWith('/')) {
    const noSlash = first.slice(1);
    // Strip @BotUsername if present
    const commandPart = noSlash.split('@')[0].toLowerCase();
    const args = tokens.slice(1);
    const normalized = normalizeCommandName(commandPart);
    return {
      command: normalized || commandPart,
      rawCommand: commandPart,
      args,
      isSlashCommand: true,
    };
  }

  // Natural text commands without slash (e.g. "views", "live visitors", "top pages")
  const lowerText = trimmed.toLowerCase().replace(/_/g, ' ');
  const normalizedText = normalizeCommandName(lowerText);
  if (normalizedText) {
    return {
      command: normalizedText,
      rawCommand: lowerText,
      args: tokens.slice(1),
      isSlashCommand: false,
    };
  }

  return null;
}

// ── Stats Reply Builders ────────────────────────────────

export function buildStatsReply(cmd: string, stats: VisitorStats): string {
  const now = esc(istNow());
  const normalized = normalizeCommandName(cmd) || cmd.toLowerCase();

  switch (normalized) {
    case 'views': {
      const topPageLines = (stats.topPages || [])
        .slice(0, 5)
        .map((p, i) => `  ${esc(String(i + 1))}\\. ${esc(p.path)} — *${esc(String(p.count))}*`);
      return [
        `*📊 Portfolio View Report*`,
        ``,
        `All\\-time total: *${esc(String(stats.totalVisits ?? 0))}*`,
        `Today: *${esc(String(stats.todayVisits ?? 0))}*`,
        `Unique sessions: *${esc(String((stats.uniqueAccounts ?? 0) + (stats.uniqueAnonymous ?? 0)))}*`,
        ``,
        `*🔝 Top Pages \\(30d\\)*`,
        ...(topPageLines.length ? topPageLines : ['  _No data yet_']),
        ``,
        `_${now}_`,
      ].join('\n');
    }

    case 'unique':
    case 'unique visitor':
      return [
        `*📊 Portfolio Visitor Statistics*`,
        ``,
        `Unique recognized visitors: *${esc(String(stats.uniqueAccounts ?? 0))}*`,
        `Anonymous browser identifiers: *${esc(String(stats.uniqueAnonymous ?? 0))}*`,
        `Today's recognized visitors: *${esc(String(stats.todayUnique ?? 0))}*`,
        `Returning recognized visitors: *${esc(String(stats.returningAccounts ?? 0))}*`,
        ``,
        `_Last updated: ${now}_`,
      ].join('\n');

    case 'live':
    case 'live visitors':
      return [
        `*🟢 Live Visitors*`,
        ``,
        `Active sessions: *${esc(String(stats.liveCount ?? 0))}*`,
        `↳ Authenticated: *${esc(String(stats.liveAuthenticated ?? 0))}*`,
        `↳ Anonymous: *${esc(String(stats.liveAnonymous ?? 0))}*`,
        ``,
        `_\\(Active within configured timeout\\)_`,
        `_${now}_`,
      ].join('\n');

    case 'total':
    case 'total visits':
      return [
        `*📈 Total Visits*`,
        ``,
        `All\\-time visits: *${esc(String(stats.totalVisits ?? 0))}*`,
        `Today's visits: *${esc(String(stats.todayVisits ?? 0))}*`,
        ``,
        `_${now}_`,
      ].join('\n');

    case 'today':
      return [
        `*📅 Today's Stats*`,
        ``,
        `Total visits today: *${esc(String(stats.todayVisits ?? 0))}*`,
        `Unique recognized: *${esc(String(stats.todayUnique ?? 0))}*`,
        `Returning recognized: *${esc(String(stats.returningAccounts ?? 0))}*`,
        ``,
        `_${now}_`,
      ].join('\n');

    case 'top':
    case 'top pages': {
      const pageLines = (stats.topPages || [])
        .slice(0, 10)
        .map((p, i) => `${esc(String(i + 1))}\\.  ${esc(p.path)} — *${esc(String(p.count))}*`);
      return [
        `*🔝 Top Pages \\(last 30 days\\)*`,
        ``,
        ...(pageLines.length ? pageLines : ['_No page view data recorded yet_']),
        ``,
        `_${now}_`,
      ].join('\n');
    }

    case 'start':
      return [
        `*👋 Welcome to Sridhar\\'s Portfolio Bot\\!*`,
        ``,
        `Live visitor tracking & analytics for [portfolio\\-0ao8\\.onrender\\.com](https://portfolio-0ao8.onrender.com)\\.`,
        ``,
        `*Available Commands:*`,
        `• /views — Full combined report`,
        `• /today — Today\\'s visits \\& unique visitors`,
        `• /live — Live active visitors right now`,
        `• /unique — Breakdown of unique visitors`,
        `• /total — All\\-time visits \\+ today count`,
        `• /top — Top 10 most visited pages`,
        `• /help — Show help reference`,
        ``,
        `_${now}_`,
      ].join('\n');

    case 'help':
      return [
        `*🤖 Portfolio Bot Commands*`,
        ``,
        `/views — quick combined view report`,
        `/today — today\\'s visitor statistics`,
        `/live — current live active sessions`,
        `/unique — unique \\& returning visitor stats`,
        `/total — all\\-time total visits`,
        `/top — top visited pages \\(last 30 days\\)`,
        `/help — show this command list`,
        ``,
        `_${now}_`,
      ].join('\n');

    default:
      return `Unknown command\\. Send \`Help\` for available commands\\.`;
  }
}

// ── Telegram Bot API Management & Webhook Diagnostics ───

export async function getTelegramBotInfo(): Promise<{ ok: boolean; bot?: Record<string, unknown>; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' };

  try {
    const res = await fetch(`${TG_API}/bot${token}/getMe`);
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: Record<string, unknown>;
      description?: string;
    };
    if (res.ok && data.ok) {
      return { ok: true, bot: data.result };
    }
    return { ok: false, error: data.description || `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getTelegramWebhookInfo(): Promise<{ ok: boolean; info?: Record<string, unknown>; error?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: 'TELEGRAM_BOT_TOKEN is not configured' };

  try {
    const res = await fetch(`${TG_API}/bot${token}/getWebhookInfo`);
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      result?: Record<string, unknown>;
      description?: string;
    };
    if (res.ok && data.ok) {
      return { ok: true, info: data.result };
    }
    return { ok: false, error: data.description || `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function setupTelegramWebhook(
  baseUrl?: string,
  dropPendingUpdates = false
): Promise<{ ok: boolean; description?: string; webhookUrl?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, description: 'TELEGRAM_BOT_TOKEN is not configured' };

  const host = baseUrl || process.env.APP_BASE_URL || 'https://portfolio-0ao8.onrender.com';
  const webhookUrl = `${host.replace(/\/+$/, '')}/api/telegram/webhook`;

  try {
    const payload: Record<string, unknown> = {
      url: webhookUrl,
      drop_pending_updates: dropPendingUpdates,
      allowed_updates: ['message', 'edited_message', 'channel_post'],
    };
    if (process.env.TELEGRAM_WEBHOOK_SECRET) {
      payload.secret_token = process.env.TELEGRAM_WEBHOOK_SECRET;
    }

    const res = await fetch(`${TG_API}/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (res.ok && data.ok) {
      return { ok: true, description: data.description || 'Webhook registered successfully', webhookUrl };
    }
    return { ok: false, description: data.description || `HTTP ${res.status}`, webhookUrl };
  } catch (err) {
    return { ok: false, description: err instanceof Error ? err.message : String(err), webhookUrl };
  }
}

export async function deleteTelegramWebhook(dropPendingUpdates = true): Promise<{ ok: boolean; description?: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, description: 'TELEGRAM_BOT_TOKEN is not configured' };

  try {
    const res = await fetch(`${TG_API}/bot${token}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ drop_pending_updates: dropPendingUpdates }),
    });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (res.ok && data.ok) {
      return { ok: true, description: data.description || 'Webhook removed successfully' };
    }
    return { ok: false, description: data.description || `HTTP ${res.status}` };
  } catch (err) {
    return { ok: false, description: err instanceof Error ? err.message : String(err) };
  }
}
