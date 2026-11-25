import { HttpResponse, http } from 'msw';

// Mock BFF shared by `pnpm dev:mock` and the tests. Add one handler per endpoint the app uses,
// answering like the real BFF (problem+json errors, correlation id). Tests override per case
// with `server.use(...)`.
export const handlers = [http.get('*/api/health', () => HttpResponse.json({ status: 'ok' }))];
