import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().startsWith('/').default('/api'),
  VITE_API_MOCKS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  VITE_LOGIN_URL: z.string().min(1).default('/api/auth/login'),
});

// Fail fast: a misconfigured build must not reach a user's screen.
export const env = envSchema.parse(import.meta.env);
