import { type ErrorClass, isRetryable, ProblemError } from '@/lib/http/problem';

import { Alert } from '../atoms/alert';
import { Button } from '../atoms/button';

// Functional copy per error class. Business texts (422) come from the BFF `detail`.
const MESSAGES: Record<ErrorClass, string> = {
  availability: 'No se pudo conectar con el servicio en este momento.',
  business: 'La operación no cumple una regla del negocio.',
  conflict: 'Los datos cambiaron mientras trabajabas. Recarga para ver la versión actual.',
  forbidden: 'No tienes permiso para ver o hacer esto.',
  'not-found': 'No encontramos lo que buscas. Puede que se haya eliminado.',
  request:
    'La petición no es válida. Si el problema sigue, repórtalo con el código de seguimiento.',
  temporary: 'El servicio está ocupado. Intenta de nuevo en unos segundos.',
  unauthenticated: 'Tu sesión venció. Te llevamos a iniciar sesión.',
  uncertain: 'No sabemos si la operación se aplicó. Verifica antes de repetirla.',
};

type Props = { error: unknown; onRetry?: () => void };

// Figma: Error state. Shows the tracking code so support can find the request in the BFF logs.
export const ErrorState = ({ error, onRetry }: Props) => {
  const problem = error instanceof ProblemError ? error : undefined;
  const message = problem
    ? problem.errorClass === 'business' && problem.detail
      ? problem.detail
      : MESSAGES[problem.errorClass]
    : 'Ocurrió un error inesperado.';
  // Retry only when it is safe: transient errors, conflicts (reload) or unknown errors.
  const canRetry = !problem || isRetryable(problem) || problem.errorClass === 'conflict';

  return (
    <Alert role="alert" tone="danger">
      <p>{message}</p>
      {problem && (
        <p className="mt-1 text-caption">
          Código de seguimiento: <span className="font-mono">{problem.correlationId}</span>
        </p>
      )}
      {onRetry && canRetry && (
        <Button className="mt-3" onClick={onRetry} trackId="error-state.retry" variant="link">
          {problem?.errorClass === 'conflict' ? 'Recargar' : 'Reintentar'}
        </Button>
      )}
    </Alert>
  );
};
