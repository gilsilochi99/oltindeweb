// One-off backfill: finds every base64 data: URL still sitting in Firestore
// (from before forms uploaded to Firebase Storage directly — see
// src/lib/image-upload.ts and src/hooks/use-storage.tsx) and replaces it with
// a Storage download URL. Idempotent: any field that's already an https://
// URL is left untouched, so this is safe to re-run if interrupted.
//
// Intentionally standalone (its own Admin SDK init, no imports from
// src/lib/firebase-admin.ts) because that module imports next/headers, which
// only resolves inside a Next.js-managed module graph — this script runs via
// plain tsx outside of Next entirely.
//
// Usage:
//   npx tsx scripts/migrate-images-to-storage.ts --dry-run   (report only, no writes)
//   npx tsx scripts/migrate-images-to-storage.ts             (writes for real)

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const app = admin.initializeApp({ storageBucket: 'oltindeapp.firebasestorage.app' });
const db = admin.firestore(app);
const bucket = admin.storage(app).bucket();

const DRY_RUN = process.argv.includes('--dry-run');

function parseDataUrl(value: unknown): { contentType: string; buffer: Buffer } | null {
  if (typeof value !== 'string' || !value.startsWith('data:')) return null;
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { contentType: match[1], buffer: Buffer.from(match[2], 'base64') };
}

function extFromContentType(contentType: string): string {
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'application/pdf') return 'pdf';
  return 'jpg';
}

let uploadedCount = 0;
let uploadedBytes = 0;

async function uploadDataUrl(collectionName: string, docId: string, field: string, dataUrl: string): Promise<string> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) throw new Error(`Not a valid data URL for ${collectionName}/${docId}.${field}`);

  uploadedCount++;
  uploadedBytes += parsed.buffer.byteLength;

  if (DRY_RUN) {
    return dataUrl; // no-op placeholder, never written in dry-run
  }

  const path = `${collectionName}/${docId}/migrated-${field}-${uuidv4()}.${extFromContentType(parsed.contentType)}`;
  const token = uuidv4();
  const file = bucket.file(path);
  await file.save(parsed.buffer, {
    metadata: { contentType: parsed.contentType, metadata: { firebaseStorageDownloadTokens: token } },
  });
  const encodedPath = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
}

type FieldSpec =
  | { type: 'string'; path: string }
  | { type: 'stringArray'; path: string }
  | { type: 'objectArrayImage'; path: string; imageKey: string };

async function migrateDoc(collectionName: string, docId: string, data: FirebaseFirestore.DocumentData, specs: FieldSpec[]) {
  const updates: Record<string, unknown> = {};

  for (const spec of specs) {
    if (spec.type === 'string') {
      const value = data[spec.path];
      if (typeof value === 'string' && value.startsWith('data:')) {
        updates[spec.path] = await uploadDataUrl(collectionName, docId, spec.path, value);
      }
    } else if (spec.type === 'stringArray') {
      const arr = data[spec.path];
      if (Array.isArray(arr) && arr.some(v => typeof v === 'string' && v.startsWith('data:'))) {
        updates[spec.path] = await Promise.all(arr.map((v: unknown) =>
          typeof v === 'string' && v.startsWith('data:') ? uploadDataUrl(collectionName, docId, spec.path, v) : v
        ));
      }
    } else if (spec.type === 'objectArrayImage') {
      const arr = data[spec.path];
      if (Array.isArray(arr) && arr.some((item: any) => typeof item?.[spec.imageKey] === 'string' && item[spec.imageKey].startsWith('data:'))) {
        updates[spec.path] = await Promise.all(arr.map(async (item: any) => {
          if (typeof item?.[spec.imageKey] === 'string' && item[spec.imageKey].startsWith('data:')) {
            return { ...item, [spec.imageKey]: await uploadDataUrl(collectionName, docId, `${spec.path}.${spec.imageKey}`, item[spec.imageKey]) };
          }
          return item;
        }));
      }
    }
  }

  if (Object.keys(updates).length === 0) return false;

  console.log(`${DRY_RUN ? '[dry-run] would migrate' : 'migrating'} ${collectionName}/${docId}: ${Object.keys(updates).join(', ')}`);
  if (!DRY_RUN) {
    await db.collection(collectionName).doc(docId).update(updates);
    await new Promise(resolve => setTimeout(resolve, 50)); // stay polite to Firestore/Storage quotas
  }
  return true;
}

const COLLECTIONS: { name: string; specs: FieldSpec[] }[] = [
  {
    name: 'companies',
    specs: [
      { type: 'string', path: 'logo' },
      { type: 'string', path: 'image' },
      { type: 'stringArray', path: 'gallery' },
      { type: 'objectArrayImage', path: 'products', imageKey: 'image' },
    ],
  },
  {
    name: 'professionals',
    specs: [
      { type: 'string', path: 'photo' },
      { type: 'stringArray', path: 'portfolio' },
    ],
  },
  { name: 'posts', specs: [{ type: 'string', path: 'featuredImage' }] },
  { name: 'touristLocations', specs: [{ type: 'string', path: 'image' }] },
  { name: 'healthFacilities', specs: [{ type: 'string', path: 'image' }] },
  { name: 'itineraries', specs: [{ type: 'string', path: 'coverImage' }] },
  { name: 'institutions', specs: [{ type: 'string', path: 'logo' }] },
  { name: 'procedures', specs: [{ type: 'objectArrayImage', path: 'documents', imageKey: 'url' }] },
];

async function main() {
  console.log(DRY_RUN ? 'DRY RUN — no writes will be made.\n' : 'LIVE RUN — writing to production Firestore/Storage.\n');

  let migratedDocs = 0;
  for (const { name, specs } of COLLECTIONS) {
    const snapshot = await db.collection(name).get();
    let collectionMigrated = 0;
    for (const doc of snapshot.docs) {
      const changed = await migrateDoc(name, doc.id, doc.data(), specs);
      if (changed) { collectionMigrated++; migratedDocs++; }
    }
    console.log(`${name}: ${collectionMigrated}/${snapshot.size} docs ${DRY_RUN ? 'would be' : 'were'} migrated`);
  }

  console.log(`\nTotal: ${migratedDocs} docs, ${uploadedCount} images/files, ${(uploadedBytes / 1024 / 1024).toFixed(2)} MB`);
  if (DRY_RUN) console.log('Re-run without --dry-run to apply.');
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
