import { Button } from '../atoms/button';

type Props = { page: number; totalPages: number; onChange: (page: number) => void };

// Figma: Pagination.
export const Pagination = ({ onChange, page, totalPages }: Props) =>
  totalPages <= 1 ? null : (
    <nav aria-label="Paginación" className="flex items-center gap-3">
      <Button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        trackId="pagination.previous"
        variant="secondary"
      >
        Anterior
      </Button>
      <span className="text-fg-muted">
        Página {page} de {totalPages}
      </span>
      <Button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        trackId="pagination.next"
        variant="secondary"
      >
        Siguiente
      </Button>
    </nav>
  );
