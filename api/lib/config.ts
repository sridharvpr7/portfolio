// api/lib/config.ts
// Parse and validate notifications.json config on the server
// Fails closed: if required env vars are missing, features are disabled

import { readFileSync } from 'fs';
import { join } from 'path';

export interface NotificationsConfig {
  enabled: boolean;
  visitorAnalytics: {
    enabled: boolean;
    liveCounterEnabled: boolean;
    totalVisitsEnabled: boolean;
    uniqueVisitorsEnabled: boolean;
    todayVisitsEnabled: boolean;
    activeTimeoutSeconds: number;
    heartbeatIntervalSeconds: number;
    anonymousTracking: boolean;
    retentionDays: number;
  };
  googleSignIn: { enabled: boolean };
  telegram: {
    enabled: boolean;
    anonymousNotificationsEnabled: boolean;
    repeatVisitNotificationsEnabled: boolean;
    deduplicationWindowSeconds: number;
  };
  emailGreeting: {
    enabled: boolean;
    requiresExplicitConsent: boolean;
    sendOnlyOnce: boolean;
    subject: string;
  };
  privacy: {
    showPrivacyNotice: boolean;
    deletionContactEmail: string;
    retentionPolicyDays: number;
  };
}

const DEFAULTS: NotificationsConfig = {
  enabled: false,
  visitorAnalytics: {
    enabled: false,
    liveCounterEnabled: false,
    totalVisitsEnabled: false,
    uniqueVisitorsEnabled: false,
    todayVisitsEnabled: false,
    activeTimeoutSeconds: 120,
    heartbeatIntervalSeconds: 30,
    anonymousTracking: false,
    retentionDays: 365,
  },
  googleSignIn: { enabled: false },
  telegram: {
    enabled: false,
    anonymousNotificationsEnabled: false,
    repeatVisitNotificationsEnabled: false,
    deduplicationWindowSeconds: 3600,
  },
  emailGreeting: {
    enabled: false,
    requiresExplicitConsent: true,
    sendOnlyOnce: true,
    subject: 'Welcome to my portfolio!',
  },
  privacy: {
    showPrivacyNotice: true,
    deletionContactEmail: '',
    retentionPolicyDays: 365,
  },
};

let _config: NotificationsConfig | null = null;

export function getConfig(): NotificationsConfig {
  if (_config) return _config;

  try {
    // Works on both Vercel (/var/task) and Render (project root via process.cwd())
    const filePath = join(process.cwd(), 'public', 'data', 'notifications.json');
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as NotificationsConfig;
    _config = { ...DEFAULTS, ...parsed };
  } catch {
    console.warn('[config] Could not load notifications.json, using safe defaults');
    _config = DEFAULTS;
  }

  // Security: master switch — if required env vars missing, disable whole system
  if (!process.env.DATABASE_URL) {
    _config = { ..._config, enabled: false };
  }

  return _config;
}

export function isAnalyticsEnabled(): boolean {
  const cfg = getConfig();
  return cfg.enabled && cfg.visitorAnalytics.enabled;
}

export function isTelegramEnabled(): boolean {
  const cfg = getConfig();
  return (
    cfg.enabled &&
    cfg.telegram.enabled &&
    Boolean(process.env.TELEGRAM_BOT_TOKEN) &&
    Boolean(process.env.TELEGRAM_CHAT_ID)
  );
}

/**
 * Email greetings via the server-side /api/email/consent endpoint.
 * Note: The portfolio contact form uses EmailJS (browser-side) — that is
 * entirely independent of this flag and does NOT require server-side config.
 * This flag only controls the server-sent welcome email for signed-in visitors.
 *
 * Server-side email is currently disabled because Resend has been removed.
 * To re-enable, add a transactional email integration and update api/lib/email.ts.
 */
export function isEmailEnabled(): boolean {
  const cfg = getConfig();
  // Server-side email greeting is disabled until a provider is configured.
  // EmailJS contact form (frontend-only) does not depend on this flag.
  return (
    cfg.enabled &&
    cfg.emailGreeting.enabled &&
    false // disabled: no server-side email provider configured
  );
}
