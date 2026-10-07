import { promises as fs } from 'fs';
import path from 'path';

// User uploads (logos, photos, documents) live as plain files on our own
// hosting — in production the web server's public_html/uploads/, served
// directly by Apache at https://oltinde.com/uploads/... — replacing Firebase
// Storage. The folder layout is the same one Storage used, which is also
// what `npm run download:files` copied over from it.
//
//   UPLOADS_DIR       absolute folder on disk (default: ./public/uploads, for local dev)
//   UPLOADS_BASE_URL  public URL of that folder (default: /uploads)

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads');
const UPLOADS_BASE_URL = (process.env.UPLOADS_BASE_URL || '/uploads').replace(/\/$/, '');

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

// Same top-level folders the app has always uploaded into (see storage.rules).
const ALLOWED_FOLDERS = new Set([
  'companies', 'professionals', 'places', 'health-facilities', 'itineraries', 'institutions',
  'posts', 'menu-items', 'offers', 'announcements', 'documents', 'procedures', 'products', 'rentals',
]);

// Files in the uploads folder are served straight by the web server, so an
// uploaded .php/.html/.svg/.js could run as code or script on our domain.
// Only plain image and document types are accepted.
const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif', 'avif',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'txt', 'csv',
]);

// Second line of defence, written into the uploads folder: even if a script
// file somehow got there, Apache refuses to serve or run it.
const HTACCESS = `# Written by the Oltinde app — uploads are data, never code.
Options -ExecCGI -Indexes
<FilesMatch "(?i)\\.(php[0-9]?|phtml|phar|pl|py|cgi|sh|html?|shtml|svgz?|js|mjs|htaccess)$">
  Require all denied
</FilesMatch>
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
</IfModule>
`;

export class UploadError extends Error {}

// Validates a client-chosen storage path ("companies/abc/logo-<uuid>.webp")
// and returns it normalised: no traversal, known top folder, allowed file
// type, and a file name reduced to URL-safe characters.
export function normaliseUploadPath(rawPath: string): string {
  const segments = rawPath.replace(/\\/g, '/').split('/').filter(Boolean);
  if (segments.length < 2 || segments.some(s => s === '.' || s === '..')) {
    throw new UploadError('Ruta de archivo no válida.');
  }
  if (!ALLOWED_FOLDERS.has(segments[0])) {
    throw new UploadError('Carpeta de destino no permitida.');
  }
  const clean = segments.map(s =>
    s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'file',
  );
  const ext = clean[clean.length - 1].split('.').pop()?.toLowerCase() ?? '';
  if (!clean[clean.length - 1].includes('.') || !ALLOWED_EXTENSIONS.has(ext)) {
    throw new UploadError('Tipo de archivo no permitido.');
  }
  return clean.join('/');
}

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const htaccess = path.join(UPLOADS_DIR, '.htaccess');
  const current = await fs.readFile(htaccess, 'utf8').catch(() => null);
  if (current !== HTACCESS) await fs.writeFile(htaccess, HTACCESS);
}

// Saves the file and returns its public URL.
export async function saveUpload(rawPath: string, data: Buffer): Promise<string> {
  if (data.length > MAX_UPLOAD_BYTES) throw new UploadError('El archivo es demasiado grande (máximo 15 MB).');
  const relPath = normaliseUploadPath(rawPath);
  await ensureUploadsDir();
  const dest = path.join(UPLOADS_DIR, ...relPath.split('/'));
  // Explicit modes instead of the host's umask (Namecheap's 0002 would make
  // them group-writable): owner writes, web server and everyone else read.
  await fs.mkdir(path.dirname(dest), { recursive: true, mode: 0o755 });
  await fs.writeFile(dest, data, { mode: 0o644 });
  return `${UPLOADS_BASE_URL}/${relPath}`;
}

// Deletes a file previously returned by saveUpload(). URLs that aren't ours
// (placeholders, external images) are ignored.
export async function deleteUploadByUrl(url: string): Promise<void> {
  const prefix = `${UPLOADS_BASE_URL}/`;
  if (!url.startsWith(prefix)) return;
  const relPath = decodeURIComponent(url.slice(prefix.length).split(/[?#]/)[0]);
  const dest = path.resolve(UPLOADS_DIR, ...relPath.split('/'));
  if (!dest.startsWith(path.resolve(UPLOADS_DIR) + path.sep)) return;
  await fs.unlink(dest).catch(error => {
    if (error.code !== 'ENOENT') throw error;
  });
}
