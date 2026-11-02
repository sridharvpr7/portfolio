/**
 * api/__tests__/server.test.ts
 *
 * Unit tests for server routing utilities in api/server-router.ts.
 * Tests cover cases 23–30 (routing, caching, body parsing, method enforcement).
 *
 *  23. API route dispatch — known routes call correct handler
 *  24. API route dispatch — unknown /api/* returns 404
 *  25. SPA fallback classification
 *  26. Static asset cache headers
 *  27. Data file cache headers
 *  28. Body parsing — valid JSON, non-JSON, malformed JSON
 *  29. Security header applied before dispatch
 *  30. Method enforcement — wrong HTTP method returns 405
 */

import { describe, it, expect, vi } from 'vitest';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import {
  getCacheHeader,
  isSpaRoute,
  parseJsonBody,
  dispatchApi,
  type ApiHandlers,
} from '../server-router.ts';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeReq(method: string, url: string, headers: Record<string, string> = {}): IncomingMessage {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  req.method = method;
  req.url = url;
  Object.assign(req.headers, headers);
  return req;
}

interface MockServerResponse extends ServerResponse {
  _status: number;
  _headers: Record<string, string>;
  _body: string;
}

function makeRes(): MockServerResponse {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  const res = new ServerResponse(req) as MockServerResponse;
  res._status = 200;
  res._headers = {};
  res._body = '';

  const origWriteHead = res.writeHead.bind(res);
  (res as any).writeHead = (status: number, headers?: Record<string, string>) => {
    res._status = status;
    if (headers) Object.assign(res._headers, headers);
    return origWriteHead(status, headers as any);
  };

  const origSetHeader = res.setHeader.bind(res);
  (res as any).setHeader = (name: string, value: string | number | readonly string[]) => {
    res._headers[name.toLowerCase()] = String(value);
    return origSetHeader(name, value as any);
  };

  (res as any).end = (data?: string | Buffer) => {
    if (data) res._body += data.toString();
    return res;
  };

  // Vercel-style .json() / .status() shims so real handlers work in tests
  (res as any).json = (data: unknown) => {
    res._body = JSON.stringify(data);
    return res;
  };
  (res as any).status = (s: number) => {
    res._status = s;
    return res as any;
  };

  return res;
}

function makeHandlers(overrides: Partial<ApiHandlers> = {}): ApiHandlers {
  const noop = vi.fn(async (_req: IncomingMessage, res: ServerResponse) => {
    (res as any).writeHead(200);
    (res as any).end('{}');
  });
  return {
    track: noop,
    heartbeat: noop,
    stats: noop,
    authGoogle: noop,
    authLogout: noop,
    adminDelete: noop,
    emailConsent: noop,
    telegramWebhook: noop,
    ...overrides,
  };
}

// ── 23. API route dispatch — known routes call correct handler ────────────────
describe('23. API Route Dispatch — Known Routes', () => {
  it('dispatches GET /api/stats to the stats handler', async () => {
    const statsMock = vi.fn(async (_req: IncomingMessage, res: ServerResponse) => {
      (res as any).writeHead(200); (res as any).end('{}');
    });
    const handlers = makeHandlers({ stats: statsMock });
    const req = makeReq('GET', '/api/stats');
    (req as any).body = {};
    const res = makeRes();

    await dispatchApi(req, res, handlers);

    expect(statsMock).toHaveBeenCalledOnce();
  });

  it('dispatches POST /api/track to the track handler', async () => {
    const trackMock = vi.fn(async (_req: IncomingMessage, res: ServerResponse) => {
      (res as any).writeHead(200); (res as any).end('{}');
    });
    const handlers = makeHandlers({ track: trackMock });
    const req = makeReq('POST', '/api/track');
    (req as any).body = { sessionToken: 'abc', pagePath: '/' };
    const res = makeRes();

    await dispatchApi(req, res, handlers);

    expect(trackMock).toHaveBeenCalledOnce();
  });

  it('dispatches POST /api/heartbeat to the heartbeat handler', async () => {
    const heartbeatMock = vi.fn(async (_req: IncomingMessage, res: ServerResponse) => {
      (res as any).writeHead(200); (res as any).end('{}');
    });
    const handlers = makeHandlers({ heartbeat: heartbeatMock });
    const req = makeReq('POST', '/api/heartbeat');
    (req as any).body = { sessionToken: 'abc' };
    const res = makeRes();

    await dispatchApi(req, res, handlers);

    expect(heartbeatMock).toHaveBeenCalledOnce();
  });

  it('dispatches POST /api/auth/google to the authGoogle handler', async () => {
    const mock = vi.fn(async (_req: IncomingMessage, res: ServerResponse) => {
      (res as any).writeHead(200); (res as any).end('{}');
    });
    const handlers = makeHandlers({ authGoogle: mock });
    const req = makeReq('POST', '/api/auth/google');
    (req as any).body = { credential: 'token' };
    const res = makeRes();

    await dispatchApi(req, res, handlers);

    expect(mock).toHaveBeenCalledOnce();
  });

  it('dispatches POST /api/auth/logout to the authLogout handler', async () => {
    const mock = vi.fn(async (_req: IncomingMessage, res: ServerResponse) => {
      (res as any).writeHead(200); (res as any).end('{}');
    });
    const handlers = makeHandlers({ authLogout: mock });
    const req = makeReq('POST', '/api/auth/logout');
    (req as any).body = {};
    const res = makeRes();

    await dispatchApi(req, res, handlers);

    expect(mock).toHaveBeenCalledOnce();
  });

  it('dispatches POST /api/telegram/webhook to the telegramWebhook handler', async () => {
    const mock = vi.fn(async (_req: IncomingMessage, res: ServerResponse) => {
      (res as any).writeHead(200); (res as any).end('');
    });
    const handlers = makeHandlers({ telegramWebhook: mock });
    const req = makeReq('POST', '/api/telegram/webhook');
    (req as any).body = {};
    const res = makeRes();

    await dispatchApi(req, res, handlers);

    expect(mock).toHaveBeenCalledOnce();
  });
});

// ── 24. API route dispatch — unknown /api/* returns 404 ──────────────────────
describe('24. API Route Dispatch — Unknown Route', () => {
  it('returns 404 JSON for /api/does-not-exist', async () => {
    const handlers = makeHandlers();
    const req = makeReq('GET', '/api/does-not-exist');
    (req as any).body = {};
    const res = makeRes();

    await dispatchApi(req, res, handlers);

    expect(res._status).toBe(404);
    expect(res._body).toContain('Not found');
  });

  it('returns 404 JSON for /api/admin/anything-else', async () => {
    const handlers = makeHandlers();
    const req = makeReq('GET', '/api/admin/unknown');
    (req as any).body = {};
    const res = makeRes();

    await dispatchApi(req, res, handlers);

    expect(res._status).toBe(404);
  });
});

// ── 25. SPA fallback classification ──────────────────────────────────────────
describe('25. SPA Route Classification', () => {
  it('identifies root as SPA route', () => {
    expect(isSpaRoute('/')).toBe(true);
  });

  it('identifies named frontend routes as SPA routes', () => {
    expect(isSpaRoute('/about')).toBe(true);
    expect(isSpaRoute('/projects')).toBe(true);
    expect(isSpaRoute('/projects/my-project')).toBe(true);
    expect(isSpaRoute('/skills')).toBe(true);
    expect(isSpaRoute('/contact')).toBe(true);
  });

  it('marks /api/* as non-SPA', () => {
    expect(isSpaRoute('/api/stats')).toBe(false);
    expect(isSpaRoute('/api/track')).toBe(false);
    expect(isSpaRoute('/api/auth/google')).toBe(false);
  });

  it('marks /assets/* as non-SPA', () => {
    expect(isSpaRoute('/assets/main-Bk9aVEig.js')).toBe(false);
    expect(isSpaRoute('/assets/style.css')).toBe(false);
  });

  it('marks /data/* as non-SPA', () => {
    expect(isSpaRoute('/data/profile.json')).toBe(false);
    expect(isSpaRoute('/data/notifications.json')).toBe(false);
  });
});

// ── 26. Static asset cache headers ────────────────────────────────────────────
describe('26. Static Asset Cache Headers', () => {
  it('returns immutable long-lived cache for /assets/*', () => {
    expect(getCacheHeader('/assets/index-Bk9aVEig.js')).toBe('public, max-age=31536000, immutable');
    expect(getCacheHeader('/assets/style-abc123.css')).toBe('public, max-age=31536000, immutable');
  });
});

// ── 27. Data file cache headers ────────────────────────────────────────────────
describe('27. Data File Cache Headers', () => {
  it('returns must-revalidate for /data/*', () => {
    expect(getCacheHeader('/data/profile.json')).toBe('public, max-age=0, must-revalidate');
    expect(getCacheHeader('/data/notifications.json')).toBe('public, max-age=0, must-revalidate');
  });

  it('returns no-cache for root and SPA paths', () => {
    expect(getCacheHeader('/')).toBe('no-cache');
    expect(getCacheHeader('/about')).toBe('no-cache');
    expect(getCacheHeader('/projects')).toBe('no-cache');
  });
});

// ── 28. Body parsing ───────────────────────────────────────────────────────────
describe('28. JSON Body Parsing', () => {
  it('parses a valid JSON body', async () => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.headers['content-type'] = 'application/json';

    const body = JSON.stringify({ sessionToken: 'test-token', pagePath: '/projects' });
    const parsePromise = parseJsonBody(req);

    process.nextTick(() => {
      req.emit('data', Buffer.from(body));
      req.emit('end');
    });

    const result = await parsePromise;
    expect(result).toEqual({ sessionToken: 'test-token', pagePath: '/projects' });
  });

  it('returns empty object for non-JSON content type', async () => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.headers['content-type'] = 'text/plain';

    const result = await parseJsonBody(req);
    expect(result).toEqual({});
  });

  it('returns empty object for missing content-type header', async () => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    // No content-type header set

    const result = await parseJsonBody(req);
    expect(result).toEqual({});
  });

  it('returns empty object for malformed JSON', async () => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.headers['content-type'] = 'application/json';

    const parsePromise = parseJsonBody(req);
    process.nextTick(() => {
      req.emit('data', Buffer.from('{invalid'));
      req.emit('end');
    });

    const result = await parsePromise;
    expect(result).toEqual({});
  });

  it('returns empty object for empty JSON body', async () => {
    const socket = new Socket();
    const req = new IncomingMessage(socket);
    req.headers['content-type'] = 'application/json';

    const parsePromise = parseJsonBody(req);
    process.nextTick(() => {
      req.emit('data', Buffer.from(''));
      req.emit('end');
    });

    const result = await parsePromise;
    expect(result).toEqual({});
  });
});

// ── 29. Security header ────────────────────────────────────────────────────────
describe('29. Security Headers', () => {
  it('dispatchApi sets Cache-Control: no-store on API responses', async () => {
    const statsMock = vi.fn(async (_req: IncomingMessage, res: ServerResponse) => {
      (res as any).writeHead(200); (res as any).end('{}');
    });
    const handlers = makeHandlers({ stats: statsMock });
    const req = makeReq('GET', '/api/stats');
    (req as any).body = {};
    const res = makeRes();

    await dispatchApi(req, res, handlers);

    expect(res._headers['cache-control']).toBe('no-store');
  });
});

// ── 30. Method enforcement ─────────────────────────────────────────────────────
describe('30. HTTP Method Enforcement', () => {
  it('stats handler returns 405 when called with POST', async () => {
    vi.resetModules();

    // Prevent DB from being called by removing the env var
    const origDb = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      const { default: statsHandler } = await import('../stats.ts');
      const req = makeReq('POST', '/api/stats');
      (req as any).body = {};
      const res = makeRes();

      await statsHandler(req as any, res as any);

      expect(res._status).toBe(405);
    } finally {
      if (origDb) process.env.DATABASE_URL = origDb;
    }
  });

  it('heartbeat handler returns 405 when called with GET', async () => {
    vi.resetModules();
    const origDb = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    try {
      const { default: heartbeatHandler } = await import('../heartbeat.ts');
      const req = makeReq('GET', '/api/heartbeat');
      (req as any).body = {};
      const res = makeRes();

      await heartbeatHandler(req as any, res as any);

      expect(res._status).toBe(405);
    } finally {
      if (origDb) process.env.DATABASE_URL = origDb;
    }
  });
});
