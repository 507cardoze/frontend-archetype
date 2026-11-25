import { zodResolver } from '@hookform/resolvers/zod';
import { type DefaultValues, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';

import { type User, type UserInput, useSaveUser } from '@/api/users';
import { isConflict } from '@/lib/http/problem';
import { telemetry } from '@/lib/telemetry';

import { type UserFormValues, userFormSchema } from './user-form.schema';

// No role on create: the select shows "Selecciona…" and validation asks for one.
const toFormValues = (user?: User): DefaultValues<UserFormValues> =>
  user
    ? { email: user.email, name: user.name, role: user.role, team: user.team ?? '' }
    : { email: '', name: '', team: '' };

type Options = { user?: User | undefined; reload?: () => Promise<{ data?: User | undefined }> };

/** View model (service layer) of the create/edit form. The page only renders what it returns. */
export const useUserFormVm = ({ reload, user }: Options = {}) => {
  const navigate = useNavigate();
  const save = useSaveUser(user?.id);
  const form = useForm<UserFormValues, unknown, UserInput>({
    defaultValues: toFormValues(user),
    resolver: zodResolver(userFormSchema),
  });

  const submit = form.handleSubmit((input) =>
    save.mutate(
      { input, version: user?.version },
      {
        onSuccess: () => {
          // A business outcome the DOM cannot see: reported from the service layer.
          telemetry.action('user-form.saved', { mode: user ? 'edit' : 'create' });
          navigate('/usuarios');
        },
      },
    ),
  );

  // 409: someone else changed this user. Show the current version from the BFF; never resend.
  const reloadAfterConflict = async () => {
    save.reset();
    const result = await reload?.();
    if (result?.data) form.reset(toFormValues(result.data));
  };

  return {
    errors: form.formState.errors,
    register: form.register,
    /** Wired to the error button, which only shows for conflicts or retryable errors. */
    retrySave: () => (isConflict(save.error) ? reloadAfterConflict() : submit()),
    save,
    showTeam: useWatch({ control: form.control, name: 'role' }) === 'AGENT',
    submit,
  };
};
