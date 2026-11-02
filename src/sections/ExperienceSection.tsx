import React from 'react';
import { useReveal } from '../hooks/useReveal';
import type { ExperienceEntry, Certification, Achievement } from '../services/contentLoader';
import './ExperienceSection.css';

interface ExperienceSectionProps {
  entries: ExperienceEntry[];
  certifications?: Certification[];
  achievements?: Achievement[];
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  entries,
  certifications = [],
  achievements = [],
}) => {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ threshold: 0.08 });
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const visibleCerts = certifications.filter(c => c.visible !== false);
  const visibleAchievements = achievements.filter(a => a.visible !== false);

  return (
    <section id="experience" className="section experience-section" aria-labelledby="exp-title">
      <div className="container" ref={ref}>

        <div className={`exp-header ${isVisible ? 'revealed' : ''}`}>
          <div className="section-label">Learning Journey</div>
          <h2 className="section-title" id="exp-title">How I Got Here</h2>
          <p className="section-subtitle">
            A timeline of key milestones — academic, personal, and technical.
          </p>
        </div>

        {sorted.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>
            Journey milestones coming soon.
          </p>
        ) : (
          <div className={`exp-timeline ${isVisible ? 'revealed' : ''}`} role="list">
            {sorted.map((entry, i) => (
              <TimelineEntry key={entry.id} entry={entry} index={i} isLast={i === sorted.length - 1} />
            ))}
          </div>
        )}

        {/* Certifications Gallery (if any) */}
        {visibleCerts.length > 0 && (
          <div className="exp-credentials-sub">
            <div className="exp-sub-header">
              <div className="section-label">Verified Credentials</div>
              <h3 className="exp-sub-title">Certifications</h3>
            </div>
            <div className="cert-grid" role="list">
              {visibleCerts.map((cert) => (
                <div key={cert.id} className="cert-card card" role="listitem">
                  <div className="cert-card-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6"/>
                      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                    </svg>
                  </div>
                  <div className="cert-card-content">
                    <h4 className="cert-title">{cert.title}</h4>
                    <div className="cert-meta">
                      <span className="cert-issuer">{cert.issuer}</span>
                      {cert.date && <span className="cert-date font-mono">{formatDate(cert.date)}</span>}
                    </div>
                    <div className="cert-actions">
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-sm"
                        >
                          Verify
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      )}
                      {cert.certificateFile && (
                        <a
                          href={cert.certificateFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                        >
                          View PDF
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements (if any) */}
        {visibleAchievements.length > 0 && (
          <div className="exp-credentials-sub">
            <div className="exp-sub-header">
              <div className="section-label">Honors &amp; Recognition</div>
              <h3 className="exp-sub-title">Achievements</h3>
            </div>
            <div className="achievement-grid" role="list">
              {visibleAchievements.map((ach) => (
                <div key={ach.id} className="achievement-card card" role="listitem">
                  <div className="achievement-icon" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                      <path d="M4 22h16"/>
                      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
                      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
                      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
                    </svg>
                  </div>
                  <div className="achievement-content">
                    <h4 className="achievement-title">{ach.title}</h4>
                    <div className="achievement-meta">
                      <span className="achievement-issuer">{ach.issuerOrEvent}</span>
                      {ach.date && <span className="achievement-date font-mono">{formatDate(ach.date)}</span>}
                    </div>
                    {ach.description && <p className="achievement-desc">{ach.description}</p>}
                    {ach.url && (
                      <a href={ach.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
                        Details
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

const TimelineEntry: React.FC<{
  entry: ExperienceEntry;
  index: number;
  isLast: boolean;
}> = ({ entry, index, isLast }) => {
  const isLeft = index % 2 === 0;
  const { ref, isVisible } = useReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div
      ref={ref}
      className={`timeline-item ${isLeft ? 'timeline-left' : 'timeline-right'} ${isVisible ? 'revealed' : ''}`}
      style={{ transitionDelay: `${index * 0.1}s` }}
      role="listitem"
    >
      {/* Connector line */}
      {!isLast && <div className="timeline-line" aria-hidden="true" />}

      {/* Center dot */}
      <div className="timeline-dot-wrap" aria-hidden="true">
        <div className="timeline-dot">
          <TypeIcon type={entry.type} />
        </div>
      </div>

      {/* Date badge */}
      <div className="timeline-date">
        <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.08em' }}>
          {formatDate(entry.date)}
        </span>
      </div>

      {/* Content */}
      <div className="timeline-card card">
        <div className="timeline-card-header">
          <h3 className="timeline-title">{entry.title}</h3>
          <span className="timeline-org">{entry.organization}</span>
        </div>

        <p className="timeline-desc">{entry.description}</p>

        {entry.tags.length > 0 && (
          <div className="timeline-tags">
            {entry.tags.map(tag => (
              <span key={tag} className="chip" style={{ fontSize: '0.7rem' }}>{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
  if (type === 'education') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    );
  }
  if (type === 'job') {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
};

function formatDate(d: string) {
  const [year, month] = d.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return month ? `${months[parseInt(month) - 1]} ${year}` : year;
}
