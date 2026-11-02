// src/firebase/config.ts
// Firebase configuration — reads values from Vite build-time env variables.
// All VITE_FIREBASE_* variables are embedded into the frontend bundle at build time.
// They are NOT secrets — Firebase security rules protect your data, not these keys.
//
// HOW TO SET UP FIREBASE:
// 1. Go to https://console.firebase.google.com and create a project.
// 2. Enable Authentication → Sign-in method → Google.
// 3. Enable Realtime Database → Create database (start in locked mode).
// 4. In Project Settings → General → Your apps → Add web app.
// 5. Copy the firebaseConfig values into your .env file (see .env.example).
// 6. Set Realtime Database security rules (see firebase-rules.md).

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

// Firebase is configured when all required keys are present.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL as string | undefined,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

// Firebase is only active when the minimum required keys are set.
export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

// Firebase Realtime Database presence requires databaseURL.
export const realtimeDbConfigured = Boolean(
  firebaseConfigured &&
  firebaseConfig.databaseURL
);

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Database | null = null;

if (firebaseConfigured) {
  try {
    _app = getApps().length === 0
      ? initializeApp(firebaseConfig as Required<typeof firebaseConfig>)
      : getApps()[0]!;
    _auth = getAuth(_app);
    if (realtimeDbConfigured) {
      _db = getDatabase(_app);
    }
  } catch (err) {
    console.warn('[firebase] Initialization failed:', err);
  }
}

export const firebaseApp = _app;
export const firebaseAuth = _auth;
export const firebaseDb = _db;

