// src/hooks/useAnalytics.ts
// Manages visit tracking, heartbeat, and stats polling.
// Reads notifications.json config; disables itself silently if not enabled.

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  trackVisit,
  sendHeartbeat,
  fetchStats,
  type StatsPayload,
} from '../services/analyticsService';

interface NotificationsConfig {
  enabled: boolean;
  visitorAnalytics?: {
    enabled: boolean;
    liveCounterEnabled: boolean;
    heartbeatIntervalSeconds: number;
    pollIntervalMs: number;
  };
}

const DEFAULT_STATS: StatsPayload = {
  enabled: false,
  liveVisitors: 0,
  totalVisits: 0,
  uniqueVisitors: 0,
  todayVisits: 0,
};

export function useAnalytics() {
  const [stats, setStats] = useState<StatsPayload>(DEFAULT_STATS);
  const [analyticsReady, setAnalyticsReady] = useState(false);
  const [configEnabled, setConfigEnabled] = useState(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshStats = useCallback(async () => {
    const data = await fetchStats();
    setStats(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Load public config
      let cfg: NotificationsConfig = { enabled: false };
      try {
        const res = await fetch('/data/notifications.json', {
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) cfg = await res.json() as NotificationsConfig;
      } catch {
        // Config not available — disable
      }

      if (cancelled) return;

      const analyticsEnabled =
        cfg.enabled && (cfg.visitorAnalytics?.enabled ?? false);

      setConfigEnabled(analyticsEnabled);

      if (!analyticsEnabled) {
        setAnalyticsReady(true);
        return;
      }

      const heartbeatSec = cfg.visitorAnalytics?.heartbeatIntervalSeconds ?? 30;
      const pollMs = cfg.visitorAnalytics?.pollIntervalMs ?? 30000;

      // Fire initial track + stats fetch
      await trackVisit();
      await refreshStats();
      setAnalyticsReady(true);

      // Heartbeat
      heartbeatRef.current = setInterval(sendHeartbeat, heartbeatSec * 1000);

      // Stats poll
      pollRef.current = setInterval(refreshStats, pollMs);
    }

    init();

    return () => {
      cancelled = true;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshStats]);

  return { stats, analyticsReady, configEnabled };
}
