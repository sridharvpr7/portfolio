import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Share2, Copy, Check, X } from 'lucide-react';
import './ShareButton.css';

// ── Constants ──────────────────────────────────────────────────────────────
const PORTFOLIO_URL  = 'https://sridhar-portfolio-gyoy.onrender.com/';
const SHARE_TITLE    = 'SRIDHAR VPR | ECE Student & Web Developer';
const SHARE_TEXT     = 'Explore my portfolio — ECE, VLSI, Embedded Systems and Full-Stack Web Development.';
const SHARE_TEXT_ENC = encodeURIComponent(SHARE_TEXT + ' ' + PORTFOLIO_URL);
const SHARE_URL_ENC  = encodeURIComponent(PORTFOLIO_URL);

const SHARE_OPTIONS = [
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    url: `https://wa.me/?text=${SHARE_TEXT_ENC}`,
    icon: (
      // WhatsApp brand SVG
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25D366',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    url: `https://www.linkedin.com/sharing/share-offsite/?url=${SHARE_URL_ENC}`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    color: '#0A66C2',
  },
  {
    id: 'telegram',
    label: 'Telegram',
    url: `https://t.me/share/url?url=${SHARE_URL_ENC}&text=${encodeURIComponent(SHARE_TEXT)}`,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: '#229ED9',
  },
] as const;

// ── Types ──────────────────────────────────────────────────────────────────
type CopyState = 'idle' | 'copied' | 'error';

export interface ShareButtonProps {
  /** Visual variant for placement context */
  variant?: 'hero' | 'contact';
  className?: string;
  triggerClassName?: string;
}

// ── Component ──────────────────────────────────────────────────────────────
export const ShareButton: React.FC<ShareButtonProps> = ({ variant = 'hero', className, triggerClassName }) => {
  const [isOpen, setIsOpen]       = useState(false);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const popupRef  = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Native share ──────────────────────────────────────────────────────
  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: PORTFOLIO_URL });
        return; // native sheet handled it — no popup needed
      } catch (err) {
        // User cancelled or API threw — fall through to popup
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }
    // Fallback: open the custom popup
    setIsOpen(prev => !prev);
  }, []);

  // ── Copy link ─────────────────────────────────────────────────────────
  const handleCopyLink = useCallback(async () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    try {
      await navigator.clipboard.writeText(PORTFOLIO_URL);
      setCopyState('copied');
    } catch {
      // Clipboard API blocked — try legacy execCommand
      try {
        const el = document.createElement('textarea');
        el.value = PORTFOLIO_URL;
        el.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopyState('copied');
      } catch {
        setCopyState('error');
      }
    }
    copyTimerRef.current = setTimeout(() => setCopyState('idle'), 2200);
  }, []);

  // ── Close popup on outside click or Escape ────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    const onClickOut = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOut);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOut);
    };
  }, [isOpen]);

  // Cleanup copy timer on unmount
  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className={`share-btn-wrapper share-btn-wrapper--${variant}${className ? ` ${className}` : ''}`}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        className={`btn share-trigger-btn share-trigger-btn--${variant}${variant === 'hero' ? ' hero-cta-btn' : ''}${triggerClassName ? ` ${triggerClassName}` : ''}`}
        onClick={handleNativeShare}
        aria-label="Share this portfolio"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        {variant === 'contact' ? (
          <>
            <span className="share-trigger-icon-wrap">
              <Share2 size={18} aria-hidden="true" />
            </span>
            <span>
              <span className="contact-link-label">Share</span>
              <span className="contact-link-value">Share Portfolio</span>
            </span>
          </>
        ) : (
          <>
            <Share2 size={15} aria-hidden="true" />
            <span>Share Portfolio</span>
          </>
        )}
      </button>

      {/* Fallback popup */}
      {isOpen && (
        <div
          ref={popupRef}
          className={`share-popup share-popup--${variant}`}
          role="dialog"
          aria-label="Share portfolio options"
          aria-modal="true"
        >
          {/* Header */}
          <div className="share-popup-header">
            <span className="share-popup-title">Share Portfolio</span>
            <button
              type="button"
              className="share-popup-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close share menu"
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>

          {/* Social options */}
          <div className="share-popup-options">
            {SHARE_OPTIONS.map(opt => (
              <a
                key={opt.id}
                href={opt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="share-option-btn"
                aria-label={`Share on ${opt.label}`}
                onClick={() => setIsOpen(false)}
                style={{ '--share-option-color': opt.color } as React.CSSProperties}
              >
                <span className="share-option-icon">{opt.icon}</span>
                <span className="share-option-label">{opt.label}</span>
              </a>
            ))}
          </div>

          {/* Divider */}
          <div className="share-popup-divider" aria-hidden="true"><span>or</span></div>

          {/* Copy link row */}
          <div className="share-copy-row">
            <span className="share-copy-url" aria-label="Portfolio URL">{PORTFOLIO_URL}</span>
            <button
              type="button"
              className={`share-copy-btn ${copyState === 'copied' ? 'share-copy-btn--success' : ''}`}
              onClick={handleCopyLink}
              aria-label={copyState === 'copied' ? 'Link copied!' : 'Copy portfolio link'}
            >
              {copyState === 'copied' ? (
                <><Check size={13} aria-hidden="true" /><span>Copied!</span></>
              ) : (
                <><Copy size={13} aria-hidden="true" /><span>Copy Link</span></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

