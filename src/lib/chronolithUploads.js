import { stripExif } from '@/lib/stripExif';

export const MAX_CHRONOLITH_FILES = 3;

// Investigation photos are stored server-side; never ship the camera's GPS with them.
const defaultClean = (file) => stripExif(file, { requireSuccess: true });
export const MAX_CHRONOLITH_FILE_BYTES = 10 * 1024 * 1024;

function validateImage(file) {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error(`${file.name || 'Selected file'} is not an image`);
  }
  if (file.size > MAX_CHRONOLITH_FILE_BYTES) {
    throw new Error(`${file.name || 'Selected image'} exceeds the 10 MB upload limit`);
  }
}

export async function uploadChronolithImages(fileList, uploadFile, clean = defaultClean) {
  const files = Array.from(fileList).slice(0, MAX_CHRONOLITH_FILES);
  files.forEach(validateImage);

  return Promise.all(files.map(async (original) => {
    const cleaned = await clean(original);
    const file = cleaned === original
      ? original
      : new File([cleaned], original.name || 'image.jpg', { type: 'image/jpeg' });
    const result = await uploadFile({ file });
    if (!result?.file_url) throw new Error(`Upload failed for ${original.name || 'an image'}`);
    return result.file_url;
  }));
}
