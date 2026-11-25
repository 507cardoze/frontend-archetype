import { env } from '@/lib/env';

import { ProblemError, type RequestKind } from './problem';

type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

/**
 * Minimal fetch for the BFF: same origin, the BFF's session cookie, JSON in and out.
 * Any failure becomes a ProblemError (RFC 7807). Only `src/api/*` calls it.
 */
export const http = async <T>(path: string, { body, method = 'GET', signal }: HttpOptions = {}) => {
  const kind: RequestKind = method === 'GET' ? 'query' : 'command';

  let response: Response;
  try {
    response = await fetch(new URL(`${env.VITE_API_BASE_URL}${path}`, window.location.origin), {
      body: body === undefined ? null : JSON.stringify(body),
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      method,
      signal: signal ?? null,
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    // No response: the BFF may or may not have received it (status 0).
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

  return (response.status === 204 ? undefined : await response.json()) as T;
};
