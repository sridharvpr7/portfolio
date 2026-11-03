// api/db/client.ts
// Shared Neon serverless PostgreSQL client — server-side only

import { neon } from '@neondatabase/serverless';

let _sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    const err = new Error('DATABASE_URL environment variable is not set. Database operations will fail.');
    console.error('[db] Configuration error:', err.message);
    throw err;
  }
  if (!_sql) {
    try {
      _sql = neon(process.env.DATABASE_URL);
    } catch (err) {
      console.error('[db] Initialization error:', err instanceof Error ? (err.stack || err.message) : err);
      throw err;
    }
  }
  return _sql;
}

// Check database connection and SQL execution independently
export async function checkDbConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const sql = getDb();
    await sql`SELECT 1 AS alive`;
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? (err.stack || err.message) : String(err);
    console.error('[db] Connection check failed:', msg);
    return { ok: false, error: msg };
  }
}

// Convenience: run query and return rows, never throws to caller —
// caller decides how to handle
export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const sql = getDb();
  const result = await sql(strings, ...values);
  return result as T[];
}
