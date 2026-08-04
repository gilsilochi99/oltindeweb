// Every form that lets users upload an image (Company logo/gallery/products,
// HealthFacility, Professional photo/portfolio, Itinerary, Place,
// Institution, Contribution, Procedure...) embeds the file as base64 directly
// in the entity's Firestore document, capped by both the Server Action body
// limit (see next.config.ts) and Firestore's own 1MiB-per-document ceiling.
//
// Storing images as inline data URIs means next/image can never optimize
// them — there's no remote URL to resize/re-encode, so every visitor's
// browser downloads the full uploaded file even when it's displayed as a
// 64px thumbnail. compressImageToDataUrl below resizes and re-encodes on the
// client BEFORE upload so what actually gets stored (and later shipped to
// every viewer) is already reasonably small, instead of relying on the user
// to pre-shrink their photo.

// Sanity cap on the RAW file picked from disk, before compression — just
// large enough to reject something absurd (a multi-hundred-MB video picked
// by mistake) without hanging the browser trying to decode it.
const MAX_RAW_UPLOAD_BYTES = 15 * 1024 * 1024;

// Safety cap on the COMPRESSED result. Typical photos land well under this
// after resizing; kept as a backstop for the rare very-busy image that
// doesn't compress well, matched to the Server Action body limit headroom.
export const MAX_IMAGE_UPLOAD_BYTES = 600 * 1024;

export function isImageTooLarge(file: File): boolean {
  return file.size > MAX_RAW_UPLOAD_BYTES;
}

function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  if (width <= max && height <= max) return { width, height };
  const scale = width > height ? max / width : max / height;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

async function encodeAtSize(bitmap: ImageBitmap, maxDimension: number, quality: number): Promise<string> {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxDimension);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL('image/webp', quality);
}

function dataUrlByteLength(dataUrl: string): number {
  // Rough but sufficient: base64 encodes 3 bytes as 4 chars.
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  return Math.ceil((base64.length * 3) / 4);
}

// Resizes to fit within maxDimension and re-encodes as WebP (supports
// transparency, unlike JPEG, so logos with transparent backgrounds still
// look right). Falls back to a smaller pass if the first result is still
// too large — a busy/detailed image at 1200px can occasionally overshoot.
export async function compressImageToDataUrl(file: File, maxDimension = 1200, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    let result = await encodeAtSize(bitmap, maxDimension, quality);
    if (dataUrlByteLength(result) > MAX_IMAGE_UPLOAD_BYTES) {
      result = await encodeAtSize(bitmap, Math.round(maxDimension * 0.6), quality);
    }
    if (dataUrlByteLength(result) > MAX_IMAGE_UPLOAD_BYTES) {
      result = await encodeAtSize(bitmap, Math.round(maxDimension * 0.6), quality * 0.75);
    }
    return result;
  } finally {
    bitmap.close();
  }
}
