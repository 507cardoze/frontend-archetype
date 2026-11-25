import type { ComponentProps } from 'react';

// Figma: Label.
export const Label = ({
  children,
  htmlFor,
  required = false,
  ...props
}: ComponentProps<'label'> & { required?: boolean }) => (
  <label className="font-medium text-fg" htmlFor={htmlFor} {...props}>
    {children}
    {required && <span aria-hidden="true"> *</span>}
  </label>
);
