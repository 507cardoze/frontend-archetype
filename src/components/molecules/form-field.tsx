import { type ReactNode, useId } from 'react';

import { Label } from '../atoms/label';

/** Props the control must spread so label, hint and error are announced together. */
type FieldA11y = {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  'aria-required': true | undefined;
};

type Props = {
  label: string;
  error?: string | undefined;
  hint?: string;
  required?: boolean;
  children: (a11y: FieldA11y) => ReactNode;
};

// Figma: Form field (Label + control + hint/error).
export const FormField = ({ children, error, hint, label, required = false }: Props) => {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      {children({
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
        id,
      })}
      {hint && (
        <p className="text-caption text-fg-muted" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-caption text-danger" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
};
