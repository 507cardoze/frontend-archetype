import type { ReactNode } from 'react';

import type { UseQueryResult } from '@tanstack/react-query';

import { Loader } from '../molecules/loader';
import { ErrorState } from './error-state';

type Props<T> = { query: UseQueryResult<T>; children: (data: T) => ReactNode };

/** Every screen renders loading, error and data through here, so none ships without them. */
export const QueryState = <T,>({ children, query }: Props<T>) => {
  if (query.isPending) return <Loader />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return children(query.data);
};
