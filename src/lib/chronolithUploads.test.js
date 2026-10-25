import { describe, expect, it, vi } from 'vitest';
import {
  MAX_CHRONOLITH_FILE_BYTES,
  uploadChronolithImages,
} from './chronolithUploads.js';

const image = (name, overrides = {}) => ({
  name,
  type: 'image/jpeg',
  size: 1024,
  ...overrides,
});

describe('uploadChronolithImages', () => {
  it('uploads at most three images concurrently while preserving selection order', async () => {
    let active = 0;
    let peak = 0;
    const upload = vi.fn(async ({ file }) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
      return { file_url: `https://images.test/${file.name}` };
    });

    const urls = await uploadChronolithImages(
      [image('one.jpg'), image('two.jpg'), image('three.jpg'), image('ignored.jpg')],
      upload,
    );

    expect(peak).toBe(3);
    expect(upload).toHaveBeenCalledTimes(3);
    expect(urls).toEqual([
      'https://images.test/one.jpg',
      'https://images.test/two.jpg',
      'https://images.test/three.jpg',
    ]);
  });

  it('rejects non-images before starting any network work', async () => {
    const upload = vi.fn();

    await expect(uploadChronolithImages([
      image('notes.txt', { type: 'text/plain' }),
    ], upload)).rejects.toThrow('is not an image');
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects images larger than 10 MB before upload', async () => {
    const upload = vi.fn();

    await expect(uploadChronolithImages([
      image('huge.jpg', { size: MAX_CHRONOLITH_FILE_BYTES + 1 }),
    ], upload)).rejects.toThrow('exceeds the 10 MB upload limit');
    expect(upload).not.toHaveBeenCalled();
  });

  it('rejects a backend response that omits the uploaded URL', async () => {
    await expect(uploadChronolithImages(
      [image('quartz.jpg')],
      vi.fn().mockResolvedValue({}),
    )).rejects.toThrow('Upload failed for quartz.jpg');
  });
});
