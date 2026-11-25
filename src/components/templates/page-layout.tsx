import type { ReactNode } from 'react';

type Props = { title: string; actions?: ReactNode; children: ReactNode };

// Figma: Page layout (title, optional actions, content). Every page renders inside it.
export const PageLayout = ({ actions, children, title }: Props) => (
  <section className="mx-auto flex max-w-5xl flex-col gap-6">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-title">{title}</h1>
      {actions}
    </header>
    {children}
  </section>
);
