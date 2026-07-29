// Every form that lets users upload an image (Company logo/gallery/products,
// HealthFacility, Professional photo/portfolio, Itinerary, Place,
// Institution, Contribution, Procedure...) embeds the file as base64 directly
// in the entity's Firestore document, capped by both the Server Action body
// limit (see next.config.ts) and Firestore's own 1MiB-per-document ceiling.
// A single oversized upload used to fail silently at save time with an
// opaque crash — this cap rejects it immediately, at the point of upload.
export const MAX_IMAGE_UPLOAD_BYTES = 600 * 1024;

export function isImageTooLarge(file: File): boolean {
  return file.size > MAX_IMAGE_UPLOAD_BYTES;
}
