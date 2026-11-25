import { useEffect } from 'react';

import { Outlet, useMatches, useNavigation } from 'react-router';

import { Loader } from '@/components/molecules/loader';
import { AppHeader } from '@/components/organisms/app-header';
import { AppShell } from '@/components/templates/app-shell';
import { telemetry } from '@/lib/telemetry';

const NAV = [{ label: 'Usuarios', to: '/usuarios', trackId: 'app-header.users' }] as const;

export const RootLayout = () => {
  const navigation = useNavigation();
  // One view event per screen, named by route id (the URL can carry ids).
  const routeId = useMatches().at(-1)?.id;

  useEffect(() => {
    if (routeId) telemetry.view(routeId);
  }, [routeId]);

  return (
    <AppShell header={<AppHeader appName="App interna" nav={NAV} />}>
      {navigation.state === 'loading' ? <Loader /> : <Outlet />}
    </AppShell>
  );
};
