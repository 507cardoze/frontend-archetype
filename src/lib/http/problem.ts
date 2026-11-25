/**
 * Errors from the BFF (RFC 9457 problem details or any non-2xx), classified so the UI decides what
 * to show from `errorClass`, never from raw status codes.
 */
export type ErrorClass =
  | 'unauthenticated'
  | 'forbidden'
  | 'not-found'
  | 'request'
  | 'conflict'
  | 'business'
  | 'temporary'
  | 'availability'
  | 'uncertain';

/** `query` reads (GET); `command` changes something (POST, PUT, PATCH, DELETE). */
export type RequestKind = 'query' | 'command';

export const classify = (status: number, kind: RequestKind): ErrorClass => {
  if (status === 401) return 'unauthenticated';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not-found';
  if (status === 409) return 'conflict';
  if (status === 422) return 'business';
  if (status === 423 || status === 429) return 'temporary';
  if (status === 503) return 'availability';
  // A 5xx or no response at all (status 0, network failure) on a command may have been applied:
  // never auto-retry it.
  if (status === 0 || status >= 500) return kind === 'command' ? 'uncertain' : 'availability';
  return 'request';
};

const RETRYABLE: ReadonlySet<ErrorClass> = new Set(['availability', 'temporary']);

export class ProblemError extends Error {
  readonly status: number;
  readonly errorClass: ErrorClass;
  readonly detail: string | undefined;

  constructor(init: {
    status: number;
    kind: RequestKind;
    title?: string | undefined;
    detail?: string | undefined;
  }) {
    super(init.title ?? `HTTP ${init.status}`);
    this.name = 'ProblemError';
    this.status = init.status;
    this.errorClass = classify(init.status, init.kind);
    this.detail = init.detail;
  }
}

/** Transient failures only: retrying them cannot apply anything twice. */
export const isRetryable = (error: unknown) =>
  error instanceof ProblemError && RETRYABLE.has(error.errorClass);

export const isConflict = (error: unknown) =>
  error instanceof ProblemError && error.errorClass === 'conflict';
