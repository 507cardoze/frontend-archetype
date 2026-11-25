import { useQuery } from '@tanstack/react-query';

import { http } from '@/lib/http/client';

// Adapter for one BFF resource: its type, cache key and calls. Add one file per resource.
type Health = { status: 'ok' };

export const useHealth = () =>
  useQuery({
    queryFn: ({ signal }) => http<Health>('/health', { signal }),
    queryKey: ['health'],
  });
