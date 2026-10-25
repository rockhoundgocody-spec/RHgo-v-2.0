import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stripExif } from './stripExif';

describe('stripExif', () => {
  let originalCreateImageBitmap;
  let originalDocument;

  beforeEach(() => {
    originalCreateImageBitmap = globalThis.createImageBitmap;
    originalDocument = globalThis.document;
  });

  afterEach(() => {
    globalThis.createImageBitmap = originalCreateImageBitmap;
    globalThis.document = originalDocument;
    vi.restoreAllMocks();
  });

  it('re-encodes image and strips EXIF metadata on happy path', async () => {
    const inputBlob = new Blob(['mock-image-data'], { type: 'image/jpeg' });
    const cleanBlob = new Blob(['clean-image-data'], { type: 'image/jpeg' });

    const mockBitmap = {
      width: 1000,
      height: 800,
      close: vi.fn(),
    };

    const mockContext = {
      drawImage: vi.fn(),
    };

    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
      toBlob: vi.fn((callback) => callback(cleanBlob)),
    };

    globalThis.createImageBitmap = vi.fn().mockResolvedValue(mockBitmap);
    globalThis.document = {
      createElement: vi.fn().mockReturnValue(mockCanvas),
    };

    const result = await stripExif(inputBlob);

    expect(globalThis.createImageBitmap).toHaveBeenCalledWith(inputBlob);
    expect(mockCanvas.width).toBe(1000);
    expect(mockCanvas.height).toBe(800);
    expect(mockContext.drawImage).toHaveBeenCalledWith(mockBitmap, 0, 0, 1000, 800);
    expect(mockBitmap.close).toHaveBeenCalled();
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.92);
    expect(result).toBe(cleanBlob);
  });

  it('correctly downscales images exceeding maxDimension and uses custom quality', async () => {
    const inputBlob = new Blob(['large-image-data'], { type: 'image/jpeg' });
    const cleanBlob = new Blob(['scaled-image-data'], { type: 'image/jpeg' });

    const mockBitmap = {
      width: 4000,
      height: 2000,
      close: vi.fn(),
    };

    const mockContext = { drawImage: vi.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
      toBlob: vi.fn((callback) => callback(cleanBlob)),
    };

    globalThis.createImageBitmap = vi.fn().mockResolvedValue(mockBitmap);
    globalThis.document = { createElement: vi.fn().mockReturnValue(mockCanvas) };

    const result = await stripExif(inputBlob, { maxDimension: 2000, quality: 0.8 });

    // scale = min(1, 2000 / 4000) = 0.5
    // width = round(4000 * 0.5) = 2000
    // height = round(2000 * 0.5) = 1000
    expect(mockCanvas.width).toBe(2000);
    expect(mockCanvas.height).toBe(1000);
    expect(mockCanvas.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.8);
    expect(result).toBe(cleanBlob);
  });

  it('falls back to original blob when decoding fails (e.g. invalid or corrupt image data)', async () => {
    const corruptBlob = new Blob(['invalid-data'], { type: 'image/jpeg' });

    globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error('Invalid image header / EXIF decode error'));

    const result = await stripExif(corruptBlob);

    expect(result).toBe(corruptBlob);
  });

  it('falls back to original blob when canvas.toBlob returns null', async () => {
    const inputBlob = new Blob(['image-data'], { type: 'image/jpeg' });

    const mockBitmap = {
      width: 500,
      height: 500,
      close: vi.fn(),
    };

    const mockContext = { drawImage: vi.fn() };
    const mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn().mockReturnValue(mockContext),
      toBlob: vi.fn((callback) => callback(null)),
    };

    globalThis.createImageBitmap = vi.fn().mockResolvedValue(mockBitmap);
    globalThis.document = { createElement: vi.fn().mockReturnValue(mockCanvas) };

    const result = await stripExif(inputBlob);

    expect(result).toBe(inputBlob);
  });

  it('falls back to original blob when canvas context or drawing throws an exception', async () => {
    const inputBlob = new Blob(['image-data'], { type: 'image/jpeg' });

    const mockBitmap = { width: 500, height: 500, close: vi.fn() };

    globalThis.createImageBitmap = vi.fn().mockResolvedValue(mockBitmap);
    globalThis.document = {
      createElement: vi.fn().mockImplementation(() => {
        throw new Error('Canvas element creation failed');
      }),
    };

    const result = await stripExif(inputBlob);

    expect(result).toBe(inputBlob);
  });
});
