// api/lib/googleAuth.ts
// Verifies Google ID tokens using google-auth-library
// Validates token signature, issuer, audience, and expiration

import { OAuth2Client } from 'google-auth-library';

export interface VerifiedGoogleUser {
  sub: string;
  email: string;
  name: string;
}

/**
 * Verifies a Google ID token on the server.
 * Never trusts client-supplied claims.
 */
export async function verifyGoogleIdToken(
  token: string,
  clientId: string,
  client: OAuth2Client = new OAuth2Client()
): Promise<VerifiedGoogleUser> {
  if (!token || typeof token !== 'string') {
    throw new Error('Missing or invalid token');
  }
  if (!clientId || typeof clientId !== 'string') {
    throw new Error('Missing client ID');
  }

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error('Invalid token payload: missing sub or email');
  }

  const name = payload.name || payload.given_name || payload.email;

  return {
    sub: payload.sub,
    email: payload.email,
    name,
  };
}
