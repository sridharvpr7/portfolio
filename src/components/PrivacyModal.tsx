import React, { useEffect, useRef } from 'react';
import { X, Shield } from 'lucide-react';
import './PrivacyModal.css';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletionEmail?: string;
  retentionDays?: number;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
  deletionEmail = 'your.email@example.com',
  retentionDays = 365,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus and close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="privacy-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="privacy-modal card" ref={dialogRef}>
        <div className="privacy-header">
          <div className="privacy-title-row">
            <Shield size={18} />
            <h2 id="privacy-title" className="privacy-title">Privacy Notice</h2>
          </div>
          <button
            className="privacy-close"
            onClick={onClose}
            aria-label="Close privacy notice"
          >
            <X size={18} />
          </button>
        </div>

        <div className="privacy-body">
          <p className="privacy-intro">
            This portfolio collects minimal data to count visitors and send
            me notifications. Here is a plain-language summary.
          </p>

          <section className="privacy-section">
            <h3>What is collected</h3>
            <ul>
              <li><strong>Anonymous visits:</strong> A random session identifier, the page you visited, your approximate device type (Desktop / Mobile), and the referring site. No IP address is stored.</li>
              <li><strong>Google Sign-In (optional):</strong> If you choose to sign in, your Google name and email address (from a server-verified token) are stored and associated with your visits.</li>
              <li><strong>Heartbeats:</strong> A presence signal sent every ~30 seconds to power the live visitor counter. No new visit events are created.</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h3>Why visits are counted</h3>
            <p>Visit counts help me understand whether my portfolio is being viewed and by how many people. The live counter is displayed publicly to show portfolio activity.</p>
          </section>

          <section className="privacy-section">
            <h3>Google Sign-In</h3>
            <p>Signing in is entirely optional. Your Google ID token is verified on the server using Google's cryptographic signature — only the verified token data is trusted. Signing in does not grant any administrative access.</p>
          </section>

          <section className="privacy-section">
            <h3>Telegram notifications</h3>
            <p>When a new or returning visitor is detected, I receive a private Telegram message. Anonymous visits show a pseudonymous session reference. Signed-in visitor names are included if available. Your data is never shared with third parties beyond this private notification.</p>
          </section>

          <section className="privacy-section">
            <h3>Email greetings</h3>
            <p>A welcome email is only sent if you explicitly request it after signing in. Your email address is not used for any other purpose. You can opt out at any time by emailing the address below.</p>
          </section>

          <section className="privacy-section">
            <h3>Data retention</h3>
            <p>Visit records are retained for up to <strong>{retentionDays} days</strong>. After that, they are deleted. You can request earlier deletion at any time.</p>
          </section>

          <section className="privacy-section">
            <h3>Your rights — how to request deletion</h3>
            <p>
              If you signed in with Google, you can delete your account data by using the "Delete my data" option that appears after sign-in. Alternatively, email{' '}
              <a href={`mailto:${deletionEmail}`} className="privacy-link">{deletionEmail}</a>{' '}
              with the subject <em>"Data deletion request"</em>.
            </p>
            <p>Anonymous visit records cannot be reliably linked back to you once a session ends.</p>
          </section>

          <section className="privacy-section">
            <h3>Third-party services</h3>
            <ul>
              <li><strong>Google Identity Services</strong> — for optional sign-in</li>
              <li><strong>Neon PostgreSQL</strong> — database hosting</li>
              <li><strong>Resend</strong> — transactional email (only if you opt in)</li>
              <li><strong>Telegram</strong> — private owner notifications</li>
              <li><strong>Vercel</strong> — hosting and serverless functions</li>
            </ul>
          </section>

          <section className="privacy-section">
            <h3>No hidden tracking</h3>
            <p>This portfolio does not use browser fingerprinting, third-party advertising trackers, or any form of cross-site tracking. The Do Not Track header is respected — if enabled, anonymous session tracking is skipped.</p>
          </section>
        </div>

        <div className="privacy-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
