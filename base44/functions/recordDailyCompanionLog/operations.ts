type FetchPage<T> = (limit: number, skip: number) => Promise<T[]>;
type OwnerRecord = Record<string, unknown>;
type LogWrite = { id?: string; payload: OwnerRecord };

export function chunkValues<T>(values: T[], size: number): T[][] {
  const chunkSize = Math.max(1, Math.floor(size) || 1);
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

export async function collectPages<T>(fetchPage: FetchPage<T>, pageSize = 500): Promise<T[]> {
  const size = Math.max(1, Math.min(1000, Math.floor(pageSize) || 1));
  const records: T[] = [];
  let skip = 0;
  while (true) {
    const page = await fetchPage(size, skip);
    records.push(...page);
    if (page.length < size) return records;
    skip += size;
  }
}

export function firstByOwner<T extends OwnerRecord>(records: T[], key: string): Map<string, T> {
  const grouped = new Map<string, T>();
  for (const record of records) {
    const owner = record[key];
    if (typeof owner === 'string' && owner && !grouped.has(owner)) grouped.set(owner, record);
  }
  return grouped;
}

export function countByOwner(records: OwnerRecord[], key: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const record of records) {
    const owner = record[key];
    if (typeof owner === 'string' && owner) counts.set(owner, (counts.get(owner) || 0) + 1);
  }
  return counts;
}

export async function writeLogsInBatches(
  writes: LogWrite[],
  update: (id: string, payload: OwnerRecord) => Promise<unknown>,
  create: (payload: OwnerRecord) => Promise<unknown>,
  concurrency = 5,
) {
  const size = Math.max(1, Math.min(20, Math.floor(concurrency) || 1));
  let written = 0;
  let failed = 0;

  for (let index = 0; index < writes.length; index += size) {
    const outcomes = await Promise.all(writes.slice(index, index + size).map(async ({ id, payload }) => {
      try {
        if (id) await update(id, payload);
        else await create(payload);
        return true;
      } catch {
        return false;
      }
    }));
    written += outcomes.filter(Boolean).length;
    failed += outcomes.filter((result) => !result).length;
  }

  return { written, failed };
}
