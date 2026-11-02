import React from 'react';
import { ExternalLink, ArrowDown } from 'lucide-react';
import { GithubIcon } from '../components/BrandIcons';
import { CircuitBackground } from '../components/CircuitBackground';
import { useReveal } from '../hooks/useReveal';
import type { ProfileData, SocialLink } from '../services/contentLoader';
import './HeroSection.css';

interface HeroSectionProps {
  profile: ProfileData;
  socialLinks: SocialLink[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ profile, socialLinks }) => {
  const { ref: contentRef, isVisible } = useReveal<HTMLDivElement>({ threshold: 0.05 });

  const github = socialLinks.find(l => l.id === 'github' && l.visible && l.showInHero);
  const linkedin = socialLinks.find(l => l.id === 'linkedin' && l.visible && l.showInHero);

  const scrollDown = () => {
    const next = document.getElementById('about');
    if (next) {
      window.scrollTo({ top: next.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="hero-section" aria-label="Introduction">
      <CircuitBackground />

      {/* Radial gradient overlay */}
      <div className="hero-glow-1" aria-hidden="true" />
      <div className="hero-glow-2" aria-hidden="true" />

      <div className="container hero-container" ref={contentRef}>
        <div className={`hero-content ${isVisible ? 'revealed' : ''}`}>

          {profile.availability?.show && (
            <div className="hero-availability status-badge" role="status">
              <span className="status-dot" />
              {profile.availability.status}
            </div>
          )}

          <div className="hero-eyebrow">
            <div className="hero-circuit-line" aria-hidden="true">
              <span className="hero-circuit-dot" />
            </div>
            <span className="font-mono" style={{ fontSize: '0.78rem', letterSpacing: '0.15em', color: 'var(--accent-blue)', textTransform: 'uppercase' }}>
              {profile.tagline}
            </span>
          </div>

          <h1 className="hero-name">
            {profile.name}
          </h1>

          <h2 className="hero-headline">
            {profile.headline}
          </h2>

          <p className="hero-sub">
            {profile.subHeadline}
          </p>

          <div className="hero-actions">
            <a
              href={profile.ctaPrimary.href}
              id="hero-explore-btn"
              className="btn btn-primary hero-btn-primary"
              onClick={e => {
                e.preventDefault();
                const id = profile.ctaPrimary.href.replace('#', '');
                const el = document.getElementById(id);
                if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
              }}
            >
              {profile.ctaPrimary.label}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>

            {profile.resumeUrl && (
              <a
                href={profile.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="hero-resume-btn"
                className="btn btn-secondary hero-btn-secondary"
              >
                {profile.ctaSecondary.label}
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          <div className="hero-social-links" role="list">
            {github && (
              <a
                href={github.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-social-link"
                aria-label={`${github.label} profile`}
                role="listitem"
              >
                <GithubIcon size={18} />
                <span>{github.label}</span>
              </a>
            )}
            {linkedin && (
              <a
                href={linkedin.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-social-link"
                aria-label={`${linkedin.label} profile`}
                role="listitem"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>{linkedin.label}</span>
              </a>
            )}
          </div>
        </div>

        {/* Right side: animated visual */}
        <div className={`hero-visual ${isVisible ? 'revealed' : ''}`} aria-hidden="true">
          <HeroVisual />
        </div>
      </div>

      <button
        className="hero-scroll-hint"
        onClick={scrollDown}
        aria-label="Scroll down"
      >
        <ArrowDown size={18} />
      </button>
    </section>
  );
};

// Abstract animated circuit-to-code visual
const HeroVisual: React.FC = () => {
  return (
    <div className="hero-visual-container">
      {/* Circuit board SVG */}
      <svg
        viewBox="0 0 360 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="hero-svg"
        aria-hidden="true"
      >
        {/* Grid dots */}
        {Array.from({ length: 6 }, (_, row) =>
          Array.from({ length: 6 }, (_, col) => (
            <circle
              key={`${row}-${col}`}
              cx={40 + col * 60}
              cy={40 + row * 60}
              r={1.5}
              fill="var(--accent-blue)"
              opacity={0.25}
            />
          ))
        )}

        {/* Horizontal traces */}
        <line x1="40" y1="100" x2="140" y2="100" stroke="var(--accent-blue)" strokeWidth="1" opacity="0.3" strokeDasharray="4 3" className="trace-1"/>
        <line x1="100" y1="160" x2="280" y2="160" stroke="var(--accent-blue)" strokeWidth="1" opacity="0.25" strokeDasharray="4 3" className="trace-2"/>
        <line x1="40" y1="220" x2="200" y2="220" stroke="var(--accent-violet)" strokeWidth="1" opacity="0.3" strokeDasharray="4 3" className="trace-3"/>
        <line x1="160" y1="280" x2="320" y2="280" stroke="var(--accent-cyan)" strokeWidth="1" opacity="0.2" strokeDasharray="4 3"/>

        {/* Vertical traces */}
        <line x1="160" y1="40" x2="160" y2="160" stroke="var(--accent-blue)" strokeWidth="1" opacity="0.25" strokeDasharray="4 3"/>
        <line x1="220" y1="100" x2="220" y2="280" stroke="var(--accent-violet)" strokeWidth="1" opacity="0.2" strokeDasharray="4 3"/>
        <line x1="100" y1="160" x2="100" y2="320" stroke="var(--accent-blue)" strokeWidth="1" opacity="0.2" strokeDasharray="4 3"/>

        {/* Component boxes */}
        <rect x="120" y="80" width="80" height="40" rx="4" fill="var(--bg-surface-2)" stroke="var(--accent-blue)" strokeWidth="1" opacity="0.7"/>
        <text x="160" y="105" textAnchor="middle" fill="var(--accent-blue)" fontSize="9" fontFamily="JetBrains Mono" opacity="0.9">ALU</text>

        <rect x="50" y="190" width="100" height="50" rx="4" fill="var(--bg-surface-2)" stroke="var(--accent-violet)" strokeWidth="1" opacity="0.6"/>
        <text x="100" y="211" textAnchor="middle" fill="var(--accent-violet)" fontSize="8" fontFamily="JetBrains Mono" opacity="0.9">Controller</text>
        <text x="100" y="228" textAnchor="middle" fill="var(--accent-violet)" fontSize="7" fontFamily="JetBrains Mono" opacity="0.6">FSM</text>

        <rect x="220" y="130" width="100" height="50" rx="4" fill="var(--bg-surface-2)" stroke="var(--accent-cyan)" strokeWidth="1" opacity="0.6"/>
        <text x="270" y="151" textAnchor="middle" fill="var(--accent-cyan)" fontSize="8" fontFamily="JetBrains Mono" opacity="0.9">{'{ API }'}</text>
        <text x="270" y="168" textAnchor="middle" fill="var(--accent-cyan)" fontSize="7" fontFamily="JetBrains Mono" opacity="0.6">REST</text>

        <rect x="200" y="240" width="110" height="50" rx="4" fill="var(--bg-surface-2)" stroke="var(--accent-blue)" strokeWidth="1" opacity="0.5"/>
        <text x="255" y="261" textAnchor="middle" fill="var(--accent-blue)" fontSize="8" fontFamily="JetBrains Mono" opacity="0.9">{'<React />'}</text>
        <text x="255" y="278" textAnchor="middle" fill="var(--accent-blue)" fontSize="7" fontFamily="JetBrains Mono" opacity="0.6">Frontend</text>

        {/* Signal pulses */}
        <circle cx="160" cy="100" r="3" fill="var(--accent-blue)" className="hero-pulse-1">
          <animate attributeName="opacity" values="0;1;0" dur="2.5s" repeatCount="indefinite" begin="0s"/>
          <animate attributeName="r" values="3;5;3" dur="2.5s" repeatCount="indefinite" begin="0s"/>
        </circle>
        <circle cx="270" cy="155" r="3" fill="var(--accent-cyan)" className="hero-pulse-2">
          <animate attributeName="opacity" values="0;1;0" dur="3s" repeatCount="indefinite" begin="0.8s"/>
          <animate attributeName="r" values="3;5;3" dur="3s" repeatCount="indefinite" begin="0.8s"/>
        </circle>
        <circle cx="100" cy="215" r="3" fill="var(--accent-violet)">
          <animate attributeName="opacity" values="0;1;0" dur="3.5s" repeatCount="indefinite" begin="1.2s"/>
          <animate attributeName="r" values="3;5;3" dur="3.5s" repeatCount="indefinite" begin="1.2s"/>
        </circle>

        {/* Moving signal on horizontal line */}
        <circle cx="40" cy="160" r="2.5" fill="var(--accent-blue)">
          <animate attributeName="cx" values="100;280;100" dur="4s" repeatCount="indefinite" calcMode="ease-in-out"/>
          <animate attributeName="opacity" values="0;1;1;0" dur="4s" repeatCount="indefinite"/>
        </circle>

        {/* Corner annotation */}
        <text x="300" y="50" textAnchor="end" fill="var(--text-faint)" fontSize="8" fontFamily="JetBrains Mono">v1.0.0</text>
        <text x="300" y="340" textAnchor="end" fill="var(--text-faint)" fontSize="8" fontFamily="JetBrains Mono">ECE × DEV</text>
      </svg>

      {/* Floating labels */}
      <div className="hero-float-label hero-float-1">
        <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent-blue)', letterSpacing: '0.1em' }}>
          VERILOG
        </span>
      </div>
      <div className="hero-float-label hero-float-2">
        <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent-violet)', letterSpacing: '0.1em' }}>
          REACT
        </span>
      </div>
      <div className="hero-float-label hero-float-3">
        <span className="font-mono" style={{ fontSize: '0.65rem', color: 'var(--accent-cyan)', letterSpacing: '0.1em' }}>
          VLSI
        </span>
      </div>
    </div>
  );
};
