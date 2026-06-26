// Uploads every file in ./seed-photos straight to Vercel Blob and writes
// the resulting public URLs to seed-photo-urls.json for the next script.
//
// Run with:  node --env-file=.env.local script/upload-seed-photos.mjs
import { put } from "@vercel/blob";
import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";

const DIR = path.join(process.cwd(), "seed-photos");

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is missing. Did you run with --env-file=.env.local ?");
    process.exit(1);
  }

  const files = (await readdir(DIR)).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));
  if (files.length === 0) {
    console.error(`No image files found in ${DIR}`);
    process.exit(1);
  }

  const urls = {};
  for (const file of files) {
    const buf = await readFile(path.join(DIR, file));
    const ext = path.extname(file) || ".jpg";
    const blobName = `hazards/seed-${path.basename(file, ext)}-${Date.now()}${ext}`;
    const blob = await put(blobName, buf, { access: "public" });
    urls[file] = blob.url;
    console.log(`Uploaded ${file} -> ${blob.url}`);
  }

  await writeFile(path.join(process.cwd(), "seed-photo-urls.json"), JSON.stringify(urls, null, 2));
  console.log(`\nDone. Wrote seed-photo-urls.json with ${Object.keys(urls).length} entries.`);
}

main().catch((err) => { console.error(err); process.exit(1); });