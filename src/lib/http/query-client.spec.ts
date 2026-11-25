import { describe, expect, it, vi } from 'vitest';

import { ProblemError } from './problem';
import { createQueryClient } from './query-client';

const fail = (status: number) => () => Promise.reject(new ProblemError({ kind: 'query', status }));

describe('createQueryClient', () => {
  it('sends the user to the BFF login on a 401', async () => {
    const onUnauthorized = vi.fn();
    const client = createQueryClient({ onUnauthorized });

    await expect(client.fetchQuery({ queryFn: fail(401), queryKey: ['a'] })).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('does not redirect on other errors', async () => {
    const onUnauthorized = vi.fn();
    const client = createQueryClient({ onUnauthorized });

    await expect(client.fetchQuery({ queryFn: fail(403), queryKey: ['b'] })).rejects.toThrow();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
