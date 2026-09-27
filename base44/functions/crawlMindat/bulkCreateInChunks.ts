/**
 * Bulk-creates entity records in parallel chunks (default 25 per batch)
 * using Promise.all to avoid sequential N+1 HTTP request waterfalls.
 */
export async function bulkCreateInChunks<T>(
  entities: { bulkCreate: (records: T[]) => Promise<unknown> },
  records: T[],
  chunkSize = 25
): Promise<number> {
  if (!records.length) return 0;
  const chunks: T[][] = [];
  for (let i = 0; i < records.length; i += chunkSize) {
    chunks.push(records.slice(i, i + chunkSize));
  }
  await Promise.all(chunks.map((chunk) => entities.bulkCreate(chunk)));
  return records.length;
}
