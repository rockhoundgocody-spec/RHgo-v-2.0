import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock base44 client
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

import { base44 } from '@/api/base44Client';

describe('Chronolith Upload Optimization Benchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('measures execution time for sequential vs parallel file upload logic', async () => {
    // Each upload mock takes 50ms delay
    base44.integrations.Core.UploadFile.mockImplementation(async ({ file }) => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { file_url: `https://example.com/${file.name}` };
    });

    const dummyFiles = [
      { name: 'file1.jpg' },
      { name: 'file2.jpg' },
      { name: 'file3.jpg' },
    ];

    // 1. Sequential upload logic (Current implementation)
    const startSequential = performance.now();
    const sequentialUrls = [];
    for (const file of dummyFiles.slice(0, 3)) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      sequentialUrls.push(file_url);
    }
    const durationSequential = performance.now() - startSequential;

    expect(sequentialUrls).toEqual([
      'https://example.com/file1.jpg',
      'https://example.com/file2.jpg',
      'https://example.com/file3.jpg',
    ]);
    expect(durationSequential).toBeGreaterThanOrEqual(140);

    vi.clearAllMocks();

    // 2. Parallel upload logic (Optimized implementation using Promise.all)
    const startParallel = performance.now();
    const parallelUrls = await Promise.all(
      dummyFiles.slice(0, 3).map(async (file) => {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        return file_url;
      })
    );
    const durationParallel = performance.now() - startParallel;

    expect(parallelUrls).toEqual([
      'https://example.com/file1.jpg',
      'https://example.com/file2.jpg',
      'https://example.com/file3.jpg',
    ]);
    // 3 uploads in parallel with 50ms each should take ~50ms total
    expect(durationParallel).toBeLessThan(120);

    console.log(`Sequential Upload Duration: ${durationSequential.toFixed(2)}ms`);
    console.log(`Parallel Upload Duration: ${durationParallel.toFixed(2)}ms`);
    console.log(`Speedup Factor: ${(durationSequential / durationParallel).toFixed(2)}x`);
  });
});
