import { describe, expect, it, vi } from 'vitest';

import { setTelemetrySink } from '@/lib/telemetry';

import { ProblemError } from './problem';
import { createQueryClient } from './query-client';

const fail = (status: number) => () =>
  Promise.reject(new ProblemError({ correlationId: 'c-1', kind: 'query', status }));

describe('createQueryClient', () => {
  it('sends the user to the BFF login on a 401', async () => {
    const onUnauthorized = vi.fn();
    const client = createQueryClient({ onUnauthorized });

    await expect(client.fetchQuery({ queryFn: fail(401), queryKey: ['a'] })).rejects.toThrow();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('reports every failure once, with its correlation id', async () => {
    const sink = vi.fn();
    setTelemetrySink(sink);
    const client = createQueryClient({ onUnauthorized: vi.fn() });

    await expect(client.fetchQuery({ queryFn: fail(404), queryKey: ['c'] })).rejects.toThrow();
    expect(sink).toHaveBeenCalledWith({
      attributes: { correlationId: 'c-1', errorClass: 'not-found', status: 404 },
      name: 'http',
      type: 'error',
    });
  });

  it('does not redirect on other errors', async () => {
    const onUnauthorized = vi.fn();
    const client = createQueryClient({ onUnauthorized });

    await expect(client.fetchQuery({ queryFn: fail(403), queryKey: ['b'] })).rejects.toThrow();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
