import type { ComponentProps } from 'react';

import type { TrackId } from '@/lib/telemetry';

// Figma: Button (variant = primary | secondary | danger | link).
const VARIANT = {
  danger: 'rounded-control bg-danger px-4 py-2 font-semibold text-on-danger hover:bg-danger/90',
  link: 'p-0 font-semibold text-primary underline hover:text-primary-hover',
  primary:
    'rounded-control bg-primary px-4 py-2 font-semibold text-on-primary hover:bg-primary-hover',
  secondary:
    'rounded-control border border-line-strong bg-surface px-4 py-2 font-semibold text-fg hover:bg-surface-muted',
} as const;

type Props = ComponentProps<'button'> & {
  variant?: keyof typeof VARIANT;
  /** Optional observability name, rendered as `data-track` (see docs/observability.md). */
  trackId?: TrackId;
};

/** `className` is for layout only (margin, alignment); the look comes from `variant`. */
export const Button = ({
  className = '',
  trackId,
  type = 'button',
  variant = 'primary',
  ...props
}: Props) => (
  <button
    className={`text-body disabled:opacity-60 ${VARIANT[variant]} ${className}`}
    data-track={trackId}
    type={type}
    {...props}
  />
);
