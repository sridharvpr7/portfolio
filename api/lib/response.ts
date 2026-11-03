// api/lib/response.ts
// Unified HTTP request and response interfaces for the portfolio API.
// Provides Express/Vercel-compatible response methods (status, json, send)
// wrapping native Node.js ServerResponse with single-send protection.

import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ApiResponse extends ServerResponse {
  status(statusCode: number): this;
  json(data: unknown): this;
  send(body?: unknown): this;
}

export type ApiRequest = IncomingMessage & {
  body?: Record<string, unknown>;
  query?: Record<string, string>;
};

/**
 * Adapts a native Node.js ServerResponse into an Express/Vercel-compatible ApiResponse.
 *
 * Guarantees:
 * 1. res.status(code) sets res.statusCode (and updates _status for test mocks) and returns res for chaining.
 * 2. res.json(data) sets Content-Type: application/json; charset=utf-8, serializes body, and ends the response.
 * 3. res.send(body) handles objects (via json), strings, or empty ends.
 * 4. Responses are sent only once: if headersSent or writableEnded is true, subsequent calls are no-ops.
 * 5. Native methods (setHeader, getHeader, writeHead, end) remain fully available.
 */
export function adaptResponse(res: ServerResponse): ApiResponse {
  const adapted = res as ApiResponse;

  // Preserve existing methods if already fully adapted
  if (
    typeof adapted.status === 'function' &&
    typeof adapted.json === 'function' &&
    typeof adapted.send === 'function'
  ) {
    return adapted;
  }

  adapted.status = function (statusCode: number): ApiResponse {
    if (!this.headersSent) {
      this.statusCode = statusCode;
      (this as any)._status = statusCode;
    }
    return this;
  };

  adapted.json = function (data: unknown): ApiResponse {
    if (this.writableEnded || this.headersSent) {
      return this;
    }
    try {
      const jsonStr = JSON.stringify(data ?? null);
      if (!this.headersSent) {
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      (this as any)._body = ((this as any)._body || '') + jsonStr;
      this.end(jsonStr);
    } catch (err) {
      console.error('[response] Failed to serialize JSON response:', err);
      if (!this.headersSent) {
        this.statusCode = 500;
        (this as any)._status = 500;
        this.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      this.end(JSON.stringify({ error: 'Serialization error' }));
    }
    return this;
  };

  adapted.send = function (body?: unknown): ApiResponse {
    if (this.writableEnded || this.headersSent) {
      return this;
    }
    if (body !== null && typeof body === 'object') {
      return this.json(body);
    }
    if (!this.headersSent && !this.getHeader('Content-Type')) {
      this.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }
    const str = body !== undefined ? String(body) : '';
    (this as any)._body = ((this as any)._body || '') + str;
    this.end(str);
    return this;
  };

  return adapted;
}
