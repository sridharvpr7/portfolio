import React from 'react';
import type { StatsPayload } from '../services/analyticsService';
import './VisitorStats.css';

interface VisitorStatsProps {
  stats: StatsPayload;
  ready: boolean;
  configEnabled: boolean;
}

function formatNumber(n: number): string {
  if (n === 0) return '—';
  return n.toLocaleString('en-IN');
}

export const VisitorStats: React.FC<VisitorStatsProps> = ({ stats, ready, configEnabled }) => {
  // If analytics is not configured, render nothing
  if (!configEnabled) return null;

  const showSkeleton = !ready;

  return (
    <section className="visitor-stats" aria-label="Portfolio views">
      <div className="vs-rule" aria-hidden="true" />
      <div className="vs-inner vs-single">
        <p className="vs-eyebrow" aria-hidden="true">
          <span className="vs-eyebrow-dot" />
          Portfolio Activity
        </p>
        <div className="vs-grid vs-grid-single" role="list">
          <div role="listitem">
            <div className="vs-item vs-item--accent">
              <div className="vs-value">
                {showSkeleton ? '…' : formatNumber(stats.totalVisits)}
              </div>
              <div className="vs-label">Total Views</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
