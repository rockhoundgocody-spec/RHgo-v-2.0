/**
 * Re-encode an image through a canvas so ALL EXIF metadata — including the
 * GPS tag the camera embeds — is dropped before the file ever leaves the
 * device. Without this, a specimen photo carries exact find coordinates even
 * when the user chose "private" or "approximate" location sharing.
 *
 * Falls back to the original blob if decoding fails, so a scan can never be
 * blocked by this step.
 */
export async function stripExif(blob, { maxDimension = 2048, quality = 0.92 } = {}) {
  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    const clean = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    return clean || blob;
  } catch {
    return blob;
  }
}