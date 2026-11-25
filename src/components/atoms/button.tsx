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

export type ButtonVariant = keyof typeof VARIANT;

/** Shared with ButtonLink, so a link that looks like a button is the same Figma component. */
export const buttonClass = (variant: ButtonVariant, className = '') =>
  `inline-block text-body disabled:opacity-60 ${VARIANT[variant]} ${className}`;

type Props = ComponentProps<'button'> & { trackId: TrackId; variant?: ButtonVariant };

/**
 * `className` is for layout only (margin, alignment); the look comes from `variant`.
 * `trackId` is required: every interaction is named for observability (`data-track`).
 */
export const Button = ({
  className,
  trackId,
  type = 'button',
  variant = 'primary',
  ...props
}: Props) => (
  <button className={buttonClass(variant, className)} data-track={trackId} type={type} {...props} />
);
