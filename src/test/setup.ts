import '@testing-library/jest-dom/vitest';

import { afterAll, afterEach, beforeAll } from 'vitest';

import { cleanup, configure } from '@testing-library/react';

import { server } from '@/mocks/server';

// CI runners are slower: lazy routes plus coverage instrumentation can exceed the 1 s default.
configure({ asyncUtilTimeout: 5000 });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => server.close());
