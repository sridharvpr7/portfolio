// src/firebase/useFirebaseAuth.ts
// Firebase Authentication hook — Google sign-in using Firebase Auth SDK.
// Works only when VITE_FIREBASE_* env vars are set; degrades gracefully otherwise.

import { useState, useEffect, useCallback } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { firebaseAuth, firebaseConfigured } from './config';

export type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated' | 'error' | 'unconfigured';

export interface FirebaseUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string;
}

export interface UseFirebaseAuthReturn {
  status: AuthStatus;
  user: FirebaseUser | null;
  errorMessage: string | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

export function useFirebaseAuth(): UseFirebaseAuthReturn {
  const [status, setStatus] = useState<AuthStatus>(() =>
    firebaseConfigured ? 'loading' : 'unconfigured'
  );
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseConfigured || !firebaseAuth) {
      setStatus('unconfigured');
      return;
    }

    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      (fbUser: User | null) => {
        if (fbUser) {
          setUser({
            displayName: fbUser.displayName,
            email: fbUser.email,
            photoURL: fbUser.photoURL,
            uid: fbUser.uid,
          });
          setStatus('authenticated');
        } else {
          setUser(null);
          setStatus('unauthenticated');
        }
        setErrorMessage(null);
      },
      (err) => {
        console.warn('[firebase/auth] Auth state error:', err);
        setStatus('error');
        setErrorMessage('Authentication service error. Please try again.');
      }
    );

    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    if (!firebaseAuth) {
      setStatus('unconfigured');
      return;
    }
    setStatus('loading');
    setErrorMessage(null);
    try {
      const provider = new GoogleAuthProvider();
      // Request minimal scopes — only profile name, no email access
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(firebaseAuth, provider);
      // onAuthStateChanged will update status/user
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User dismissed — go back to unauthenticated, not an error
        setStatus('unauthenticated');
      } else {
        console.warn('[firebase/auth] Sign-in failed:', err);
        setStatus('error');
        setErrorMessage('Sign-in failed. Please try again.');
      }
    }
  }, []);

  const signOutUser = useCallback(async () => {
    if (!firebaseAuth) return;
    try {
      await signOut(firebaseAuth);
      // onAuthStateChanged sets status to unauthenticated
    } catch (err) {
      console.warn('[firebase/auth] Sign-out failed:', err);
    }
  }, []);

  return { status, user, errorMessage, signIn, signOutUser };
}

