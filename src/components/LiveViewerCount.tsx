// src/components/LiveViewerCount.tsx
// Real-time visitor count using Firebase Realtime Database presence.
// Shows nothing when Firebase is unconfigured. Shows a live count when connected.

import React from 'react';
import { usePresence } from '../firebase/usePresence';
import { realtimeDbConfigured } from '../firebase/config';
import './LiveViewerCount.css';

export const LiveViewerCount: React.FC = () => {
  const { liveCount, status } = usePresence();

  // Never show fake numbers — hide completely when unconfigured
  if (!realtimeDbConfigured || status === 'unconfigured') return null;

  if (status === 'loading') {
    return (
      <div className="lvc-wrap lvc-loading" aria-live="polite" aria-label="Loading viewer count">
        <span className="lvc-dot lvc-dot-muted" aria-hidden="true" />
        <span className="lvc-text lvc-text-muted">connecting…</span>
      </div>
    );
  }

  if (status === 'error' || liveCount === null) {
    return (
      <div className="lvc-wrap lvc-offline" aria-label="Live count unavailable">
        <span className="lvc-dot lvc-dot-muted" aria-hidden="true" />
        <span className="lvc-text lvc-text-muted">Live count unavailable</span>
      </div>
    );
  }

  return (
    <div className="lvc-wrap lvc-live" aria-label={`${liveCount} ${liveCount === 1 ? 'person' : 'people'} viewing now`}>
      <span className="lvc-dot lvc-dot-live" aria-hidden="true" />
      <span className="lvc-count" aria-hidden="true">{liveCount}</span>
      <span className="lvc-text">
        {liveCount === 1 ? 'person' : 'people'} viewing now
      </span>
    </div>
  );
};

