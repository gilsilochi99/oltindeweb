// Most `image` fields in this dataset were bulk-seeded with random filler
// photos (Lorem Picsum) or plain generated placeholders (placehold.co) —
// they render fine as *images* but are actively misleading as a hero photo,
// since they have nothing to do with the business/institution/etc. they're
// attached to. Detail screens use this to fall back to a cleaner, honest
// "no photo" treatment instead of confidently showing a random stock photo.
const PLACEHOLDER_HOSTS = ['picsum.photos', 'placehold.co'];

export function isPlaceholderImage(url?: string | null): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return PLACEHOLDER_HOSTS.includes(host);
  } catch {
    return false;
  }
}

export function realImageOrUndefined(url?: string | null): string | undefined {
  return url && !isPlaceholderImage(url) ? url : undefined;
}
