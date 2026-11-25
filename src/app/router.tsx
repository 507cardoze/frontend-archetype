import type { ComponentType } from 'react';

import { createBrowserRouter, type RouteObject } from 'react-router';

import { Loader } from '@/components/molecules/loader';

import { RootLayout } from './root-layout';
import { RouteErrorPage } from './route-error-page';

/** Each page is its own lazy chunk. */
const page = (load: () => Promise<{ default: ComponentType }>) => ({
  HydrateFallback: Loader,
  lazy: async () => ({ Component: (await load()).default }),
});

// Exported so tests render the real routes.
export const routes: RouteObject[] = [
  {
    Component: RootLayout,
    children: [
      { index: true, ...page(() => import('@/pages/home/home-page')) },
      { path: '*', ...page(() => import('@/pages/not-found/not-found-page')) },
    ],
    ErrorBoundary: RouteErrorPage,
    path: '/',
  },
];

export const createRouter = () => createBrowserRouter(routes);
