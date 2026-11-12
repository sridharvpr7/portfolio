// src/services/analyticsService.ts
// Frontend analytics service — communicates with Vercel API routes.
// Degrades gracefully: if backend is unreachable, the portfolio still works.

export interface StatsPayload {
  enabled: boolean;
  liveVisitors: number;
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
}

const DISABLED_STATS: StatsPayload = {
  enabled: false,
  liveVisitors: 0,
  totalVisits: 0,
  uniqueVisitors: 0,
  todayVisits: 0,
};

const SESSION_KEY = 'pf_sid';
const TRACKED_KEY = 'pf_tracked';

// Generate or retrieve an opaque first-party session token
function getSessionToken(): string {
  try {
    let token = sessionStorage.getItem(SESSION_KEY);
    if (!token) {
      token = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, token);
    }
    return token;
  } catch {
    return crypto.randomUUID();
  }
}

// Track a single visit (called once per session)
export async function trackVisit(): Promise<void> {
  try {
    // Only track once per session tab
    if (sessionStorage.getItem(TRACKED_KEY)) return;
    sessionStorage.setItem(TRACKED_KEY, '1');
  } catch {
    // sessionStorage unavailable — proceed anyway
  }

  const sessionToken = getSessionToken();
  const pagePath = window.location.pathname;
  const referrer =
    document.referrer && new URL(document.referrer).hostname !== window.location.hostname
      ? document.referrer
      : '';

  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken, pagePath, referrer }),
      // Don't wait more than 5s
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Silently fail — analytics unavailable
  }
}

// Send a heartbeat (keep session alive in active_sessions)
export async function sendHeartbeat(): Promise<void> {
  const sessionToken = getSessionToken();
  try {
    await fetch('/api/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionToken }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Silently fail
  }
}

// Fetch aggregate stats for the counter widget
export async function fetchStats(): Promise<StatsPayload> {
  try {
    const res = await fetch('/api/stats', {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return DISABLED_STATS;
    const data = await res.json() as StatsPayload;
    return data;
  } catch {
    return DISABLED_STATS;
  }
}

// Authenticate with Google ID token
export async function authenticateGoogle(credential: string): Promise<{
  ok: boolean;
  displayName?: string;
  visitNumber?: number;
  isNew?: boolean;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
      credentials: 'include',
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json() as { ok?: boolean; displayName?: string; visitNumber?: number; isNew?: boolean; error?: string };
    if (data.ok) {
      return {
        ok: true,
        displayName: data.displayName,
        visitNumber: data.visitNumber,
        isNew: data.isNew,
      };
    }
    return { ok: false, error: data.error || 'Sign-in failed' };
  } catch {
    return { ok: false, error: 'Network error' };
  }
}

// Logout
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Ignore
  }
}

// Record explicit email greeting consent
export async function submitEmailConsent(consent: boolean): Promise<{ ok: boolean; sent?: boolean; reason?: string }> {
  try {
    const res = await fetch('/api/email/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent }),
      credentials: 'include',
      signal: AbortSignal.timeout(8000),
    });
    return await res.json() as { ok: boolean; sent?: boolean; reason?: string };
  } catch {
    return { ok: false };
  }
}

// Request deletion of account data (GDPR soft-delete)
export async function deleteAccount(): Promise<{ ok: boolean; message?: string }> {
  try {
    const res = await fetch('/api/admin/delete', {
      method: 'POST',
      credentials: 'include',
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json() as { ok?: boolean; message?: string };
    return { ok: Boolean(data.ok), message: data.message };
  } catch {
    return { ok: false, message: 'Network error' };
  }
}
