import { describe, expect, it, vi } from 'vitest';

import { render, screen } from '@testing-library/react';

import { ProblemError, type RequestKind } from '@/lib/http/problem';

import { ErrorState } from './error-state';

const problem = (status: number, kind: RequestKind = 'command', detail?: string) =>
  new ProblemError({ correlationId: 'c-9', detail, kind, status });

describe('ErrorState', () => {
  it('shows the BFF business message and the tracking code', () => {
    render(<ErrorState error={problem(422, 'command', 'Ya existe un registro.')} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Ya existe un registro.');
    expect(screen.getByText('c-9')).toBeInTheDocument();
  });

  it('offers a reload on a conflict', () => {
    render(<ErrorState error={problem(409)} onRetry={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Recargar' })).toBeInTheDocument();
  });

  it('offers a retry on a transient error', () => {
    render(<ErrorState error={problem(503, 'query')} onRetry={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('never offers a retry when a command may already be applied', () => {
    render(<ErrorState error={problem(500)} onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/No sabemos si la operación se aplicó/);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles errors that are not from the BFF', () => {
    render(<ErrorState error={new Error('boom')} onRetry={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });
});
