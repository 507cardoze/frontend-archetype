import { useParams } from 'react-router';

import { ROLE_IDS, ROLE_LABEL, type User, useUser } from '@/api/users';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { ButtonLink } from '@/components/atoms/link';
import { Select } from '@/components/atoms/select';
import { FormField } from '@/components/molecules/form-field';
import { ErrorState } from '@/components/organisms/error-state';
import { QueryState } from '@/components/organisms/query-state';
import { PageLayout } from '@/components/templates/page-layout';

import { useUserFormVm } from './use-user-form-vm';

type FormProps = { user?: User; reload?: () => Promise<{ data?: User | undefined }> };

const UserForm = ({ reload, user }: FormProps) => {
  const vm = useUserFormVm({ reload, user });

  return (
    <form className="flex max-w-xl flex-col gap-4" noValidate onSubmit={vm.submit}>
      <FormField error={vm.errors.name?.message} label="Nombre" required>
        {(a11y) => <Input autoComplete="off" {...a11y} {...vm.register('name')} />}
      </FormField>

      <FormField error={vm.errors.email?.message} label="Correo" required>
        {(a11y) => <Input autoComplete="off" type="email" {...a11y} {...vm.register('email')} />}
      </FormField>

      <FormField error={vm.errors.role?.message} label="Rol" required>
        {(a11y) => (
          <Select {...a11y} {...vm.register('role')}>
            <option value="">Selecciona…</option>
            {ROLE_IDS.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </Select>
        )}
      </FormField>

      {vm.showTeam && (
        <FormField
          error={vm.errors.team?.message}
          hint="Equipo que atiende los casos del agente."
          label="Equipo"
          required
        >
          {(a11y) => <Input {...a11y} {...vm.register('team')} />}
        </FormField>
      )}

      {vm.save.isError && <ErrorState error={vm.save.error} onRetry={vm.retrySave} />}

      <div className="flex gap-3">
        <Button disabled={vm.save.isPending} trackId="user-form.save" type="submit">
          {vm.save.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
        <ButtonLink to="/usuarios" trackId="user-form.cancel" variant="secondary">
          Cancelar
        </ButtonLink>
      </div>
    </form>
  );
};

const EditUser = ({ id }: { id: string }) => {
  const query = useUser(id);
  return (
    <QueryState query={query}>
      {(user) => <UserForm reload={query.refetch} user={user} />}
    </QueryState>
  );
};

// One page for create (/usuarios/nuevo) and edit (/usuarios/:userId).
const UserFormPage = () => {
  const { userId } = useParams();

  return (
    <PageLayout title={userId ? 'Editar usuario' : 'Nuevo usuario'}>
      {userId ? <EditUser id={userId} /> : <UserForm />}
    </PageLayout>
  );
};

export default UserFormPage;
