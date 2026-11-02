// api/db/client.ts
// Shared Neon serverless PostgreSQL client — server-side only

import { neon } from '@neondatabase/serverless';

let _sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  if (!_sql) {
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
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
