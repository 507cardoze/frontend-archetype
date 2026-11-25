import { useRouteError } from 'react-router';

import { ErrorState } from '@/components/organisms/error-state';

/** Render errors and failed lazy chunks (e.g. after a deploy) land here. */
export const RouteErrorPage = () => (
  <div className="p-6">
    <ErrorState error={useRouteError()} onRetry={() => window.location.reload()} />
  </div>
);
