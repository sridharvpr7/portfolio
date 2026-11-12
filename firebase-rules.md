# Firebase Realtime Database — Security Rules

Paste these rules into Firebase Console → Realtime Database → Rules.

## Minimal Rules for Portfolio Presence

```json
{
  "rules": {
    "presence": {
      ".read": true,
      "$sessionId": {
        ".write": "!data.exists() || newData.val() === null",
        ".validate": "newData.hasChildren(['connectedAt'])"
      }
    }
  }
}
```

### What these rules do

| Path | Read | Write | Notes |
|------|------|-------|-------|
| `/presence` | ✅ Anyone | ❌ | Public read for counting visitors |
| `/presence/$sessionId` | ✅ | ✅ New/delete only | Session can write its own entry or delete it |

### How presence works

1. When a visitor loads the portfolio, the app writes `{ connectedAt: <server-timestamp> }` to `/presence/<sessionId>`.
2. Firebase's `onDisconnect()` is registered to automatically delete the entry when the browser tab closes or goes offline.
3. The app subscribes to `/presence` and counts the number of child keys to get the live visitor count.
4. A `sessionId` is stored in `sessionStorage` — each browser tab has one unique ID and cannot double-count.

### Cleanup timing

Firebase's onDisconnect runs when:
- The browser closes (fires immediately via WebSocket FIN).
- The internet goes down (fires after ~60 s of no heartbeat — Firebase's built-in timeout).
- The app calls `remove()` explicitly on unmount.

This means the count may briefly include recently-disconnected tabs. This is normal and expected for presence systems.

### Important: Do not store user data in the Realtime Database

This portfolio only stores presence session markers (anonymous, no PII). Do not change the rules to allow writing user emails or personal data without adding proper authentication checks.

