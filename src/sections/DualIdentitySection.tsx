import React, { useState } from 'react';
import { useReveal } from '../hooks/useReveal';
import type { SkillGroup } from '../services/contentLoader';
import './DualIdentitySection.css';

interface DualIdentitySectionProps {
  skillGroups: SkillGroup[];
}

export const DualIdentitySection: React.FC<DualIdentitySectionProps> = ({ skillGroups }) => {
  const [activeTab, setActiveTab] = useState<'hardware' | 'software'>('hardware');
  const { ref, isVisible } = useReveal<HTMLDivElement>({ threshold: 0.1 });

  const hardwareGroups = skillGroups.filter(g => g.domain === 'hardware');
  const softwareGroups = skillGroups.filter(g => g.domain === 'software');
  const sharedGroups = skillGroups.filter(g => g.domain === 'both');

  return (
    <section id="dual-identity" className="section dual-section" aria-labelledby="dual-title">
      <div className="container" ref={ref}>
        <div className={`dual-header ${isVisible ? 'revealed' : ''}`}>
          <div className="section-label">The Engineer's Mindset</div>
          <h2 className="section-title" id="dual-title">
            Hardware <span className="text-gradient">×</span> Software
          </h2>
          <p className="section-subtitle">
            Two disciplines, one technical mind. Click to explore each domain.
          </p>
        </div>

        <div className={`dual-toggle ${isVisible ? 'revealed' : ''}`}>
          <button
            id="tab-hardware"
            className={`dual-tab ${activeTab === 'hardware' ? 'active' : ''}`}
            onClick={() => setActiveTab('hardware')}
            aria-selected={activeTab === 'hardware'}
            role="tab"
            aria-controls="panel-hardware"
          >
            <HardwareIcon />
            ECE / Hardware
          </button>

          <div className="dual-connector" aria-hidden="true">
            <div className="dual-signal" />
          </div>

          <button
            id="tab-software"
            className={`dual-tab ${activeTab === 'software' ? 'active active-software' : ''}`}
            onClick={() => setActiveTab('software')}
            aria-selected={activeTab === 'software'}
            role="tab"
            aria-controls="panel-software"
          >
            <SoftwareIcon />
            Web / Software
          </button>
        </div>

        <div className={`dual-panels ${isVisible ? 'revealed' : ''}`} role="tabpanel">
          {/* Hardware Panel */}
          <div
            id="panel-hardware"
            className={`dual-panel hardware-panel ${activeTab === 'hardware' ? 'active' : ''}`}
            aria-label="Hardware domain"
          >
            <div className="panel-header">
              <div className="panel-icon-wrap hardware-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 60 60" fill="none" width="32" height="32">
                  <rect x="8" y="16" width="44" height="28" rx="3" stroke="var(--accent-blue)" strokeWidth="1.5"/>
                  <path d="M8 24h-6M8 36h-6M52 24h6M52 36h6M20 16V10M32 16V10M44 16V10M20 44v6M32 44v6M44 44v6" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="20" y="24" width="20" height="12" rx="2" fill="var(--accent-blue-dim)" stroke="var(--accent-blue)" strokeWidth="1"/>
                  <text x="30" y="34" textAnchor="middle" fill="var(--accent-blue)" fontSize="6" fontFamily="JetBrains Mono">MCU</text>
                </svg>
              </div>
              <div>
                <h3 className="panel-title">Electronics & Communication</h3>
                <p className="panel-desc">From logic gates to silicon — hardware that thinks</p>
              </div>
            </div>

            <div className="panel-domains">
              {hardwareGroups.map(group => (
                <div key={group.id} className="domain-card">
                  <h4 className="domain-label">{group.label}</h4>
                  <div className="domain-skills">
                    {group.skills.map(skill => (
                      <span key={skill.id} className={`chip level-chip-${skill.level}`}>
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="panel-learning">
              <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Current Focus
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Deepening VLSI design knowledge — from RTL Verilog to the physical layer. Understanding how billions of transistors become computation.
              </p>
            </div>
          </div>

          {/* Software Panel */}
          <div
            id="panel-software"
            className={`dual-panel software-panel ${activeTab === 'software' ? 'active' : ''}`}
            aria-label="Software domain"
          >
            <div className="panel-header">
              <div className="panel-icon-wrap software-icon-wrap" aria-hidden="true">
                <svg viewBox="0 0 60 60" fill="none" width="32" height="32">
                  <rect x="4" y="8" width="52" height="36" rx="4" stroke="var(--accent-violet)" strokeWidth="1.5"/>
                  <rect x="4" y="8" width="52" height="10" rx="4" fill="var(--accent-violet-dim)" stroke="var(--accent-violet)" strokeWidth="1.5"/>
                  <circle cx="14" cy="13" r="2" fill="var(--accent-violet)" opacity="0.6"/>
                  <circle cx="22" cy="13" r="2" fill="var(--accent-blue)" opacity="0.6"/>
                  <circle cx="30" cy="13" r="2" fill="var(--accent-cyan)" opacity="0.6"/>
                  <path d="M14 28l-4 4 4 4M22 36l4-4-4-4" stroke="var(--accent-violet)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M30 26l6 10" stroke="var(--accent-blue)" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="20" y="46" width="20" height="6" rx="2" fill="var(--bg-surface-2)" stroke="var(--accent-violet)" strokeWidth="1"/>
                  <rect x="8" y="52" width="44" height="3" rx="1.5" fill="var(--accent-violet-dim)" stroke="var(--accent-violet)" strokeWidth="1"/>
                </svg>
              </div>
              <div>
                <h3 className="panel-title">Web & Full-Stack Development</h3>
                <p className="panel-desc">From interfaces to APIs — software that users experience</p>
              </div>
            </div>

            <div className="panel-domains">
              {softwareGroups.map(group => (
                <div key={group.id} className="domain-card domain-card-violet">
                  <h4 className="domain-label">{group.label}</h4>
                  <div className="domain-skills">
                    {group.skills.map(skill => (
                      <span key={skill.id} className="chip chip-violet">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="panel-learning">
              <div className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Current Building
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Building full-stack applications with React and Node.js. Learning TypeScript and database design while deploying on Vercel and exploring modern authentication patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Shared skills */}
        {sharedGroups.length > 0 && (
          <div className={`dual-shared ${isVisible ? 'revealed' : ''}`}>
            <div className="dual-shared-label">
              <div className="dual-shared-line" aria-hidden="true"/>
              <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.12em', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                Shared across both worlds
              </span>
              <div className="dual-shared-line" aria-hidden="true"/>
            </div>
            <div className="dual-shared-chips">
              {sharedGroups.flatMap(g => g.skills).map(skill => (
                <span key={skill.id} className="chip chip-cyan">
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const HardwareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="6" width="20" height="14" rx="2"/>
    <path d="M2 11h20M6 6V4M10 6V4M14 6V4M18 6V4"/>
  </svg>
);

const SoftwareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);
