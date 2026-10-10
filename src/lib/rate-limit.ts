// Small in-memory sliding-window limiter for the API routes (per server
// process — enough to stop a script hammering one endpoint, not a substitute
// for Cloudflare's protection).
const hits = new Map<string, number[]>();
let lastSweep = Date.now();

// true = allowed; false = over `limit` requests in the last `windowMs`.
export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, times] of hits) if (!times.length || now - times[times.length - 1] > 3_600_000) hits.delete(k);
  }
  const recent = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

// The visitor's IP behind Cloudflare / the hosting proxy.
export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
}
