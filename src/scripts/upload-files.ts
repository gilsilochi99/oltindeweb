// Uploads migration-output/uploads/ (from `npm run download:files`) to the
// hosting over FTP, so the files are served at https://oltinde.com/uploads/...
//
// Safe to re-run: files already on the server with the same size are skipped.
//
//   npm run upload:files
//
// Needs in .env.local (cPanel → FTP Accounts):
//   FTP_HOST=server123.web-hosting.com   # the server name cPanel shows, so the TLS certificate matches
//   FTP_USER=you@oltinde.com
//   FTP_PASSWORD=...
//   FTP_REMOTE_DIR=public_html/uploads   # relative to the FTP account's home folder
//   FTP_TLS_SERVERNAME=premium61-4.web-hosting.com   # only if FTP_HOST is an IP address

import { Client, type FileInfo } from 'basic-ftp';
import { promises as fs } from 'fs';
import path from 'path';

const LOCAL_DIR = path.resolve(process.cwd(), 'migration-output/uploads');

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} in .env.local — see the comment at the top of src/scripts/upload-files.ts.`);
    process.exit(1);
  }
  return value;
}

async function listLocal(dir: string, prefix = ''): Promise<{ rel: string; size: number }[]> {
  const out: { rel: string; size: number }[] = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listLocal(full, rel)));
    else out.push({ rel, size: (await fs.stat(full)).size });
  }
  return out;
}

async function main() {
  const host = requireEnv('FTP_HOST');
  const user = requireEnv('FTP_USER');
  const password = requireEnv('FTP_PASSWORD');
  const remoteRoot = (process.env.FTP_REMOTE_DIR || 'public_html/uploads').replace(/\/$/, '');

  const files = await listLocal(LOCAL_DIR).catch(() => []);
  if (!files.length) {
    console.error('migration-output/uploads is empty — run `npm run download:files` first.');
    process.exit(1);
  }

  let client = new Client();
  async function connect() {
    client.close();
    client = new Client(30_000);
    client.ftp.verbose = process.env.FTP_VERBOSE === '1';
    // Explicit FTPS: the password and files are encrypted in transit.
    // FTP_TLS_SERVERNAME lets FTP_HOST be an IP while still verifying the
    // server's certificate against its real name.
    const servername = process.env.FTP_TLS_SERVERNAME;
    await client.access({ host, user, password, secure: true, ...(servername && { secureOptions: { servername } }) });
  }
  await connect();
  console.log(`Connected to ${host}. Uploading ${files.length} files to ${remoteRoot}/ ...`);

  // Group by folder so each remote folder is created and listed only once.
  const byDir = new Map<string, { rel: string; size: number }[]>();
  for (const f of files) {
    const dir = path.posix.dirname(f.rel);
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir)!.push(f);
  }

  let uploaded = 0;
  let skipped = 0;
  const failed: string[] = [];
  const MAX_ATTEMPTS = 5;
  for (const [dir, dirFiles] of byDir) {
    const remoteDir = dir === '.' ? remoteRoot : `${remoteRoot}/${dir}`;
    const done = new Set<string>();
    // The server sometimes resets the TLS data connection, which closes the
    // client. Reconnect and retry the folder; finished files are skipped.
    for (let attempt = 1; ; attempt++) {
      try {
        await client.cd('/');
        await client.ensureDir(remoteDir); // creates and enters it
        const remote = new Map((await client.list()).map((r: FileInfo) => [r.name, r.size]));
        for (const f of dirFiles) {
          if (done.has(f.rel)) continue;
          const name = path.posix.basename(f.rel);
          if (remote.get(name) === f.size) {
            skipped++;
          } else {
            await client.uploadFrom(path.join(LOCAL_DIR, ...f.rel.split('/')), name);
            uploaded++;
            if (uploaded % 50 === 0) console.log(`  ${uploaded + skipped}/${files.length}...`);
          }
          done.add(f.rel);
        }
        break;
      } catch (error) {
        const message = error instanceof Error ? `${(error as NodeJS.ErrnoException).code ?? ''}${error.message}` : String(error);
        if (attempt >= MAX_ATTEMPTS) {
          dirFiles.filter(f => !done.has(f.rel)).forEach(f => failed.push(`${f.rel}: ${message}`));
          break;
        }
        console.log(`  ${remoteDir}: ${message} — reconnecting (attempt ${attempt + 1}/${MAX_ATTEMPTS})`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
        await connect().catch(() => {});
      }
    }
  }
  client.close();

  console.log(`\nUploaded ${uploaded}, already there ${skipped}, failed ${failed.length}.`);
  failed.forEach(f => console.log('  - ' + f));
  if (failed.length) process.exit(1);
}

main().catch(err => {
  console.error(err instanceof Error ? `${(err as NodeJS.ErrnoException).code ?? ''}${err.message}` : err);
  process.exit(1);
});
