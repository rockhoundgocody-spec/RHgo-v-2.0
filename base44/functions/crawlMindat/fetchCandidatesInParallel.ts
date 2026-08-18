export interface Candidate {
  name: string;
  url: string;
}

export interface CandidateError {
  name: string;
  reason: string;
}

export interface ParallelFetchResult {
  created: any[];
  errors: CandidateError[];
}

/**
 * Fetches and parses candidate minerals in parallel using Promise.all.
 */
export async function fetchCandidatesInParallel(
  base44: any,
  candidates: Candidate[],
  existingNames: Set<string>,
  fetchAndParseFn: (base44: any, candidate: Candidate) => Promise<any>
): Promise<ParallelFetchResult> {
  const created: any[] = [];
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
      } catch (e: any) {
        return { type: 'error' as const, error: { name: c.name, reason: String(e?.message || e) } };
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
