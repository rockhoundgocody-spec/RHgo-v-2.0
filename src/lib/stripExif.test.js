import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { stripExif, stripJpegMetadata } from './stripExif';

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

// Minimal JPEG: SOI, APP0 (JFIF), APP1 (EXIF w/ fake GPS), COM, DQT, SOS + data, EOI.
const seg = (marker, payload) => [0xff, marker, 0, payload.length + 2, ...payload];
const gps = [...'Exif'].map((c) => c.charCodeAt(0)).concat([0, 0, 0x47, 0x50, 0x53]);
const jpegWithExif = () => new Uint8Array([
  0xff, 0xd8,
  ...seg(0xe0, [0x4a, 0x46, 0x49, 0x46, 0]),
  ...seg(0xe1, gps),
  ...seg(0xfe, [0x68, 0x69]),
  ...seg(0xdb, [0, 1, 2, 3]),
  0xff, 0xda, 0, 4, 9, 9, 0x12, 0x34,
  0xff, 0xd9,
]);
const contains = (bytes, needle) => {
  outer: for (let i = 0; i <= bytes.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) if (bytes[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
};

describe('stripJpegMetadata', () => {
  it('drops EXIF and comment segments and keeps JFIF, tables and image data', () => {
    const out = stripJpegMetadata(jpegWithExif());
    expect(out).not.toBeNull();
    expect(contains(out, gps)).toBe(false);
    expect(contains(out, [0xff, 0xfe])).toBe(false);
    expect(contains(out, [0x4a, 0x46, 0x49, 0x46])).toBe(true);
    expect(contains(out, [0xff, 0xdb, 0, 6, 0, 1, 2, 3])).toBe(true);
    expect(Array.from(out.slice(-10))).toEqual([0xff, 0xda, 0, 4, 9, 9, 0x12, 0x34, 0xff, 0xd9]);
  });

  it('rejects data that is not a well-formed JPEG', () => {
    expect(stripJpegMetadata(new Uint8Array([1, 2, 3, 4]))).toBeNull();
    expect(stripJpegMetadata(new Uint8Array([0xff, 0xd8, 0xff, 0xe1, 0xff, 0xff]))).toBeNull();
  });

  it('stripExif falls back to the byte-level strip when the browser cannot decode a JPEG', async () => {
    globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error('unsupported'));
    const result = await stripExif(new Blob([jpegWithExif()], { type: 'image/jpeg' }));
    const bytes = new Uint8Array(await result.arrayBuffer());
    expect(contains(bytes, gps)).toBe(false);
    expect(Array.from(bytes.slice(0, 2))).toEqual([0xff, 0xd8]);
  });

  it('requireSuccess refuses an undecodable non-JPEG instead of uploading it raw', async () => {
    globalThis.createImageBitmap = vi.fn().mockRejectedValue(new Error('unsupported'));
    await expect(stripExif(new Blob(['heic-bytes'], { type: 'image/heic' }), { requireSuccess: true }))
      .rejects.toThrow('Could not remove photo metadata');
  });
});
