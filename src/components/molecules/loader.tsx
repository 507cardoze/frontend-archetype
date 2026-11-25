import { Spinner } from '../atoms/spinner';

// Figma: Loader (Spinner + text). The text is what screen readers announce.
export const Loader = ({ label = 'Cargando…' }: { label?: string }) => (
  <output aria-live="polite" className="flex items-center gap-2 py-6 text-fg-muted">
    <Spinner />
    {label}
  </output>
);
