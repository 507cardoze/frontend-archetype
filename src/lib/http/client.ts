import { env } from '@/lib/env';

import { ProblemError, type RequestKind } from './problem';

type HttpOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

const CORRELATION_HEADER = 'X-Correlation-Id';

/**
 * The only door to the BFF (adapter layer). The BFF owns the session (HttpOnly cookie, same
 * origin), so there is no token handling here by design. Only `src/api/*` calls this.
 */
export const http = async <T>(path: string, { body, method = 'GET', signal }: HttpOptions = {}) => {
  const kind: RequestKind = method === 'GET' ? 'query' : 'command';
  const sentId = crypto.randomUUID();

  let response: Response;
  try {
    response = await fetch(new URL(`${env.VITE_API_BASE_URL}${path}`, window.location.origin), {
      body: body === undefined ? null : JSON.stringify(body),
      credentials: 'same-origin',
      headers: {
        Accept: 'application/json, application/problem+json',
        [CORRELATION_HEADER]: sentId,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      method,
      signal: signal ?? null,
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    // Network failure: the request may or may not have reached the BFF. Status 0 = no response.
    throw new ProblemError({ correlationId: sentId, kind, status: 0, title: 'Network error' });
  }

  const correlationId = response.headers.get(CORRELATION_HEADER) ?? sentId;

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as {
      title?: string;
      detail?: string;
    };
    throw new ProblemError({
      correlationId,
      detail: problem.detail,
      kind,
      status: response.status,
      title: problem.title,
    });
  }

  return (response.status === 204 ? undefined : await response.json()) as T;
};
