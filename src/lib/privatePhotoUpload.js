import { base44 } from '@/api/base44Client';
import { stripExif } from '@/lib/stripExif';

export default async function privatePhotoUpload(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Choose a supported image file.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose a photo smaller than 15 MB.');
  const clean = await stripExif(file, { strict: true });
  const upload = new File([clean], 'private-find.jpg', { type: 'image/jpeg' });
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: upload });
  if (!file_uri) throw new Error('The private upload did not complete. Please retry.');
  return { file_uri, previewUrl: URL.createObjectURL(clean) };
}