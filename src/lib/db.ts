import { Pool } from "pg";

// One shared connection POOL for the whole app.
//
// We connect through Supabase's Transaction Pooler (port 6543) using the
// DATABASE_URL secret. The pooler recycles connections, so many serverless
// API calls can hit the database at once without exhausting Postgres's
// connection limit — this is the "won't hang under load" piece (your point #2).
//
// We stash the pool on `globalThis` so Next.js's dev hot-reload doesn't create
// a brand-new pool on every code change.

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

const pool =
  global._pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5, // small local pool; Supabase's pooler does the real scaling
    ssl: { rejectUnauthorized: false }, // Supabase requires SSL
    statement_timeout: 5000, // auto-kill any query that runs >5s, so a stuck
    // query can't pile up and take the database down under load
    connectionTimeoutMillis: 10000, // give up if a connection can't be had in 10s
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

export const db = pool;
