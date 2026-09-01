/**
 * Efficiently aggregates specimen counts by mineral name.
 */
export function aggregateSpecimenCollection(
  specimens: Array<{ mineral_name?: string | null }>
): Record<string, number> {
  const collection: Record<string, number> = {};
  for (let i = 0; i < specimens.length; i++) {
    const name = specimens[i].mineral_name?.trim();
    if (name) {
      collection[name] = (collection[name] || 0) + 1;
    }
  }
  return collection;
}
