import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, Download, FileText } from 'lucide-react';
import { useReveal } from '../hooks/useReveal';
import { useLanguage } from '../hooks/useLanguage';
import type { ExperienceEntry, Certification, Achievement } from '../services/contentLoader';
import './ExperienceSection.css';

interface ExperienceSectionProps {
  entries: ExperienceEntry[];
  certifications?: Certification[];
  achievements?: Achievement[];
}

const CERT_CATEGORIES = [
  { id: 'all', label: 'All Credentials' },
  { id: 'internship', label: 'Internships' },
  { id: 'web', label: 'Web & Software' },
  { id: 'hardware', label: 'ECE & VLSI' },
] as const;

type CertCategory = typeof CERT_CATEGORIES[number]['id'];

function matchCertCategory(cert: Certification, cat: CertCategory): boolean {
  if (cat === 'all') return true;
  if (cat === 'internship') return !!cert.isInternship;
  const text = `${cert.title} ${cert.issuer || ''} ${cert.description || ''}`.toLowerCase();
  if (cat === 'hardware') {
    return text.includes('vlsi') || text.includes('electronics') || text.includes('iot');
  }
  if (cat === 'web') {
    return text.includes('html') || text.includes('css') || text.includes('javascript') || text.includes('frontend') || text.includes('mongodb') || text.includes('github') || text.includes('copilot');
  }
  return true;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({
  entries,
  certifications = [],
  achievements = [],
}) => {
  const { ref, isVisible } = useReveal<HTMLDivElement>({ threshold: 0.08 });
  const { t } = useLanguage();
  const sorted = [...entries].sort((a, b) => a.order - b.order);
  const visibleCerts = certifications.filter(c => c.visible !== false);
  const visibleAchievements = achievements.filter(a => a.visible !== false);

  const [selectedCategory, setSelectedCategory] = useState<CertCategory>('all');
  const [activeCert, setActiveCert] = useState<{
    title: string;
    image: string;
    issuer?: string;
    file?: string;
    isPdf?: boolean;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const filteredCerts = visibleCerts.filter(c => matchCertCategory(c, selectedCategory));

  const handleOpenLightbox = (cert: Certification, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const file = cert.certificateFile;
    const isFilePdf = !!(file && file.toLowerCase().endsWith('.pdf'));
    const imageCandidate = cert.thumbnail || (isFilePdf ? '' : file);

    setActiveCert({
      title: cert.title,
      image: imageCandidate || file || '',
      issuer: cert.organization || cert.issuer,
      file: file,
      isPdf: isFilePdf && !cert.thumbnail,
    });
    setZoomLevel(1);
  };

  const handleCloseLightbox = () => {
    setActiveCert(null);
    setZoomLevel(1);
  };

  const toggleZoom = () => {
    setZoomLevel(prev => (prev === 1 ? 1.6 : prev === 1.6 ? 2.2 : 1));
  };

  useEffect(() => {
    if (!activeCert) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseLightbox();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel(prev => Math.min(prev + 0.4, 2.5));
      } else if (e.key === '-') {
        setZoomLevel(prev => Math.max(prev - 0.4, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [activeCert]);

  return (
    <section id="experience" className="section experience-section" aria-labelledby="exp-title">
      <div className="container" ref={ref}>

        <div className={`exp-header ${isVisible ? 'revealed' : ''}`}>
          <div className="section-label">{t('journey_label')}</div>
          <h2 className="section-title" id="exp-title">{t('journey_title')}</h2>
          <p className="section-subtitle">
            {t('journey_subtitle')}
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
          <div id="certifications" className="exp-credentials-sub">
            <div className="exp-sub-header">
              <div className="exp-sub-header-top">
                <div>
                  <div className="section-label">{t('creds_label')}</div>
                  <h3 className="exp-sub-title">{t('creds_title')}</h3>
                </div>
                <div className="cert-scroll-hint">
                  <span className="cert-count-pill">{filteredCerts.length} of {visibleCerts.length} Credentials</span>
                  <span className="cert-scroll-label">Scroll inside to view all ↓</span>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="cert-filters" role="group" aria-label="Filter credentials by category">
                {CERT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    id={`cert-cat-${cat.id}`}
                    type="button"
                    className={`cert-filter-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                    aria-pressed={selectedCategory === cat.id}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cert-scroll-container">
              <div className="cert-grid" role="list">
                {filteredCerts.map((cert) => (
                  <div
                    key={cert.id}
                    className={`cert-card card ${cert.isInternship ? 'cert-card-internship' : ''}`}
                    role="listitem"
                  >
                    {(cert.thumbnail || cert.certificateFile) && (
                      <button
                        type="button"
                        className="cert-thumb-link"
                        onClick={(e) => handleOpenLightbox(cert, e)}
                        aria-label={`Preview certificate: ${cert.title}`}
                        title="Click to preview certificate full resolution"
                      >
                        <img
                          src={cert.thumbnail || cert.certificateFile}
                          alt={`${cert.title} certificate`}
                          className="cert-thumb"
                          loading="lazy"
                          onError={(e) => {
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              e.currentTarget.style.display = 'none';
                              const fallback = parent.querySelector('.cert-thumb-fallback') as HTMLElement | null;
                              if (fallback) fallback.style.display = 'flex';
                            }
                          }}
                        />
                        <div className="cert-thumb-fallback" style={{ display: 'none' }} aria-hidden="true">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <circle cx="12" cy="14" r="3"/>
                          </svg>
                          <span className="fallback-text">{cert.issuer}</span>
                        </div>
                        <div className="cert-thumb-overlay" aria-hidden="true">
                          <Maximize2 size={22} />
                          <span className="cert-thumb-overlay-text">Preview</span>
                        </div>
                      </button>
                    )}
                    <div className="cert-card-content">
                      <div className="cert-card-header">
                        <div className="cert-card-icon" aria-hidden="true">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="8" r="6"/>
                            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                          </svg>
                        </div>
                        {(cert.isInternship || cert.badge) && (
                          <span className="cert-badge-tag">{cert.badge || 'Internship'}</span>
                        )}
                      </div>
                      <div
                        className="cert-card-body cert-card-clickable"
                        onClick={(e) => handleOpenLightbox(cert, e)}
                        title="Click to preview certificate"
                      >
                        <h4 className="cert-title">{cert.title}</h4>
                        <div className="cert-meta">
                          <span className="cert-issuer">{cert.organization || cert.issuer}</span>
                          {cert.date && <span className="cert-date font-mono">{formatDate(cert.date)}</span>}
                        </div>
                        {cert.description && (
                          <p className="cert-description">{cert.description}</p>
                        )}
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
                            download
                            className="btn btn-ghost btn-sm cert-download-btn"
                            aria-label={`Download ${cert.title} certificate`}
                            title="Download certificate"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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

        {/* Certificate Fullscreen Lightbox Modal */}
        {activeCert && (
          <div
            className="cert-lightbox-backdrop"
            onClick={handleCloseLightbox}
            role="dialog"
            aria-modal="true"
            aria-label={`${activeCert.title} preview`}
          >
            <div className="cert-lightbox-topbar" onClick={(e) => e.stopPropagation()}>
              <div className="cert-lightbox-info">
                <span className="cert-lightbox-title" title={activeCert.title}>
                  {activeCert.title}
                </span>
                {activeCert.issuer && (
                  <span className="cert-lightbox-issuer">{activeCert.issuer}</span>
                )}
              </div>

              <div className="cert-lightbox-controls">
                {activeCert.file && (
                  <a
                    href={activeCert.file}
                    download
                    className="cert-lightbox-btn cert-lightbox-download-btn"
                    aria-label={`Download ${activeCert.title} certificate`}
                    title="Download Certificate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Download size={15} />
                    <span className="font-mono" style={{ fontSize: '0.75rem' }}>Download</span>
                  </a>
                )}

                {!activeCert.isPdf && (
                  <button
                    type="button"
                    className="cert-lightbox-btn cert-lightbox-zoom-btn"
                    onClick={toggleZoom}
                    aria-label={`Zoom certificate: currently ${Math.round(zoomLevel * 100)}%`}
                    title="Toggle Zoom (or click image directly)"
                  >
                    {zoomLevel > 1 ? <ZoomOut size={16} /> : <ZoomIn size={16} />}
                    <span className="cert-lightbox-zoom-label font-mono">{Math.round(zoomLevel * 100)}%</span>
                  </button>
                )}

                <button
                  type="button"
                  className="cert-lightbox-btn cert-lightbox-close"
                  onClick={handleCloseLightbox}
                  aria-label="Close certificate preview"
                  title="Close (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="cert-lightbox-content" onClick={handleCloseLightbox}>
              {activeCert.isPdf ? (
                <div className="cert-lightbox-pdf-wrap" onClick={(e) => e.stopPropagation()}>
                  <iframe
                    src={`${activeCert.file}#toolbar=0`}
                    title={`${activeCert.title} PDF Document`}
                    className="cert-lightbox-pdf-frame"
                  />
                  <div className="cert-lightbox-pdf-actions">
                    <a
                      href={activeCert.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                    >
                      <FileText size={14} /> Open in New Tab
                    </a>
                    <a
                      href={activeCert.file}
                      download
                      className="btn btn-primary btn-sm"
                    >
                      <Download size={14} /> Download PDF
                    </a>
                  </div>
                </div>
              ) : (
                <div
                  className={`cert-lightbox-viewport ${zoomLevel > 1 ? 'is-zoomed' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleZoom();
                  }}
                >
                  <img
                    src={activeCert.image}
                    alt={`${activeCert.title} certificate full resolution`}
                    className="cert-lightbox-img"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in',
                    }}
                    loading="eager"
                  />
                </div>
              )}

              <div className="cert-lightbox-hint" onClick={(e) => e.stopPropagation()}>
                {activeCert.isPdf
                  ? 'PDF Document Preview • Click Download or Open in New Tab'
                  : (zoomLevel > 1 ? 'Click image or button to zoom out (or press -)' : 'Click image to zoom in (or press +) • Esc to close')}
              </div>
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
