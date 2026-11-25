import type { ComponentType } from 'react';

import { createBrowserRouter, type RouteObject } from 'react-router';

import { Loader } from '@/components/molecules/loader';

import { RootLayout } from './root-layout';
import { RouteErrorPage } from './route-error-page';

/** Each page is its own lazy chunk. The id names the screen in telemetry. */
const page = (id: string, load: () => Promise<{ default: ComponentType }>) => ({
  HydrateFallback: Loader,
  id,
  lazy: async () => ({ Component: (await load()).default }),
});

// Exported so tests render the real routes.
export const routes: RouteObject[] = [
  {
    Component: RootLayout,
    children: [
      { index: true, ...page('home', () => import('@/pages/home/home-page')) },
      { path: '*', ...page('not-found', () => import('@/pages/not-found/not-found-page')) },
    ],
    ErrorBoundary: RouteErrorPage,
    path: '/',
  },
];

export const createRouter = () => createBrowserRouter(routes);
