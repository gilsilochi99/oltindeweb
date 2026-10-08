import { uploadFile } from './api';

// Mirrors the web dashboard's upload flow (the web app's own file storage,
// via /api/upload) minus the client-side compression step — Expo's image
// picker already lets the user pick a reasonable quality, so we upload as-is.
export async function uploadImageAsync(uri: string, path: string): Promise<string> {
  return uploadFile(uri, path);
}

export function randomId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
