// api/lib/telegram.ts
// Telegram notification helpers — server-side only

const TG_API = 'https://api.telegram.org';
const IST_TZ = 'Asia/Kolkata';

function istNow(): string {
  const timeStr = new Date().toLocaleTimeString('en-US', {
    timeZone: IST_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${timeStr} IST`;
}

function istDate(date: Date | string): string {
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
function esc(s: string | null | undefined): string {
  if (!s) return '—';
  return s.replace(/([_*[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export async function sendTelegram(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    const res = await fetch(`${TG_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'MarkdownV2',
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error('[telegram] sendMessage failed:', body);
    }
  } catch (err) {
    console.error('[telegram] Network error:', err);
  }
}

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

// ── Stats reply builders ────────────────────────────────

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

export function buildStatsReply(cmd: string, stats: VisitorStats): string {
  const now = esc(istNow());
  switch (cmd) {
    // "views" — compact combined report for the owner
    case 'views': {
      const topPageLines = stats.topPages
        .slice(0, 5)
        .map((p, i) => `  ${esc(String(i + 1))}\\. ${esc(p.path)} — *${esc(String(p.count))}*`);
      return [
        `*📊 Portfolio View Report*`,
        ``,
        `All\\-time total: *${esc(String(stats.totalVisits))}*`,
        `Today: *${esc(String(stats.todayVisits))}*`,
        `Unique sessions: *${esc(String((stats.uniqueAccounts ?? 0) + (stats.uniqueAnonymous ?? 0)))}*`,
        ``,
        `*🔝 Top Pages \\(30d\\)*`,
        ...(topPageLines.length ? topPageLines : ['  _No data yet_']),
        ``,
        `_${now}_`,
      ].join('\n');
    }

    case 'unique visitor':
      return [
        `*📊 Portfolio Visitor Statistics*`,
        ``,
        `Unique recognized visitors: *${esc(String(stats.uniqueAccounts))}*`,
        `Anonymous browser identifiers: *${esc(String(stats.uniqueAnonymous ?? 0))}*`,
        `Today's recognized visitors: *${esc(String(stats.todayUnique))}*`,
        `Returning recognized visitors: *${esc(String(stats.returningAccounts))}*`,
        ``,
        `_Last updated: ${now}_`,
      ].join('\n');

    case 'live visitors':
      return [
        `*🟢 Live Visitors*`,
        ``,
        `Active sessions: *${esc(String(stats.liveCount))}*`,
        `↳ Authenticated: *${esc(String(stats.liveAuthenticated))}*`,
        `↳ Anonymous: *${esc(String(stats.liveAnonymous))}*`,
        ``,
        `_\\(Active within configured timeout\\)_`,
        `_${now}_`,
      ].join('\n');

    case 'total visits':
      return [
        `*📈 Total Visits*`,
        ``,
        `All\\-time visits: *${esc(String(stats.totalVisits))}*`,
        `Today's visits: *${esc(String(stats.todayVisits))}*`,
        ``,
        `_${now}_`,
      ].join('\n');

    case 'today':
      return [
        `*📅 Today's Stats*`,
        ``,
        `Total visits today: *${esc(String(stats.todayVisits))}*`,
        `Unique recognized: *${esc(String(stats.todayUnique))}*`,
        `Returning recognized: *${esc(String(stats.returningAccounts))}*`,
        ``,
        `_${now}_`,
      ].join('\n');

    case 'top pages': {
      const pageLines = stats.topPages
        .slice(0, 10)
        .map((p, i) => `${esc(String(i + 1))}\\.  ${esc(p.path)} — *${esc(String(p.count))}*`);
      return [
        `*🔝 Top Pages \\(last 30 days\\)*`,
        ``,
        ...pageLines,
        ``,
        `_${now}_`,
      ].join('\n');
    }

    case 'help':
      return [
        `*🤖 Portfolio Bot Commands*`,
        ``,
        `\`Views\` — quick combined view report`,
        `\`Unique Visitor\` — unique visitor stats`,
        `\`Live Visitors\` — current active sessions`,
        `\`Total Visits\` — all\\-time \\+ today`,
        `\`Today\` — today's stats`,
        `\`Top Pages\` — most visited pages`,
        `\`Help\` — show this message`,
      ].join('\n');

    default:
      return `Unknown command\\. Send \`Help\` for available commands\\.`;
  }
}
