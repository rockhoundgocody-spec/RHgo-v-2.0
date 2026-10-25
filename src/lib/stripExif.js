/**
 * Re-encode an image through a canvas so ALL EXIF metadata — including the
 * GPS tag the camera embeds — is dropped before the file ever leaves the
 * device. Without this, a specimen photo carries exact find coordinates even
 * when the user chose "private" or "approximate" location sharing.
 *
 * If the browser cannot decode the image, JPEGs still have their metadata
 * segments cut out byte-for-byte (stripJpegMetadata), so a gallery photo the
 * canvas can't handle doesn't upload its GPS. Only an undecodable non-JPEG
 * falls back to the original — and with requireSuccess (public or shared
 * uploads) that throws instead.
 */
export async function stripExif(blob, { maxDimension = 2048, quality = 0.92, requireSuccess = false } = {}) {
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
    if (clean) return clean;
  } catch {
    // fall through to the byte-level path
  }

  try {
    const stripped = stripJpegMetadata(await readBytes(blob));
    if (stripped) return new Blob([stripped], { type: 'image/jpeg' });
  } catch {
    // not readable — handled below
  }

  if (requireSuccess) throw new Error('Could not remove photo metadata. Choose a JPEG or PNG photo.');
  return blob;
}

async function readBytes(blob) {
  if (typeof blob?.arrayBuffer === 'function') return new Uint8Array(await blob.arrayBuffer());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

/**
 * Remove every APP1–APP15 segment (EXIF, XMP, MPF with its embedded
 * thumbnails, maker notes…) and comments from a JPEG without decoding it.
 * APP0 (JFIF) and all image data are kept untouched. Returns null when the
 * bytes are not a well-formed JPEG header.
 */
export function stripJpegMetadata(bytes) {
  if (!bytes || bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const parts = [bytes.subarray(0, 2)];
  let i = 2;
  while (i + 1 < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    if (marker === 0xff) { i += 1; continue; } // fill byte
    if (marker === 0xda || marker === 0xd9) {
      // Start of scan / end of image: the rest is image data.
      parts.push(bytes.subarray(i));
      return concat(parts);
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      parts.push(bytes.subarray(i, i + 2));
      i += 2;
      continue;
    }
    if (i + 4 > bytes.length) return null;
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    if (length < 2 || i + 2 + length > bytes.length) return null;
    const isMetadata = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadata) parts.push(bytes.subarray(i, i + 2 + length));
    i += 2 + length;
  }
  return null;
}

function concat(parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
}
