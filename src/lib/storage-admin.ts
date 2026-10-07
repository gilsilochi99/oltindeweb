import { saveUpload } from './uploads';

// Server-side counterpart of useStorage().uploadFile() — used for files the
// server fetches itself (e.g. Google Places photos on import). Stores the
// buffer on our own hosting and returns its public URL.
export async function uploadBufferToStorage(path: string, buffer: Buffer, contentType: string): Promise<string> {
  return saveUpload(path, buffer);
}
