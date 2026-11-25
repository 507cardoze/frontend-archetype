import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { routes } from '@/app/router';
import { createQueryClient } from '@/lib/http/query-client';

/** Renders the real app routes at `path`, with a fresh cache, against the MSW mock BFF. */
export const renderRoute = (path: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <QueryClientProvider client={createQueryClient({ onUnauthorized: () => {} })}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return router;
};
