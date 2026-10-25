export const MAX_CHRONOLITH_FILES = 3;
export const MAX_CHRONOLITH_FILE_BYTES = 10 * 1024 * 1024;

function validateImage(file) {
  if (file.type && !file.type.startsWith('image/')) {
    throw new Error(`${file.name || 'Selected file'} is not an image`);
  }
  if (file.size > MAX_CHRONOLITH_FILE_BYTES) {
    throw new Error(`${file.name || 'Selected image'} exceeds the 10 MB upload limit`);
  }
}

export async function uploadChronolithImages(fileList, uploadFile) {
  const files = Array.from(fileList).slice(0, MAX_CHRONOLITH_FILES);
  files.forEach(validateImage);

  return Promise.all(files.map(async (file) => {
    const result = await uploadFile({ file });
    if (!result?.file_url) throw new Error(`Upload failed for ${file.name || 'an image'}`);
    return result.file_url;
  }));
}
