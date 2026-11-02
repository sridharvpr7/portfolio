// src/firebase/usePresence.ts
// Firebase Realtime Database presence — live visitor count.
//
// How it works:
// - On mount, writes a presence entry to /presence/{sessionId}.
// - Uses onDisconnect() to auto-delete the entry when the tab closes or goes offline.
// - Subscribes to /presence to count connected sessions in real time.
// - A single browser tab = one presence entry (keyed by sessionId stored in sessionStorage).
//
// Limitations:
// - onDisconnect() triggers after ~60s if the browser crashes without sending a FIN.
// - Firebase handles this via its own keep-alive; entries are cleaned up automatically.
// - The session key prevents double-counting across re-renders for the same tab.
//
// Security rules required (see firebase-rules.md):
//   /presence/$sessionId: read if auth != null OR always read; write only if
//   auth.uid == data.uid (or allow anonymous writes with validation).
//   A minimal open rule for presence:
//     "presence": {
//       ".read": true,
//       "$sid": {
//         ".write": "!data.exists() || newData.exists() === false",
//         ".validate": "newData.hasChildren(['connectedAt'])"
//       }
//     }

import { useState, useEffect, useRef } from 'react';
import {
  ref,
  set,
  onDisconnect,
  onValue,
  serverTimestamp,
  remove,
} from 'firebase/database';
import { firebaseDb, realtimeDbConfigured } from './config';

export type PresenceStatus = 'loading' | 'connected' | 'offline' | 'unconfigured' | 'error';

export interface UsePresenceReturn {
  liveCount: number | null;
  status: PresenceStatus;
}

const SESSION_KEY = 'pf_firebase_session';

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

export function usePresence(): UsePresenceReturn {
  const [liveCount, setLiveCount] = useState<number | null>(null);
  const [status, setStatus] = useState<PresenceStatus>(() =>
    realtimeDbConfigured ? 'loading' : 'unconfigured'
  );
  const sessionId = useRef(getSessionId());
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!realtimeDbConfigured || !firebaseDb) {
      setStatus('unconfigured');
      return;
    }

    const db = firebaseDb;
    const sid = sessionId.current;
    const presenceRef = ref(db, `presence/${sid}`);
    const presenceRootRef = ref(db, 'presence');

    let registered = false;

    // Register presence entry and set up onDisconnect cleanup
    const registerPresence = async () => {
      try {
        await set(presenceRef, { connectedAt: serverTimestamp() });
        await onDisconnect(presenceRef).remove();
        registered = true;
        setStatus('connected');
      } catch (err) {
        console.warn('[firebase/presence] Failed to register presence:', err);
        setStatus('error');
      }
    };

    registerPresence();

    // Listen to /presence to count live sessions
    const unsubscribe = onValue(
      presenceRootRef,
      (snapshot) => {
        const val = snapshot.val() as Record<string, unknown> | null;
        setLiveCount(val ? Object.keys(val).length : 0);
        // Use functional update to avoid stale closure on `status`
        setStatus((prev) => (prev === 'loading' ? 'connected' : prev));
      },
      (err) => {
        console.warn('[firebase/presence] onValue error:', err);
        setStatus('error');
        setLiveCount(null);
      }
    );

    cleanupRef.current = () => {
      unsubscribe();
      if (registered) {
        remove(presenceRef).catch(() => {}); // best-effort cleanup on unmount
      }
    };

    return () => cleanupRef.current?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { liveCount, status };
}

