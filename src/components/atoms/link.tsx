import { Link, type LinkProps } from 'react-router';

// Figma: Link. Navigation is always a real <a>.
export const TextLink = ({ className = '', ...props }: LinkProps) => (
  <Link className={`font-semibold text-primary hover:underline ${className}`} {...props} />
);
