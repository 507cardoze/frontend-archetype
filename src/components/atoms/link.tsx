import { Link, type LinkProps } from 'react-router';

import type { TrackId } from '@/lib/telemetry';

type Props = LinkProps & {
  /** Optional observability name, rendered as `data-track` (see docs/observability.md). */
  trackId?: TrackId;
};

// Figma: Link. Navigation is always a real <a>.
export const TextLink = ({ className = '', trackId, ...props }: Props) => (
  <Link
    className={`font-semibold text-primary hover:underline ${className}`}
    data-track={trackId}
    {...props}
  />
);
