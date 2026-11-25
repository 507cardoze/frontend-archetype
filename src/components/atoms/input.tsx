import type { ComponentProps } from 'react';

// Figma: Input. Native control: keyboard, date picker and a11y come from the browser.
export const CONTROL_CLASS =
  'block w-full rounded-control border border-line-strong bg-surface px-3 py-2 text-body text-fg aria-invalid:border-danger read-only:bg-surface-muted';

export const Input = ({ className = '', ...props }: ComponentProps<'input'>) => (
  <input className={`${CONTROL_CLASS} ${className}`} {...props} />
);
