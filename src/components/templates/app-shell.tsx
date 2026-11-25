import type { ReactNode } from 'react';

// Figma: App shell (header slot + main content). Layout only, no data.
export const AppShell = ({ children, header }: { children: ReactNode; header: ReactNode }) => (
  <div className="flex min-h-svh flex-col">
    <a
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2"
      href="#main-content"
    >
      Saltar al contenido
    </a>
    {header}
    <main className="flex-1 px-6 py-8" id="main-content" tabIndex={-1}>
      {children}
    </main>
  </div>
);
