import React, { useState } from 'react';
import { Heart, Shield } from 'lucide-react';
import { GithubIcon, LinkedinIcon } from './BrandIcons';
import { VisitorStats } from './VisitorStats';
import { GoogleSignIn } from './GoogleSignIn';
import { LiveViewerCount } from './LiveViewerCount';
import { PrivacyModal } from './PrivacyModal';
import type { SiteConfig, SocialLink } from '../services/contentLoader';
import type { StatsPayload } from '../services/analyticsService';
import './Footer.css';

interface NotificationsConfig {
  enabled: boolean;
  googleSignIn?: { enabled: boolean };
  emailGreeting?: { enabled: boolean };
  privacy?: { deletionContactEmail: string; retentionPolicyDays: number };
}

interface FooterProps {
  site: SiteConfig;
  socialLinks: SocialLink[];
  profileName?: string;
  stats: StatsPayload;
  analyticsReady: boolean;
  configEnabled: boolean;
  notificationsConfig?: NotificationsConfig;
  contactEmail?: string;
}

export const Footer: React.FC<FooterProps> = ({
  site,
  socialLinks,
  profileName = 'Sridhar',
  stats,
  analyticsReady,
  configEnabled,
  notificationsConfig,
  contactEmail,
}) => {
  const footerLinks = socialLinks.filter(l => l.visible && l.showInFooter);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Legacy Google Identity Services sign-in (requires server-side API)
  const gsiEnabled = Boolean(
    notificationsConfig?.enabled && notificationsConfig?.googleSignIn?.enabled
  );
  const emailEnabled = Boolean(
    notificationsConfig?.enabled && notificationsConfig?.emailGreeting?.enabled
  );

  return (
    <footer className="footer" role="contentinfo">
      {/* Visitor Stats â€” above footer proper (legacy Neon DB analytics) */}
      <VisitorStats stats={stats} ready={analyticsReady} configEnabled={configEnabled} />

      {/* Firebase live viewer count — shown when Firebase Realtime DB is configured */}
      <div className="footer-presence">
        <div className="container">
          <LiveViewerCount />
        </div>
      </div>

      {/* Legacy Google Identity Services strip — shown only if configured via Neon backend */}
      {gsiEnabled && (
        <div className="footer-gsi-strip">
          <div className="container">
            <GoogleSignIn enabled={gsiEnabled} emailEnabled={emailEnabled} />
          </div>
        </div>
      )}

      <div className="footer-top" aria-hidden="true" />

      <div className="container footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 12h4l2-7 4 14 2-7h6" stroke="var(--accent-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="footer-logo-text">{profileName}</span>
          </div>
          <p className="footer-tagline">{site.siteTagline}</p>
        </div>

        <div className="footer-social">
          {footerLinks.map(link => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
              aria-label={`${link.platform} profile`}
            >
              {link.id === 'github' ? <GithubIcon size={16} /> : <LinkedinIcon size={16} />}
            </a>
          ))}
        </div>

        <button
          className="footer-top-btn"
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </button>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-inner">
            <span>
              Â© {site.copyrightYear} {profileName}. Built with{' '}
              <Heart size={12} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--accent-violet)' }} aria-label="love" />{' '}
              using React + Vite.
            </span>
            <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.05em' }}>
              ECE Ã— Software â€” Beyond the Circuit
            </span>
            {configEnabled && (
              <button
                className="footer-privacy-btn"
                onClick={() => setPrivacyOpen(true)}
                aria-label="Open privacy notice"
              >
                <Shield size={11} />
                Privacy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Privacy modal */}
      <PrivacyModal
        isOpen={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        deletionEmail={contactEmail || notificationsConfig?.privacy?.deletionContactEmail}
        retentionDays={notificationsConfig?.privacy?.retentionPolicyDays}
      />
    </footer>
  );
};
