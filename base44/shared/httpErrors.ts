/**
 * Error responses for edge functions.
 *
 * The text of a thrown error can carry provider, database and SDK internals: host names, entity
 * names, query fragments. That belongs in the server log, never in a response body. `safeError`
 * logs the full error under a short reference and answers with a generic message plus that
 * reference, so a user can quote it and we can find the log line.
 *
 * Intentional, caller-safe messages (validation failures, 401/403/404/429) are not exceptions:
 * keep returning those directly with `Response.json({ error: '...' }, { status })`.
 *
 * `base44/errorLeakGuard_test.ts` fails the build if any backend file reads an exception's text
 * (its `message` or `stack`). To log an error, pass the object itself: `console.error('what failed', err)`.
 */

export const GENERIC_ERROR = 'Something went wrong. Please try again.';

/** Log `err` server-side and return a short reference to it (safe to show to a caller). */
export function logError(context: string, err: unknown): string {
  const ref = crypto.randomUUID().slice(0, 8);
  console.error(`[${context}] ${ref}`, err);
  return ref;
}

export interface SafeErrorOptions {
  /** HTTP status; 500 by default. */
  status?: number;
  /** Fields that keep the response shape clients already expect (for example `rows: []`). */
  extra?: Record<string, unknown>;
}

/** A generic error response: `{ error, request_id }`. The error itself is only logged. */
export function safeError(
  context: string,
  err: unknown,
  options: SafeErrorOptions = {},
): Response {
  const requestId = logError(context, err);
  // `extra` goes first so it can never replace the generic text or the reference.
  return Response.json(
    { ...options.extra, error: GENERIC_ERROR, request_id: requestId },
    { status: options.status ?? 500 },
  );
}
