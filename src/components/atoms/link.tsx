import { Link, type LinkProps } from 'react-router';

import type { TrackId } from '@/lib/telemetry';

import { type ButtonVariant, buttonClass } from './button';

type Props = LinkProps & { trackId: TrackId };

// Figma: Link. Navigation is always a real <a>, even when it looks like a button.
export const TextLink = ({ className = '', trackId, ...props }: Props) => (
  <Link
    className={`font-semibold text-primary hover:underline ${className}`}
    data-track={trackId}
    {...props}
  />
);

// Figma: Button used for navigation ("Nuevo", "Cancelar").
export const ButtonLink = ({
  className,
  trackId,
  variant = 'primary',
  ...props
}: Props & { variant?: ButtonVariant }) => (
  <Link className={buttonClass(variant, className)} data-track={trackId} {...props} />
);
