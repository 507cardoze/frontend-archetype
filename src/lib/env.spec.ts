import { afterEach, describe, expect, it, vi } from 'vitest';

const load = async () => {
  vi.resetModules();
  return (await import('./env')).env;
};

describe('env', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses safe defaults when nothing is set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubEnv('VITE_LOGIN_URL', '');
    expect(await load()).toEqual({
      VITE_API_BASE_URL: '/api',
      VITE_LOGIN_URL: '/api/auth/login',
    });
  });

  it('refuses a BFF outside the same origin', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://bff.example.com');
    await expect(load()).rejects.toThrow('Invalid VITE_API_BASE_URL');
  });
});
