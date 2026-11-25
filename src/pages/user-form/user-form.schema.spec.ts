import { describe, expect, it } from 'vitest';

import { userFormSchema } from './user-form.schema';

const errorsOf = (values: unknown) => {
  const result = userFormSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
};

describe('userFormSchema', () => {
  it('requires name, a valid email and a role', () => {
    expect(errorsOf({ email: 'no-es-correo', name: ' ' })).toEqual({
      email: 'Ingresa un correo válido.',
      name: 'Ingresa el nombre.',
      role: 'Selecciona un rol.',
    });
  });

  it('requires a team only for agents', () => {
    expect(errorsOf({ email: 'a@example.com', name: 'Ana', role: 'AGENT', team: '' })).toEqual({
      team: 'Ingresa el equipo del agente.',
    });
  });

  it('drops the team when the role does not use it', () => {
    const output = userFormSchema.parse({
      email: 'a@example.com',
      name: 'Ana',
      role: 'ADMIN',
      team: 'Soporte',
    });
    expect(output.team).toBeUndefined();
  });
});
