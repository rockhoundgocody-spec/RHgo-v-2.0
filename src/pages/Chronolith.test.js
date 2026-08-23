import { vi, describe, it, expect, beforeAll } from 'vitest';

// Top-level mock
vi.mock('@/api/base44Client', () => ({
  base44: {
    integrations: {
      Core: {
        UploadFile: vi.fn(),
      },
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

let uploadSelectedFiles;

beforeAll(async () => {
  globalThis.window = {
    self: {},
    top: {},
    location: {
      search: '',
      href: 'http://localhost:3000',
      pathname: '/',
    },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    },
    navigator: {
      geolocation: undefined,
    },
  };
  globalThis.window.self = globalThis.window;
  globalThis.window.top = globalThis.window;

  const mod = await import('./Chronolith.jsx');
  uploadSelectedFiles = mod.uploadSelectedFiles;
});

describe('uploadSelectedFiles performance & functionality', () => {
  it('uploads up to 3 files in parallel and extracts file_urls', async () => {
    const mockFiles = [{ name: 'img1.png' }, { name: 'img2.png' }, { name: 'img3.png' }, { name: 'img4.png' }];
    const uploadFn = vi.fn().mockImplementation(async (file) => ({
      file_url: `https://example.com/uploads/${file.name}`,
    }));

    const urls = await uploadSelectedFiles(mockFiles, uploadFn);

    expect(uploadFn).toHaveBeenCalledTimes(3);
    expect(urls).toEqual([
      'https://example.com/uploads/img1.png',
      'https://example.com/uploads/img2.png',
      'https://example.com/uploads/img3.png',
    ]);
  });

  it('handles empty file list gracefully', async () => {
    const uploadFn = vi.fn();
    const urls = await uploadSelectedFiles([], uploadFn);
    expect(urls).toEqual([]);
    expect(uploadFn).not.toHaveBeenCalled();
  });

  it('demonstrates parallel upload execution speedup over sequential upload', async () => {
    const mockFiles = [{ name: 'img1.png' }, { name: 'img2.png' }, { name: 'img3.png' }];
    const delay = 50; // ms

    const simulatedUpload = async (file) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return { file_url: `https://example.com/${file.name}` };
    };

    // Parallel measurement
    const startParallel = performance.now();
    await uploadSelectedFiles(mockFiles, simulatedUpload);
    const parallelDuration = performance.now() - startParallel;

    // Sequential measurement simulation
    const startSequential = performance.now();
    for (const file of mockFiles) {
      await simulatedUpload(file);
    }
    const sequentialDuration = performance.now() - startSequential;

    // Parallel duration should be roughly equal to single delay (~50ms)
    // Sequential duration should be roughly equal to 3 * delay (~150ms)
    expect(parallelDuration).toBeLessThan(sequentialDuration * 0.7);
  });
});
