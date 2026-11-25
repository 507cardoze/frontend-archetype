import '@testing-library/jest-dom/vitest';

import { afterAll, afterEach, beforeAll } from 'vitest';

import { cleanup } from '@testing-library/react';

import { setTelemetrySink } from '@/lib/telemetry';
import { resetMockDb } from '@/mocks/handlers';
import { server } from '@/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockDb();
  setTelemetrySink(() => {});
});

afterAll(() => server.close());
