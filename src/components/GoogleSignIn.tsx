import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LogOut, User, Mail, Trash2 } from 'lucide-react';
import { authenticateGoogle, logout, submitEmailConsent, deleteAccount } from '../services/analyticsService';
import './GoogleSignIn.css';

interface GoogleSignInProps {
  enabled: boolean;
  emailEnabled: boolean;
}

interface AuthState {
  status: 'idle' | 'signed-in' | 'error';
  displayName?: string;
  visitNumber?: number;
  isNew?: boolean;
}

interface EmailState {
  status: 'idle' | 'asked' | 'accepted' | 'declined' | 'sent';
}

// Extend window for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, config: Record<string, unknown>) => void;
          prompt: (notification?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean; isDismissedMoment: () => boolean; getMomentType: () => string }) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

// One Tap cooldown: don't show again within the same session after dismiss
const ONE_TAP_DISMISSED_KEY = 'pf_onetap_dismissed';

function wasOneTapDismissed(): boolean {
  try {
    return Boolean(sessionStorage.getItem(ONE_TAP_DISMISSED_KEY));
  } catch {
    return false;
  }
}

function markOneTapDismissed(): void {
  try {
    sessionStorage.setItem(ONE_TAP_DISMISSED_KEY, '1');
  } catch {}
}

export const GoogleSignIn: React.FC<GoogleSignInProps> = ({ enabled, emailEnabled }) => {
  const [auth, setAuth] = useState<AuthState>({ status: 'idle' });
  const [email, setEmail] = useState<EmailState>({ status: 'idle' });
  const [gsiLoaded, setGsiLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const oneTapAttempted = useRef(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    const result = await authenticateGoogle(response.credential);
    if (result.ok) {
      setAuth({
        status: 'signed-in',
        displayName: result.displayName,
        visitNumber: result.visitNumber,
        isNew: result.isNew,
      });
      setDeleteNotice(null);
      // Show email consent prompt only after sign-in
      if (emailEnabled) {
        setEmail({ status: 'asked' });
      }
    } else {
      setAuth({ status: 'error' });
    }
  }, [emailEnabled]);

  useEffect(() => {
    if (!enabled || !clientId) return;

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      // GSI failed to load (offline, blocked, unsupported) — degrade silently
      console.warn('[gsi] Google Identity Services failed to load');
    };
    script.onload = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        // auto_select: true enables One Tap automatic sign-in if only one matching account
        auto_select: true,
        cancel_on_tap_outside: true,
        // itp_support for Safari ITP
        itp_support: true,
      });
      setGsiLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      // Cancel One Tap on unmount to prevent zombie prompts
      try { window.google?.accounts.id.cancel(); } catch {}
    };
  }, [enabled, clientId, handleCredentialResponse]);

  // Render the fallback button once GSI loads
  useEffect(() => {
    if (!gsiLoaded || auth.status !== 'idle') return;
    const btn = document.getElementById('gsi-button-container');
    if (btn && window.google) {
      window.google.accounts.id.renderButton(btn, {
        type: 'standard',
        theme: 'filled_black',
        size: 'medium',
        shape: 'rectangular',
        text: 'continue_with',
        logo_alignment: 'left',
      });
    }
  }, [gsiLoaded, auth.status]);

  // Show One Tap prompt automatically once — if not dismissed this session
  useEffect(() => {
    if (!gsiLoaded || auth.status !== 'idle' || oneTapAttempted.current) return;
    if (wasOneTapDismissed()) return;
    if (!window.google) return;

    oneTapAttempted.current = true;

    window.google.accounts.id.prompt((notification) => {
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment() ||
        notification.isDismissedMoment()
      ) {
        // Prompt was not shown or was dismissed — remember for this session
        markOneTapDismissed();
      }
    });
  }, [gsiLoaded, auth.status]);

  const handleLogout = async () => {
    await logout();
    setAuth({ status: 'idle' });
    setEmail({ status: 'idle' });
    setConfirmDelete(false);
    oneTapAttempted.current = false; // allow prompt to show again after explicit logout
  };

  const handleDeleteData = async () => {
    const res = await deleteAccount();
    if (res.ok) {
      setAuth({ status: 'idle' });
      setEmail({ status: 'idle' });
      setConfirmDelete(false);
      setDeleteNotice('Your visitor account and associated data have been deleted.');
    }
  };

  const handleEmailConsent = async (consent: boolean) => {
    setEmail({ status: consent ? 'accepted' : 'declined' });
    if (consent) {
      const result = await submitEmailConsent(true);
      if (result.sent) {
        setEmail({ status: 'sent' });
      }
    } else {
      await submitEmailConsent(false);
    }
  };

  if (!enabled || !clientId) return null;

  return (
    <div className="gsi-wrapper">
      {deleteNotice && (
        <p className="gsi-notice font-mono">{deleteNotice}</p>
      )}

      {auth.status === 'idle' && (
        <div className="gsi-prompt">
          <p className="gsi-hint">
            <User size={12} />
            Sign in to personalize your visit
            <span className="gsi-optional">(optional)</span>
          </p>
          <div id="gsi-button-container" className="gsi-button-container" />
          {!gsiLoaded && <div className="gsi-loading">Loading…</div>}
        </div>
      )}

      {auth.status === 'signed-in' && (
        <div className="gsi-signed-in">
          <div className="gsi-user-info">
            <User size={13} />
            <span>
              {auth.isNew ? 'Welcome, ' : 'Welcome back, '}
              <strong>{auth.displayName}</strong>
              {auth.visitNumber && auth.visitNumber > 1 && (
                <span className="gsi-visit-badge"> · Visit #{auth.visitNumber}</span>
              )}
            </span>
          </div>

          <div className="gsi-actions-group">
            <button className="gsi-logout-btn" onClick={handleLogout} aria-label="Sign out">
              <LogOut size={12} />
              Sign out
            </button>
            {!confirmDelete ? (
              <button
                className="gsi-delete-btn"
                onClick={() => setConfirmDelete(true)}
                aria-label="Request data deletion"
              >
                <Trash2 size={11} />
                Delete my data
              </button>
            ) : (
              <span className="gsi-delete-confirm">
                Delete all records?{' '}
                <button className="gsi-btn-confirm-yes" onClick={handleDeleteData}>Yes, delete</button>
                <button className="gsi-btn-confirm-no" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </span>
            )}
          </div>
        </div>
      )}

      {auth.status === 'error' && (
        <p className="gsi-error">Sign-in failed. Please try again.</p>
      )}

      {/* Email consent prompt — only shown after sign-in */}
      {auth.status === 'signed-in' && email.status === 'asked' && (
        <div className="gsi-email-prompt" role="dialog" aria-labelledby="gsi-email-title">
          <Mail size={13} />
          <p id="gsi-email-title" className="gsi-email-text">
            Would you like a short welcome email? Just a single greeting — no newsletter.
          </p>
          <div className="gsi-email-actions">
            <button
              className="btn btn-sm btn-primary"
              onClick={() => handleEmailConsent(true)}
            >
              Yes, send it
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => handleEmailConsent(false)}
            >
              No thanks
            </button>
          </div>
        </div>
      )}

      {email.status === 'sent' && (
        <p className="gsi-email-sent">✓ Email sent! Check your inbox.</p>
      )}
    </div>
  );
};
