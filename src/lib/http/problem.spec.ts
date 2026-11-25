import { describe, expect, it } from 'vitest';

import { classify, isRetryable, ProblemError } from './problem';

describe('classify', () => {
  it.each([
    [401, 'query', 'unauthenticated'],
    [403, 'command', 'forbidden'],
    [404, 'query', 'not-found'],
    [400, 'command', 'request'],
    [409, 'command', 'conflict'],
    [422, 'command', 'business'],
    [429, 'query', 'temporary'],
    [503, 'command', 'availability'],
    [500, 'query', 'availability'],
    [502, 'command', 'uncertain'],
    [0, 'query', 'availability'],
    [0, 'command', 'uncertain'],
  ] as const)('%i on a %s is %s', (status, kind, expected) => {
    expect(classify(status, kind)).toBe(expected);
  });
});

describe('isRetryable', () => {
  it('only retries availability and temporary errors', () => {
    const make = (status: number) => new ProblemError({ kind: 'command', status });

    expect(isRetryable(make(503))).toBe(true);
    expect(isRetryable(make(429))).toBe(true);
    expect(isRetryable(make(500))).toBe(false);
    expect(isRetryable(make(409))).toBe(false);
    expect(isRetryable(new Error('boom'))).toBe(false);
  });
});
