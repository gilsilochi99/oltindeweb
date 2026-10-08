// After a deploy, a page opened before it can ask for JS files the new build
// no longer has. Reloading once fetches the current page and fixes it.

const RELOAD_KEY = 'oltinde:stale-build-reload';

export function isStaleBuildError(error: unknown): boolean {
  const e = error as { name?: string; message?: string } | null;
  const text = `${e?.name ?? ''} ${e?.message ?? ''}`;
  return /ChunkLoadError|Loading (CSS )?chunk|dynamically imported module|reading 'call'|Failed to find Server Action/i.test(text);
}

// Reloads at most once a minute, so a real bug can't cause a reload loop.
export function reloadOnceForStaleBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < 60_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}
