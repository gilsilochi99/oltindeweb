import { auth } from './firebase';
import { WEB_APP_URL } from './config';

// All data now lives in the web app's MySQL database, reached through its
// /api/mobile/rpc endpoint — the app no longer talks to Firestore. `fn` is
// the name of a web app function (see src/app/api/mobile/rpc/route.ts on the
// web side for the allowed list); the server runs it with the same
// permission checks the website uses.

async function authHeaders(): Promise<Record<string, string>> {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function rpc<T = unknown>(fn: string, ...args: unknown[]): Promise<T> {
  const response = await fetch(`${WEB_APP_URL}/api/mobile/rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    body: JSON.stringify({ fn, args }),
  });
  let body: { result?: T; error?: string } = {};
  try {
    body = await response.json();
  } catch {
    // non-JSON error page
  }
  if (!response.ok) {
    throw new Error(body.error || `Error del servidor (${response.status}).`);
  }
  return body.result as T;
}

// Most web write functions report failure as { success: false, message }
// instead of throwing; turn that into an exception, which is what the
// mutations in use-queries.ts expect.
export async function rpcAction<T extends { success: boolean; message?: string }>(
  fn: string,
  ...args: unknown[]
): Promise<T> {
  const result = await rpc<T>(fn, ...args);
  if (!result?.success) throw new Error(result?.message || 'No se pudo completar la acción.');
  return result;
}

// Uploads a picked image to the web app's own file storage (/api/upload).
export async function uploadFile(uri: string, path: string): Promise<string> {
  const url = await uploadFileRaw(uri, path);
  // Local dev returns a site-relative /uploads/... URL; the app needs an absolute one.
  return url.startsWith('/') ? `${WEB_APP_URL}${url}` : url;
}

// Same, returning the URL exactly as the server gave it — for data saved
// back to the server (products, rentals), which accepts site-relative URLs.
export async function uploadFileRaw(uri: string, path: string): Promise<string> {
  const name = path.split('/').pop() || 'upload.jpg';
  const ext = name.split('.').pop()?.toLowerCase();
  const form = new FormData();
  // React Native's FormData accepts a { uri, name, type } file descriptor.
  form.append('file', { uri, name, type: ext === 'png' ? 'image/png' : 'image/jpeg' } as unknown as Blob);
  form.append('path', path);

  const response = await fetch(`${WEB_APP_URL}/api/upload`, {
    method: 'POST',
    headers: await authHeaders(),
    body: form,
  });
  const body: { url?: string; error?: string } = await response.json().catch(() => ({}));
  if (!response.ok || !body.url) throw new Error(body.error || 'No se pudo subir el archivo.');
  return body.url;
}
