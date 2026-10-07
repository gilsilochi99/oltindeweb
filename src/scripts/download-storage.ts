// Downloads every file in Firebase Storage to migration-output/uploads/,
// keeping the same folder structure (companies/<id>/logo.jpg, ...), so it
// can be uploaded to the hosting's public_html/uploads/ with
// `npm run upload:files`.
//
// Read-only against Firebase. Safe to re-run: files already downloaded with
// the same size are skipped, so an interrupted run just continues.
//
//   npm run download:files
//
// Needs GOOGLE_APPLICATION_CREDENTIALS (from .env.local).

import * as admin from 'firebase-admin';
import { promises as fs } from 'fs';
import path from 'path';

const BUCKET = 'oltindeapp.firebasestorage.app';
const OUT_DIR = path.resolve(process.cwd(), 'migration-output/uploads');
const PARALLEL = 8;

admin.initializeApp();

async function main() {
  const [files] = await admin.storage().bucket(BUCKET).getFiles();
  const toFetch = files.filter(f => !f.name.endsWith('/')); // skip folder placeholders
  console.log(`${toFetch.length} files in Firebase Storage`);

  let downloaded = 0;
  let skipped = 0;
  const failed: string[] = [];

  const queue = [...toFetch];
  async function worker() {
    for (let file = queue.shift(); file; file = queue.shift()) {
      const dest = path.join(OUT_DIR, ...file.name.split('/'));
      try {
        const size = Number(file.metadata.size ?? -1);
        const existing = await fs.stat(dest).catch(() => null);
        if (existing && existing.size === size) {
          skipped++;
          continue;
        }
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await file.download({ destination: dest });
        downloaded++;
        if ((downloaded + skipped) % 50 === 0) console.log(`  ${downloaded + skipped}/${toFetch.length}...`);
      } catch (error) {
        failed.push(`${file.name}: ${error instanceof Error ? error.message : error}`);
      }
    }
  }
  await Promise.all(Array.from({ length: PARALLEL }, worker));

  console.log(`\nDownloaded ${downloaded}, already had ${skipped}, failed ${failed.length}.`);
  failed.forEach(f => console.log('  - ' + f));
  console.log(`Files are in ${path.relative(process.cwd(), OUT_DIR)}`);
  if (failed.length) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
