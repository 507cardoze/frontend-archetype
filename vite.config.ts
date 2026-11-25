/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { readFileSync } from 'node:fs';
import path from 'node:path';

const qualityGate = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, 'quality-gate.json'), 'utf8'),
) as { coverage: Record<'lines' | 'statements' | 'functions' | 'branches', number> };

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE_URL || '/api';

  return {
    plugins: [react(), babel({ presets: [reactCompilerPreset()] }), tailwindcss()],
    // The MSW worker is served only in mock mode, so it never reaches a production build.
    publicDir: mode === 'mock' ? 'src/mocks/public' : 'public',
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, 'src') },
    },
    server: {
      // Same-origin proxy to a real BFF: the session cookie behaves as it does in production.
      proxy: env.API_PROXY_TARGET
        ? { [apiBase]: { changeOrigin: true, target: env.API_PROXY_TARGET } }
        : undefined,
    },
    test: {
      coverage: {
        exclude: ['src/main.tsx', 'src/mocks/**', 'src/test/**', '**/*.spec.{ts,tsx}'],
        include: ['src/**/*.{ts,tsx}', 'scripts/**/*.ts'],
        provider: 'istanbul',
        // json feeds Fallow's CRAP score; text-summary is for humans.
        reporter: ['text-summary', 'json'],
        // The project's rules: edit quality-gate.json, not this file.
        thresholds: qualityGate.coverage,
      },
      environment: 'jsdom',
      // Off: the cached `import.meta.glob` in the architecture/theme guards would miss new files.
      fsModuleCache: false,
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
