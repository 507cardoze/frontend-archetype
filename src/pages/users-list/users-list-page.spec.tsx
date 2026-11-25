import { describe, expect, it, vi } from 'vitest';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';

import { setTelemetrySink } from '@/lib/telemetry';
import { server } from '@/mocks/server';
import { renderRoute } from '@/test/render-route';

describe('UsersListPage', () => {
  it('lists users and paginates', async () => {
    const user = userEvent.setup();
    renderRoute('/usuarios');

    expect(await screen.findByRole('link', { name: 'Ana Torres' })).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    expect(await screen.findByRole('link', { name: 'Felipe Castro' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ana Torres' })).not.toBeInTheDocument();
  });

  it('names the screen and tags its interactions for observability', async () => {
    const sink = vi.fn();
    setTelemetrySink(sink);
    renderRoute('/usuarios');

    expect(await screen.findByRole('link', { name: 'Nuevo usuario' })).toHaveAttribute(
      'data-track',
      'users-list.new-user',
    );
    expect(sink).toHaveBeenCalledWith({ name: 'users-list', type: 'view' });
  });

  it('searches and shows the empty state', async () => {
    const user = userEvent.setup();
    renderRoute('/usuarios');

    await user.type(await screen.findByRole('searchbox'), 'diego{Enter}');
    expect(await screen.findByRole('link', { name: 'Diego Rojas' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ana Torres' })).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox'));
    await user.type(screen.getByRole('searchbox'), 'nadie{Enter}');
    expect(await screen.findByText(/No hay usuarios que coincidan/)).toBeInTheDocument();
  });

  it('shows a functional message and the tracking code on a non-retryable error', async () => {
    server.use(
      http.get('*/api/users', () =>
        HttpResponse.json(
          { status: 403, title: 'Forbidden' },
          { headers: { 'X-Correlation-Id': 'abc-123' }, status: 403 },
        ),
      ),
    );
    renderRoute('/usuarios');

    expect(await screen.findByRole('alert')).toHaveTextContent(/No tienes permiso/);
    expect(screen.getByText('abc-123')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });
});
