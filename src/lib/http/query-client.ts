import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { env } from '@/lib/env';

import { isRetryable, ProblemError } from './problem';

/** The BFF owns the login: send the user there and come back to the same screen. */
const redirectToLogin = () => {
  const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`${env.VITE_LOGIN_URL}?returnTo=${returnTo}`);
};

export const createQueryClient = ({ onUnauthorized = redirectToLogin } = {}) => {
  const onError = (error: unknown) => {
    if (error instanceof ProblemError && error.errorClass === 'unauthenticated') onUnauthorized();
  };

  return new QueryClient({
    defaultOptions: {
      // Commands are never retried automatically: a 5xx may already be applied.
      mutations: { retry: false },
      queries: {
        retry: (failureCount, error) =>
          (!(error instanceof ProblemError) || isRetryable(error)) && failureCount < 2,
      },
    },
    mutationCache: new MutationCache({ onError }),
    queryCache: new QueryCache({ onError }),
  });
};
