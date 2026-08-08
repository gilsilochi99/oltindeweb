// Forms that let users upload an image (Company logo/gallery/products,
// HealthFacility, Professional photo/portfolio, Itinerary, Place,
// Institution, Contribution...) upload to Firebase Storage and save the
// resulting download URL on the entity's Firestore document (see
// src/hooks/use-storage.tsx) rather than embedding the file as base64.
//
// compressImageToBlob below resizes and re-encodes on the client BEFORE
// upload, so what actually gets stored (and later shipped to every viewer
// via next/image) is already reasonably small, instead of relying on the
// user to pre-shrink their photo or on next/image to have a full-size
// remote original to resize on demand.

// Sanity cap on the RAW file picked from disk, before compression — just
// large enough to reject something absurd (a multi-hundred-MB video picked
// by mistake) without hanging the browser trying to decode it.
const MAX_RAW_UPLOAD_BYTES = 15 * 1024 * 1024;

// Safety cap on the COMPRESSED result. Typical photos land well under this
// after resizing; kept as a backstop for the rare very-busy image that
// doesn't compress well.
export const MAX_IMAGE_UPLOAD_BYTES = 600 * 1024;

export function isImageTooLarge(file: File): boolean {
  return file.size > MAX_RAW_UPLOAD_BYTES;
}

function fitWithin(width: number, height: number, max: number): { width: number; height: number } {
  if (width <= max && height <= max) return { width, height };
  const scale = width > height ? max / width : max / height;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function renderAtSize(bitmap: ImageBitmap, maxDimension: number): HTMLCanvasElement {
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxDimension);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo procesar la imagen.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('No se pudo procesar la imagen.'));
    }, 'image/webp', quality);
  });
}

async function encodeBlobAtSize(bitmap: ImageBitmap, maxDimension: number, quality: number): Promise<Blob> {
  return canvasToBlob(renderAtSize(bitmap, maxDimension), quality);
}

// Resizes to fit within maxDimension and re-encodes as WebP (supports
// transparency, unlike JPEG, so logos with transparent backgrounds still
// look right), producing a Blob for direct upload to Firebase Storage.
// Falls back to a smaller pass if the first result is still too large — a
// busy/detailed image at 1200px can occasionally overshoot.
export async function compressImageToBlob(file: File, maxDimension = 1200, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    let result = await encodeBlobAtSize(bitmap, maxDimension, quality);
    if (result.size > MAX_IMAGE_UPLOAD_BYTES) {
      result = await encodeBlobAtSize(bitmap, Math.round(maxDimension * 0.6), quality);
    }
    if (result.size > MAX_IMAGE_UPLOAD_BYTES) {
      result = await encodeBlobAtSize(bitmap, Math.round(maxDimension * 0.6), quality * 0.75);
    }
    return result;
  } finally {
    bitmap.close();
  }
}
