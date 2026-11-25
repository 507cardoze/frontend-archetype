import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { http } from '@/lib/http/client';

// Adapter for the BFF `users` resource: types, cache keys and the calls. No UI here.

export const ROLE_IDS = ['ADMIN', 'AGENT', 'VIEWER'] as const;
export type Role = (typeof ROLE_IDS)[number];
export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: 'Administrador',
  AGENT: 'Agente',
  VIEWER: 'Consulta',
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  team?: string | undefined;
  /** Optimistic concurrency: sent back on every update; a stale one gets a 409. */
  version: number;
};
export type UserInput = Pick<User, 'name' | 'email' | 'role' | 'team'>;
export type UserFilters = { search: string; page: number };
type Page<T> = { items: T[]; page: number; totalPages: number };

const userKeys = {
  detail: (id: string) => ['users', 'detail', id] as const,
  list: (filters: UserFilters) => ['users', 'list', filters] as const,
  lists: ['users', 'list'] as const,
};

export const useUsers = (filters: UserFilters) =>
  useQuery({
    // Keeps the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      http<Page<User>>(
        `/users?${new URLSearchParams({ page: String(filters.page), search: filters.search })}`,
        { signal },
      ),
    queryKey: userKeys.list(filters),
  });

export const useUser = (id: string) =>
  useQuery({
    queryFn: ({ signal }) => http<User>(`/users/${id}`, { signal }),
    queryKey: userKeys.detail(id),
  });

/** Create (no id) or update (id + version). The BFF answers with the saved user. */
export const useSaveUser = (id?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, version }: { input: UserInput; version?: number | undefined }) =>
      id
        ? http<User>(`/users/${id}`, { body: { ...input, version }, method: 'PUT' })
        : http<User>('/users', { body: input, method: 'POST' }),
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user);
      return queryClient.invalidateQueries({ queryKey: userKeys.lists });
    },
  });
};
