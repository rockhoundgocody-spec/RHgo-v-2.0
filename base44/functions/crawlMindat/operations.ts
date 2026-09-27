export function chunkArray<T>(items: T[], size = 25): T[][] {
  const chunkSize = Math.max(1, Math.floor(size) || 1);
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export async function bulkCreateInParallel<T>(
  items: T[],
  bulkCreateFn: (chunk: T[]) => Promise<unknown>,
  chunkSize = 25,
): Promise<number> {
  if (!items || items.length === 0) return 0;
  const chunks = chunkArray(items, chunkSize);
  const outcomes = await Promise.allSettled(
    chunks.map(async (chunk) => {
      await bulkCreateFn(chunk);
      return chunk.length;
    }),
  );

  let written = 0;
  for (const result of outcomes) {
    if (result.status === 'fulfilled') {
      written += result.value;
    }
  }
  return written;
}
