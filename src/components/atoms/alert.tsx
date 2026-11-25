import type { ComponentProps } from 'react';

import { TONE_CLASS, type Tone } from '@/theme/tone';

// Figma: Alert (tone). The caller sets the role: "alert" for errors, "status" for notices.
export const Alert = ({
  className = '',
  tone = 'info',
  ...props
}: ComponentProps<'div'> & { tone?: Tone }) => (
  <div
    className={`rounded-control border border-current/20 p-3 text-body ${TONE_CLASS[tone]} ${className}`}
    {...props}
  />
);
