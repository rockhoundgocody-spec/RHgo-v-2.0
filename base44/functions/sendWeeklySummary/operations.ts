type PageFetcher<T> = (limit: number, skip: number) => Promise<T[]>;

export function chunkValues<T>(values: T[], size: number): T[][] {
  const chunkSize = Math.max(1, Math.floor(size) || 1);
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
}

export async function collectPages<T>(fetchPage: PageFetcher<T>, pageSize = 500): Promise<T[]> {
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

type Specimen = { created_by?: string };
type Companion = { owner_email?: string };

export function groupDigestRecords<T extends Specimen, U extends Companion>(
  specimens: T[],
  companions: U[],
) {
  const specimensByEmail = new Map<string, T[]>();
  const companionByEmail = new Map<string, U>();

  for (const specimen of specimens) {
    if (!specimen.created_by) continue;
    const records = specimensByEmail.get(specimen.created_by) || [];
    records.push(specimen);
    specimensByEmail.set(specimen.created_by, records);
  }

  // The input is sorted newest-first, so retain only the first companion for
  // each owner while preserving the current one-companion email behavior.
  for (const companion of companions) {
    if (companion.owner_email && !companionByEmail.has(companion.owner_email)) {
      companionByEmail.set(companion.owner_email, companion);
    }
  }

  return { specimensByEmail, companionByEmail };
}
