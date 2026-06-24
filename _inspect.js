const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const m = env.match(/DATABASE_URL="([^"]+)"/);
if (!m) { console.error('no DATABASE_URL'); process.exit(1); }
const { Pool } = require('pg');
const pool = new Pool({ connectionString: m[1], ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 12000 });
(async () => {
  const cols = await pool.query("select column_name, data_type from information_schema.columns where table_name='hazards' order by ordinal_position");
  console.log('HAZARDS COLS:', cols.rows.map(r => r.column_name + ':' + r.data_type).join(', '));
  const cons = await pool.query("select conname, pg_get_constraintdef(oid) def from pg_constraint where conrelid='hazards'::regclass");
  console.log('CONSTRAINTS:', JSON.stringify(cons.rows));
  const ucols = await pool.query("select column_name from information_schema.columns where table_name='users' order by ordinal_position");
  console.log('USERS COLS:', ucols.rows.map(r => r.column_name).join(', '));
  const cnt = await pool.query("select count(*)::int n, count(*) filter (where status='active')::int active from hazards");
  console.log('COUNTS:', JSON.stringify(cnt.rows));
  await pool.end();
})().catch(e => { console.error('ERR', e.message); process.exit(2); });
