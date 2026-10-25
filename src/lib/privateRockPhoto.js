import { base44 } from '@/api/base44Client';
import { stripExif } from '@/lib/stripExif';

export async function uploadPrivateRockPhoto(file) {
  const clean = await stripExif(file, { requireSuccess: true });
  const photo = new File([clean], 'specimen.jpg', { type: 'image/jpeg' });
  const result = await base44.integrations.Core.UploadPrivateFile({ file: photo });
  if (!result?.file_uri) throw new Error('The private photo upload did not finish. Please try again.');
  return result.file_uri;
}