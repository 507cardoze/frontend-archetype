import { ROLE_LABEL, type User } from '@/api/users';
import { ButtonLink, TextLink } from '@/components/atoms/link';
import { Pagination } from '@/components/molecules/pagination';
import { SearchBox } from '@/components/molecules/search-box';
import { type Column, DataTable } from '@/components/organisms/data-table';
import { QueryState } from '@/components/organisms/query-state';
import { PageLayout } from '@/components/templates/page-layout';

import { useUsersListVm } from './use-users-list-vm';

const COLUMNS: readonly Column<User>[] = [
  {
    cell: (user) => (
      <TextLink to={`/usuarios/${user.id}`} trackId="users-list.open-user">
        {user.name}
      </TextLink>
    ),
    header: 'Nombre',
    key: 'name',
  },
  { cell: (user) => user.email, header: 'Correo', key: 'email' },
  { cell: (user) => ROLE_LABEL[user.role], header: 'Rol', key: 'role' },
  { cell: (user) => user.team ?? '—', header: 'Equipo', key: 'team' },
];

// Page = template + organisms + data from the view model. No colors or sizes here.
const UsersListPage = () => {
  const vm = useUsersListVm();

  return (
    <PageLayout
      actions={
        <ButtonLink to="/usuarios/nuevo" trackId="users-list.new-user">
          Nuevo usuario
        </ButtonLink>
      }
      title="Usuarios"
    >
      <SearchBox
        defaultValue={vm.filters.search}
        key={vm.filters.search}
        label="Buscar por nombre o correo"
        onSearch={vm.search}
      />
      <QueryState query={vm.query}>
        {(page) => (
          <>
            <DataTable
              caption="Usuarios"
              columns={COLUMNS}
              empty="No hay usuarios que coincidan con la búsqueda."
              rowKey={(user) => user.id}
              rows={page.items}
            />
            <Pagination onChange={vm.goToPage} page={page.page} totalPages={page.totalPages} />
          </>
        )}
      </QueryState>
    </PageLayout>
  );
};

export default UsersListPage;
