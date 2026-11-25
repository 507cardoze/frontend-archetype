import type { ComponentProps } from 'react';

import { CONTROL_CLASS } from './input';

// Figma: Select. Native select: accessible and keyboard-friendly by default.
export const Select = ({ className = '', ...props }: ComponentProps<'select'>) => (
  <select className={`${CONTROL_CLASS} ${className}`} {...props} />
);
