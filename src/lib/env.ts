/**
 * Reads the VITE_* variables once and fails fast: a misconfigured build must not reach a user.
 * Nothing here is secret: these values end up in the bundle.
 */
const read = (name: string, fallback: string) => {
  const value: unknown = import.meta.env[name];
  return typeof value === 'string' && value !== '' ? value : fallback;
};

const apiBaseUrl = read('VITE_API_BASE_URL', '/api');
if (!apiBaseUrl.startsWith('/')) {
  throw new Error('Invalid VITE_API_BASE_URL: use a same-origin path such as /api');
}

export const env = {
  VITE_API_BASE_URL: apiBaseUrl,
  VITE_LOGIN_URL: read('VITE_LOGIN_URL', '/api/auth/login'),
};
