import { describe, expect, it } from 'vitest';

import { HttpResponse, http as mock } from 'msw';

import { server } from '@/mocks/server';

import { http } from './client';
import { ProblemError } from './problem';

const catchProblem = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error('expected a failure');
    },
    (error: unknown) => error as ProblemError,
  );

describe('http', () => {
  it('sends JSON with a correlation id on the same origin', async () => {
    let seen: Request | undefined;
    server.use(
      mock.post('*/api/things', ({ request }) => {
        seen = request;
        return HttpResponse.json({ id: 't-1' }, { status: 201 });
      }),
    );

    await expect(http('/things', { body: { name: 'a' }, method: 'POST' })).resolves.toEqual({
      id: 't-1',
    });
    expect(seen?.headers.get('Content-Type')).toBe('application/json');
    expect(seen?.headers.get('X-Correlation-Id')).toMatch(/^[\da-f-]{36}$/);
    expect(await seen?.json()).toEqual({ name: 'a' });
  });

  it('returns undefined on 204', async () => {
    server.use(mock.delete('*/api/things/1', () => new HttpResponse(null, { status: 204 })));
    await expect(http('/things/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('turns a problem+json response into a classified ProblemError', async () => {
    server.use(
      mock.put('*/api/things/1', () =>
        HttpResponse.json(
          { detail: 'Ya existe.', status: 422, title: 'Business rule' },
          { headers: { 'X-Correlation-Id': 'bff-1' }, status: 422 },
        ),
      ),
    );

    const error = await catchProblem(http('/things/1', { body: {}, method: 'PUT' }));
    expect(error).toBeInstanceOf(ProblemError);
    expect(error).toMatchObject({
      correlationId: 'bff-1',
      detail: 'Ya existe.',
      errorClass: 'business',
      status: 422,
    });
  });

  it('marks a network failure on a command as uncertain', async () => {
    server.use(mock.post('*/api/things', () => HttpResponse.error()));
    const error = await catchProblem(http('/things', { body: {}, method: 'POST' }));
    expect(error).toMatchObject({ errorClass: 'uncertain', status: 0 });
  });

  it('lets an aborted request fail as an abort, not as a ProblemError', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(http('/health', { signal: controller.signal })).rejects.not.toBeInstanceOf(
      ProblemError,
    );
  });
});
