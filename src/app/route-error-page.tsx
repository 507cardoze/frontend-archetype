import { useEffect } from 'react';

import { useRouteError } from 'react-router';

import { ErrorState } from '@/components/organisms/error-state';
import { telemetry } from '@/lib/telemetry';

/** Render errors and failed lazy chunks (e.g. after a deploy) land here. */
export const RouteErrorPage = () => {
  const error = useRouteError();

  useEffect(() => {
    telemetry.error('route', { name: error instanceof Error ? error.name : 'unknown' });
  }, [error]);

  return (
    <div className="p-6">
      <ErrorState error={error} onRetry={() => window.location.reload()} />
    </div>
  );
};
