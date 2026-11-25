import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';

import { createRouter } from '@/app/router';
import '@/lib/env';
import { createQueryClient } from '@/lib/http/query-client';

import './styles.css';

const startMocks = async () => {
  // Static check so production builds drop the mock BFF entirely.
  if (import.meta.env.VITE_API_MOCKS !== 'true') return;
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
};

await startMocks();

// After a deploy, an open tab may request a chunk of the previous release: reload to get the new one.
window.addEventListener('vite:preloadError', () => window.location.reload());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={createQueryClient()}>
      <RouterProvider router={createRouter()} />
    </QueryClientProvider>
  </StrictMode>,
);
