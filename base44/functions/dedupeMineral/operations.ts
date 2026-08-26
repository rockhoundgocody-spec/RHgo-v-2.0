type MineralReference = { id: string };
type DeleteResult = { deleted: number; failed: number };

export async function deleteMineralsInBatches(
  minerals: MineralReference[],
  deleteById: (id: string) => Promise<unknown>,
  concurrency = 5,
): Promise<DeleteResult> {
  const batchSize = Math.max(1, Math.min(20, Math.floor(concurrency) || 1));
  let deleted = 0;
  let failed = 0;

  for (let index = 0; index < minerals.length; index += batchSize) {
    const outcomes = await Promise.all(
      minerals.slice(index, index + batchSize).map(async ({ id }) => {
        try {
          await deleteById(id);
          return true;
        } catch {
          return false;
        }
      }),
    );

    deleted += outcomes.filter(Boolean).length;
    failed += outcomes.filter((succeeded) => !succeeded).length;
  }

  return { deleted, failed };
}
