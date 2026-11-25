import { Outlet, useNavigation } from 'react-router';

import { Loader } from '@/components/molecules/loader';
import { AppHeader } from '@/components/organisms/app-header';
import { AppShell } from '@/components/templates/app-shell';

const NAV = [{ label: 'Inicio', to: '/' }] as const;

export const RootLayout = () => {
  const navigation = useNavigation();

  return (
    <AppShell header={<AppHeader appName="App interna" nav={NAV} />}>
      {navigation.state === 'loading' ? <Loader /> : <Outlet />}
    </AppShell>
  );
};
