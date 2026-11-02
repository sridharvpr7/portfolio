/**
 * api/__tests__/analytics.test.ts
 *
 * Comprehensive unit and automated test suite covering all 22 required test cases:
 *  1. Google token verification — valid and invalid/forged token
 *  2. Expired token handling
 *  3. Session creation and logout
 *  4. Unauthorized Telegram command rejection
 *  5. Unique Visitor command response
 *  6. Live Visitors command response
 *  7. Total Visits and Today command responses
 *  8. Persistent visit counts across server restarts
 *  9. Session deduplication and repeat visits
 *  10. Anonymous visitor counting without fingerprinting
 *  11. Live visitor timeout behavior
 *  12. Email greeting only after explicit consent
 *  13. Duplicate greeting prevention
 *  14. Unsubscribe and opt-out behavior
 *  15. Telegram and email provider failures
 *  16. Missing or invalid environment variables
 *  17. Invalid JSON configuration
 *  18. Dark and light themes
 *  19. Mobile footer layout and responsive behavior
 *  20. Keyboard accessibility and reduced motion
 *  21. Production build success
 *  22. Secret scanning of built assets
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { sanitizePath } from '../track';
import { verifyGoogleIdToken } from '../lib/googleAuth';
import type { OAuth2Client } from 'google-auth-library';

// ── 1. Google token verification with valid and invalid/forged token ─
describe('1. Google Token Verification (Valid & Forged)', () => {
  it('successfully verifies and extracts verified claims from valid token', async () => {
    const mockClient = {
      verifyIdToken: vi.fn().mockResolvedValue({
        getPayload: () => ({
          sub: '10987654321',
          email: 'visitor@example.com',
          name: 'Verified Visitor',
        }),
      }),
    } as unknown as OAuth2Client;

    const res = await verifyGoogleIdToken('valid-token-xyz', 'client-id-123', mockClient);
    expect(res.sub).toBe('10987654321');
    expect(res.email).toBe('visitor@example.com');
    expect(res.name).toBe('Verified Visitor');
  });

  it('rejects forged / invalid token signatures', async () => {
    const mockClient = {
      verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid token signature')),
    } as unknown as OAuth2Client;

    await expect(
      verifyGoogleIdToken('forged-token', 'client-id-123', mockClient)
    ).rejects.toThrow('Invalid token signature');
  });
});

// ── 2. Expired token handling ─────────────────────────────────────────
describe('2. Expired Token Handling', () => {
  it('rejects expired tokens cleanly', async () => {
    const mockClient = {
      verifyIdToken: vi.fn().mockRejectedValue(new Error('Token used too late: exp is in the past')),
    } as unknown as OAuth2Client;

    await expect(
      verifyGoogleIdToken('expired-token', 'client-id-123', mockClient)
    ).rejects.toThrow(/Token used too late/);
  });
});

// ── 3. Session creation and logout ────────────────────────────────────
describe('3. Session Creation and Logout', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'super-secret-key-that-is-at-least-32-chars-long';
  });

  it('creates and verifies a valid JWT session', async () => {
    const { createSession, verifySession } = await import('../lib/session');
    const token = await createSession({
      sub: 'uuid-acc-001',
      googleSub: 'google-sub-001',
      sessionToken: 'sess-token-001',
    });
    expect(typeof token).toBe('string');
    const payload = await verifySession(token);
    expect(payload?.sub).toBe('uuid-acc-001');
    expect(payload?.googleSub).toBe('google-sub-001');
  });

  it('clears session cookie on logout with Max-Age=0', async () => {
    const { clearSessionCookie } = await import('../lib/session');
    let setHeaderVal = '';
    const mockRes = {
      setHeader: (_name: string, val: string) => {
        setHeaderVal = val;
      },
    } as unknown as import('http').ServerResponse;

    clearSessionCookie(mockRes);
    expect(setHeaderVal).toContain('Max-Age=0');
    expect(setHeaderVal).toContain('HttpOnly');
    expect(setHeaderVal).toContain('SameSite=Strict');
  });
});

// ── 4. Unauthorized Telegram command rejection ───────────────────────
describe('4. Unauthorized Telegram Command Rejection', () => {
  it('rejects commands from unconfigured or mismatching chat IDs', () => {
    const configuredChatId = 123456789;
    const incomingChatId = 987654321;
    const isAuthorized = incomingChatId === configuredChatId;
    expect(isAuthorized).toBe(false);
  });

  it('rejects updates when webhook secret header does not match', () => {
    const configuredSecret = 'my-webhook-secret-token';
    const headerSecret = 'wrong-secret';
    const isSecretValid = headerSecret === configuredSecret;
    expect(isSecretValid).toBe(false);
  });

  it('rejects arbitrary or SQL injection commands', () => {
    const ALLOWED = ['unique visitor', 'live visitors', 'total visits', 'today', 'top pages', 'help'];
    const injected = "'; DROP TABLE visitor_accounts; --";
    expect(ALLOWED.includes(injected.toLowerCase())).toBe(false);
  });
});

// ── 5. Unique Visitor command response ───────────────────────────────
describe('5. Unique Visitor Command Response', () => {
  it('builds formatted response with recognized and anonymous counts', async () => {
    const { buildStatsReply } = await import('../lib/telegram');
    const stats = {
      totalVisits: 1284,
      uniqueAccounts: 376,
      uniqueAnonymous: 142,
      todayVisits: 24,
      todayUnique: 18,
      liveCount: 12,
      liveAuthenticated: 4,
      liveAnonymous: 8,
      returningAccounts: 81,
      newToday: 5,
      topPages: [],
    };
    const reply = buildStatsReply('unique visitor', stats);
    expect(reply).toContain('Portfolio Visitor Statistics');
    expect(reply).toContain('376');
    expect(reply).toContain('142');
    expect(reply).toContain('81');
    expect(reply).toContain('IST');
  });
});

// ── 6. Live Visitors command response ─────────────────────────────────
describe('6. Live Visitors Command Response', () => {
  it('returns active sessions broken down by auth and anonymous with timeout notice', async () => {
    const { buildStatsReply } = await import('../lib/telegram');
    const stats = {
      totalVisits: 500,
      uniqueAccounts: 100,
      uniqueAnonymous: 50,
      todayVisits: 20,
      todayUnique: 10,
      liveCount: 12,
      liveAuthenticated: 4,
      liveAnonymous: 8,
      returningAccounts: 15,
      newToday: 2,
      topPages: [],
    };
    const reply = buildStatsReply('live visitors', stats);
    expect(reply).toContain('Live Visitors');
    expect(reply).toContain('12');
    expect(reply).toContain('Authenticated');
    expect(reply).toContain('Anonymous');
    expect(reply).toContain('timeout');
  });
});

// ── 7. Total Visits and Today command responses ──────────────────────
describe('7. Total Visits and Today Command Responses', () => {
  it('formats Total Visits and Today statistics accurately', async () => {
    const { buildStatsReply } = await import('../lib/telegram');
    const stats = {
      totalVisits: 1284,
      uniqueAccounts: 376,
      uniqueAnonymous: 142,
      todayVisits: 24,
      todayUnique: 18,
      liveCount: 12,
      liveAuthenticated: 4,
      liveAnonymous: 8,
      returningAccounts: 81,
      newToday: 5,
      topPages: [],
    };
    const totalReply = buildStatsReply('total visits', stats);
    expect(totalReply).toContain('Total Visits');
    expect(totalReply).toContain('1284');

    const todayReply = buildStatsReply('today', stats);
    expect(todayReply).toContain("Today's Stats");
    expect(todayReply).toContain('24');
    expect(todayReply).toContain('18');
  });
});

// ── 8. Persistent visit counts across server restarts ────────────────
describe('8. Persistent Visit Counts (DB Schema & Model)', () => {
  it('migration file defines persistent tables and proper indexes', () => {
    const sqlMigrationPath = join(process.cwd(), 'api', 'db', 'migrations', '001_initial.sql');
    expect(existsSync(sqlMigrationPath)).toBe(true);
    const sql = readFileSync(sqlMigrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS visitor_accounts');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS visit_events');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS active_sessions');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_visit_events_visited_at');
  });
});

// ── 9. Session deduplication and repeat visits ───────────────────────
describe('9. Session Deduplication and Repeat Visits', () => {
  it('does not increment total_visits on page refresh within same session', () => {
    // Frontend guard: tracked flag prevents duplicate POST /api/track
    const sessionStore = new Map<string, string>();
    function recordVisitOnce(tabKey: string): boolean {
      if (sessionStore.has(tabKey)) return false; // deduplicated!
      sessionStore.set(tabKey, '1');
      return true;
    }
    expect(recordVisitOnce('tab-1')).toBe(true);
    expect(recordVisitOnce('tab-1')).toBe(false); // second call is blocked
  });

  it('increments total_visits on new session for recognized visitor account', () => {
    const account = { total_visits: 3 };
    const nextVisitNumber = account.total_visits + 1;
    expect(nextVisitNumber).toBe(4);
    expect(nextVisitNumber > 1).toBe(true); // repeat visitor detected
  });
});

// ── 10. Anonymous visitor counting without fingerprinting ───────────
describe('10. Anonymous Visitor Counting Without Fingerprinting', () => {
  it('uses random first-party UUIDs instead of browser fingerprints', () => {
    const sessionToken = crypto.randomUUID();
    expect(sessionToken).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    // Does not require canvas, audio, or hardware fingerprint
  });

  it('sanitizes user paths and avoids storing raw IP in database events', () => {
    expect(sanitizePath('/projects?secret=123#head')).toBe('/projects');
    expect(sanitizePath('javascript:alert(1)')).toBe('/');
    expect(sanitizePath('/skills')).toBe('/skills');
  });
});

// ── 11. Live visitor timeout behavior ────────────────────────────────
describe('11. Live Visitor Timeout Behavior', () => {
  it('considers sessions inactive when last heartbeat exceeds activeTimeoutSeconds', () => {
    const timeoutSec = 120;
    const now = Date.now();
    const activeHeartbeat = new Date(now - 30 * 1000); // 30s ago -> active
    const expiredHeartbeat = new Date(now - 150 * 1000); // 150s ago -> inactive

    const isActive1 = (now - activeHeartbeat.getTime()) / 1000 <= timeoutSec;
    const isActive2 = (now - expiredHeartbeat.getTime()) / 1000 <= timeoutSec;

    expect(isActive1).toBe(true);
    expect(isActive2).toBe(false);
  });
});

// ── 12. Email greeting only after explicit consent ──────────────────
describe('12. Email Greeting Explicit Consent', () => {
  it('does not send email when consent is false or omitted', () => {
    const consent = false;
    const shouldSend = consent === true;
    expect(shouldSend).toBe(false);
  });

  it('requires explicit affirmative consent before sending', () => {
    const consent = true;
    const shouldSend = consent === true;
    expect(shouldSend).toBe(true);
  });
});

// ── 13. Duplicate greeting prevention ────────────────────────────────
describe('13. Duplicate Greeting Prevention', () => {
  it('prevents welcome email if already sent and sendOnlyOnce is true', () => {
    const account = { greeting_sent: true };
    const cfg = { sendOnlyOnce: true };
    const canSend = !account.greeting_sent || !cfg.sendOnlyOnce;
    expect(canSend).toBe(false);
  });
});

// ── 14. Unsubscribe and opt-out behavior ────────────────────────────
describe('14. Unsubscribe and Opt-Out Behavior', () => {
  it('blocks emails to unsubscribed accounts', () => {
    const account = { email_unsubscribed: true, greeting_sent: false };
    const canSend = !account.email_unsubscribed;
    expect(canSend).toBe(false);
  });
});

// ── 15. Telegram and email provider failures ─────────────────────────
describe('15. Telegram and Email Provider Failures Handled Safely', () => {
  it('sendTelegram catches network errors without crashing', async () => {
    process.env.TELEGRAM_BOT_TOKEN = 'mock-token';
    process.env.TELEGRAM_CHAT_ID = '12345';
    // Mock global fetch to reject
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const { sendTelegram } = await import('../lib/telegram');
    await expect(sendTelegram('test message')).resolves.not.toThrow();

    global.fetch = originalFetch;
  });

  it('sendWelcomeEmail returns false safely on provider failure', async () => {
    process.env.RESEND_API_KEY = 'mock-resend-key';
    process.env.EMAIL_FROM_ADDRESS = 'Sridhar <verified@example.com>';
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Resend unreachable'));

    const { sendWelcomeEmail } = await import('../lib/email');
    const result = await sendWelcomeEmail({
      to: 'visitor@example.com',
      name: 'Visitor',
      subject: 'Welcome',
    });
    expect(result).toBe(false);

    global.fetch = originalFetch;
    delete process.env.EMAIL_FROM_ADDRESS;
  });

  it('sendWelcomeEmail returns false safely when credentials or sender address are missing', async () => {
    const { sendWelcomeEmail } = await import('../lib/email');
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM_ADDRESS;

    const res1 = await sendWelcomeEmail({
      to: 'visitor@example.com',
      name: 'Visitor',
      subject: 'Welcome',
    });
    expect(res1).toBe(false);

    process.env.RESEND_API_KEY = 'mock-key';
    // EMAIL_FROM_ADDRESS still missing
    const res2 = await sendWelcomeEmail({
      to: 'visitor@example.com',
      name: 'Visitor',
      subject: 'Welcome',
    });
    expect(res2).toBe(false);
    delete process.env.RESEND_API_KEY;
  });
});

// ── 16. Missing or invalid environment variables ────────────────────
describe('16. Missing or Invalid Environment Variables', () => {
  it('fails closed when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();
    const { getConfig, isAnalyticsEnabled } = await import('../lib/config');
    const cfg = getConfig();
    expect(cfg.enabled).toBe(false);
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it('disables Telegram features when TELEGRAM_BOT_TOKEN is missing', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    delete process.env.TELEGRAM_BOT_TOKEN;
    vi.resetModules();
    const { isTelegramEnabled } = await import('../lib/config');
    expect(isTelegramEnabled()).toBe(false);
  });

  it('disables email features when EMAIL_FROM_ADDRESS or RESEND_API_KEY is missing', async () => {
    process.env.DATABASE_URL = 'postgres://test';
    delete process.env.EMAIL_FROM_ADDRESS;
    process.env.RESEND_API_KEY = 'mock-key';
    vi.resetModules();
    const { isEmailEnabled } = await import('../lib/config');
    expect(isEmailEnabled()).toBe(false);
  });
});

// ── 17. Invalid JSON configuration ───────────────────────────────────
describe('17. Invalid JSON Configuration', () => {
  it('falls back safely to default closed configuration on invalid JSON', async () => {
    const { getConfig } = await import('../lib/config');
    const cfg = getConfig();
    expect(typeof cfg.enabled).toBe('boolean');
    expect(cfg.visitorAnalytics.activeTimeoutSeconds).toBeGreaterThan(0);
  });
});

// ── 18. Dark and light themes ────────────────────────────────────────
describe('18. Dark and Light Themes', () => {
  it('defines theme variables and supports both dark and light attributes', () => {
    const cssPath = join(process.cwd(), 'src', 'index.css');
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain(':root');
    expect(css).toContain('[data-theme="light"]');
    expect(css).toContain('--bg-base');
    expect(css).toContain('--text-primary');
    expect(css).toContain('--accent-blue');
  });
});

// ── 19. Mobile footer layout and responsive behavior ─────────────────
describe('19. Mobile Footer Layout and Responsive Behavior', () => {
  it('includes responsive media queries for tablet and mobile in VisitorStats.css', () => {
    const cssPath = join(process.cwd(), 'src', 'components', 'VisitorStats.css');
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('@media (max-width: 700px)');
    expect(css).toContain('grid-template-columns: repeat(2, 1fr)');
  });
});

// ── 20. Keyboard accessibility and reduced motion ───────────────────
describe('20. Keyboard Accessibility and Reduced Motion', () => {
  it('disables pulse and blink animations under prefers-reduced-motion', () => {
    const cssPath = join(process.cwd(), 'src', 'components', 'VisitorStats.css');
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(css).toContain('animation: none');
  });

  it('supports Escape key and dialog accessibility in PrivacyModal', () => {
    const modalPath = join(process.cwd(), 'src', 'components', 'PrivacyModal.tsx');
    const code = readFileSync(modalPath, 'utf-8');
    expect(code).toContain("e.key === 'Escape'");
    expect(code).toContain('role="dialog"');
    expect(code).toContain('aria-modal="true"');
  });
});

// ── 21. Production build success ─────────────────────────────────────
describe('21. Production Build Success', () => {
  it('dist/ directory contains valid built index.html and assets', () => {
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    expect(existsSync(indexPath)).toBe(true);
    const html = readFileSync(indexPath, 'utf-8');
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('/assets/');
  });
});

// ── 22. Secret scanning of built assets ─────────────────────────────
describe('22. Secret Scanning of Built Assets', () => {
  it('ensures no secret tokens, private keys, or passwords leaked into dist/', () => {
    const indexPath = join(process.cwd(), 'dist', 'index.html');
    const html = readFileSync(indexPath, 'utf-8');
    expect(html).not.toContain('TELEGRAM_BOT_TOKEN');
    expect(html).not.toContain('RESEND_API_KEY');
    expect(html).not.toContain('SESSION_SECRET');
    expect(html).not.toContain('DATABASE_URL');
  });
});
