// src/components/FirebaseSignIn.tsx
// Google Sign-In using Firebase Authentication.
// Shows sign-in/out controls; degrades gracefully when Firebase is not configured.

import React from 'react';
import { LogOut, User, Loader, AlertCircle } from 'lucide-react';
import { useFirebaseAuth } from '../firebase/useFirebaseAuth';
import { firebaseConfigured } from '../firebase/config';
import './FirebaseSignIn.css';

export const FirebaseSignIn: React.FC = () => {
  const { status, user, errorMessage, signIn, signOutUser } = useFirebaseAuth();

  // Not configured — render nothing (keeps footer clean for visitors)
  if (!firebaseConfigured) {
    return null;
  }

  return (
    <div className="fbsign-wrapper">
      {status === 'loading' && (
        <div className="fbsign-loading" aria-live="polite">
          <Loader size={13} className="fbsign-spinner" aria-hidden="true" />
          <span>Checking sign-inâ€¦</span>
        </div>
      )}

      {status === 'unauthenticated' && (
        <div className="fbsign-prompt">
          <button
            className="fbsign-btn"
            onClick={signIn}
            aria-label="Sign in with Google"
          >
            {/* Google G mark */}
            <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </button>
          <p className="fbsign-optional">Optional Â· personalises your visit</p>
        </div>
      )}

      {status === 'authenticated' && user && (
        <div className="fbsign-signed-in">
          <div className="fbsign-user">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                className="fbsign-avatar"
                aria-hidden="true"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User size={14} aria-hidden="true" />
            )}
            <span className="fbsign-name">
              {user.displayName ?? 'Visitor'}
            </span>
          </div>
          <button
            className="fbsign-signout-btn"
            onClick={signOutUser}
            aria-label="Sign out"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="fbsign-error" role="alert">
          <AlertCircle size={13} aria-hidden="true" />
          <span>{errorMessage ?? 'Sign-in unavailable'}</span>
          <button className="fbsign-retry-btn" onClick={signIn} aria-label="Retry sign-in">
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

