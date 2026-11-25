import { useSearchParams } from 'react-router';

import { useUsers } from '@/api/users';

/**
 * View model (service layer): what the page shows and what it can do. Filters live in the URL,
 * so a search can be shared, bookmarked and undone with the back button.
 */
export const useUsersListVm = () => {
  const [params, setParams] = useSearchParams();
  const filters = { page: Number(params.get('page')) || 1, search: params.get('search') ?? '' };

  return {
    filters,
    goToPage: (page: number) =>
      setParams({ ...(filters.search && { search: filters.search }), page: String(page) }),
    query: useUsers(filters),
    search: (search: string) => setParams(search ? { search } : {}),
  };
};
