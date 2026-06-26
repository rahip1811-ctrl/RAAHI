// Reads seed-photo-urls.json (from upload-seed-photos.mjs), groups the
// uploaded photos by hazard type based on filename prefix, then updates
// every hazard row in the live database so photo_url points to a real,
// correctly-matched photo instead of being empty / using a stock fallback.
//
// Run with:  node --env-file=.env.local scripts/assign-seed-photos.mjs
import { Pool } from "pg";
import { readFile } from "fs/promises";
import path from "path";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is missing. Did you run with --env-file=.env.local ?");
    process.exit(1);
  }

  const urlsPath = path.join(process.cwd(), "seed-photo-urls.json");
  const urlMap = JSON.parse(await readFile(urlsPath, "utf8"));

  // Group uploaded URLs by type, based on filename prefix (pothole1.jpg -> "pothole").
  const byType = { pothole: [], debris: [], construction: [] };
  for (const [filename, url] of Object.entries(urlMap)) {
    const type = filename.replace(/[0-9.].*$/, "").toLowerCase();
    if (byType[type]) byType[type].push(url);
  }

  for (const [type, urls] of Object.entries(byType)) {
    console.log(`${type}: ${urls.length} photo(s) available`);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const { rows } = await pool.query("select id, type from hazards order by created_at asc");
  console.log(`\nFound ${rows.length} hazard rows in the database.`);

  // Round-robin assign: if a type has fewer photos than reports, photos repeat in order.
  const counters = { pothole: 0, debris: 0, construction: 0 };
  let updated = 0;

  for (const row of rows) {
    const type = (row.type || "").toLowerCase();
    const poolForType = byType[type];
    if (!poolForType || poolForType.length === 0) {
      console.log(`Skipping hazard ${row.id} — no uploaded photo for type "${row.type}"`);
      continue;
    }
    const url = poolForType[counters[type] % poolForType.length];
    counters[type]++;
    await pool.query("update hazards set photo_url = $1 where id = $2", [url, row.id]);
    updated++;
  }

  console.log(`\nDone. Updated ${updated} of ${rows.length} hazard rows with real photos.`);
  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });