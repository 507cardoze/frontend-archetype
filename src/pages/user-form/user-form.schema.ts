import { z } from 'zod';

import { ROLE_IDS } from '@/api/users';

/**
 * Form rules as pure data: testable without React. The transform drops `team` when the role
 * does not use it, so the output is exactly the body the BFF expects.
 */
export const userFormSchema = z
  .object({
    email: z.email({ error: 'Ingresa un correo válido.' }),
    name: z
      .string()
      .trim()
      .min(1, { error: 'Ingresa el nombre.' })
      .max(80, { error: 'Máximo 80 caracteres.' }),
    role: z.enum(ROLE_IDS, { error: 'Selecciona un rol.' }),
    team: z.string().optional(),
  })
  .refine((values) => values.role !== 'AGENT' || Boolean(values.team?.trim()), {
    error: 'Ingresa el equipo del agente.',
    path: ['team'],
  })
  .transform((values) => ({
    ...values,
    team: values.role === 'AGENT' ? values.team?.trim() : undefined,
  }));

export type UserFormValues = z.input<typeof userFormSchema>;
