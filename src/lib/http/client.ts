import { env } from '@/lib/env';

import { ProblemError, type RequestKind } from './problem';

type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** A BFF that never answers must not leave a spinner forever. */
  timeoutMs?: number;
};

/**
 * Minimal fetch for the BFF: same origin, the BFF's session cookie, JSON in and out.
 * Any failure becomes a ProblemError (RFC 9457 problem details). Only `src/api/*` calls it.
 */
export const http = async <T>(
  path: string,
  { body, method = 'GET', signal, timeoutMs = 15_000 }: HttpOptions = {},
) => {
  const kind: RequestKind = method === 'GET' ? 'query' : 'command';

  let response: Response;
  try {
    response = await fetch(new URL(`${env.VITE_API_BASE_URL}${path}`, window.location.origin), {
      body: body === undefined ? null : JSON.stringify(body),
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      method,
      signal: AbortSignal.any([AbortSignal.timeout(timeoutMs), ...(signal ? [signal] : [])]),
    });
  } catch (cause) {
    if (signal?.aborted) throw cause; // cancelled by the caller (TanStack Query), not a failure
    // No response or timeout: the BFF may or may not have received it (status 0).
    throw new ProblemError({ kind, status: 0, title: 'Network error' });
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as {
      title?: string;
      detail?: string;
    };
    throw new ProblemError({
      detail: problem.detail,
      kind,
      status: response.status,
      title: problem.title,
    });
  }

  if (response.status === 204) return undefined as T;
  try {
    return (await response.json()) as T;
  } catch {
    // A 2xx that is not JSON (e.g. a proxy's HTML page) is a bad gateway, not a crash.
    throw new ProblemError({ kind, status: 502, title: 'Invalid response' });
  }
};
