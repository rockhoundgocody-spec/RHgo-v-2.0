export interface Candidate {
  name: string;
  url: string;
}

export interface CandidateError {
  name: string;
  reason: string;
}

export interface MineralDetail {
  name: string;
  formula: string;
  crystal_system: string;
  hardness: string;
  color: string;
  luster: string;
  streak: string;
  description: string;
  rarity: string;
  category: string;
  image_url: string;
}

export interface ParallelFetchResult {
  created: MineralDetail[];
  errors: CandidateError[];
}

/**
 * Fetches and parses candidate minerals in parallel using Promise.all.
 */
export async function fetchCandidatesInParallel(
  base44: unknown,
  candidates: Candidate[],
  existingNames: Set<string>,
  fetchAndParseFn: (base44: unknown, candidate: Candidate) => Promise<MineralDetail | null>
): Promise<ParallelFetchResult> {
  const created: MineralDetail[] = [];
  const errors: CandidateError[] = [];

  const toFetch = candidates.filter(c => !existingNames.has(c.name.toLowerCase()));

  const results = await Promise.all(
    toFetch.map(async (c) => {
      try {
        const detail = await fetchAndParseFn(base44, c);
        if (!detail) {
          return { type: 'error' as const, error: { name: c.name, reason: 'parse_failed' } };
        }
        return { type: 'success' as const, detail };
      } catch (e: unknown) {
        const err = e as { message?: string };
        return { type: 'error' as const, error: { name: c.name, reason: String(err?.message || e) } };
      }
    })
  );

  for (const res of results) {
    if (res.type === 'success') {
      created.push(res.detail);
    } else {
      errors.push(res.error);
    }
  }

  return { created, errors };
}
