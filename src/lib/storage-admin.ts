import { v4 as uuidv4 } from 'uuid';
import { getAdminStorage } from './firebase-admin';

// Uploads a buffer via the Admin SDK and returns a URL in the exact format
// the client SDK's getDownloadURL() produces
// (https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token=...),
// using a firebaseStorageDownloadTokens file-metadata token the same way the
// client SDK does. This keeps every image URL in the app on one host, already
// allow-listed in next.config.ts's images.remotePatterns.
export async function uploadBufferToStorage(path: string, buffer: Buffer, contentType: string): Promise<string> {
  const bucket = getAdminStorage().bucket();
  const token = uuidv4();
  const file = bucket.file(path);

  await file.save(buffer, {
    metadata: {
      contentType,
      metadata: { firebaseStorageDownloadTokens: token },
    },
  });

  const encodedPath = encodeURIComponent(path);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;
}
