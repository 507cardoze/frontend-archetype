import { describe, expect, it, vi } from 'vitest';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';

import { setTelemetrySink } from '@/lib/telemetry';
import { server } from '@/mocks/server';
import { apiCall, renderRoute } from '@/test/render-route';

type User = ReturnType<typeof userEvent.setup>;

const fillNewUser = async (user: User, email: string) => {
  await user.type(await screen.findByLabelText(/Nombre/), 'Hugo Paz');
  await user.type(screen.getByLabelText(/Correo/), email);
  await user.selectOptions(screen.getByLabelText(/Rol/), 'VIEWER');
};

describe('UserFormPage', () => {
  it('validates, shows the conditional field, saves and returns to the list', async () => {
    const sink = vi.fn();
    setTelemetrySink(sink);
    const user = userEvent.setup();
    renderRoute('/usuarios/nuevo');

    await user.click(await screen.findByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Ingresa el nombre.')).toBeInTheDocument();
    expect(screen.getByText('Selecciona un rol.')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre/)).toHaveAttribute('aria-invalid', 'true');

    await fillNewUser(user, 'hugo@example.com');
    expect(screen.queryByLabelText(/Equipo/)).not.toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/Rol/), 'AGENT');
    await user.type(screen.getByLabelText(/Equipo/), 'Ventas');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('heading', { name: 'Usuarios' })).toBeInTheDocument();
    expect(sink).toHaveBeenCalledWith({
      attributes: { mode: 'create' },
      name: 'user-form.saved',
      type: 'action',
    });
    await user.click(await screen.findByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByRole('link', { name: 'Hugo Paz' })).toBeInTheDocument();
  });

  it('shows the business message from the BFF', async () => {
    const user = userEvent.setup();
    renderRoute('/usuarios/nuevo');

    await fillNewUser(user, 'ana@example.com');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe un usuario con ese correo.',
    );
  });

  it('offers a reload on a version conflict and shows the current data', async () => {
    const user = userEvent.setup();
    renderRoute('/usuarios/u-1');
    await screen.findByDisplayValue('Ana Torres');

    // Another session saves first: version 1 -> 2.
    await apiCall('/users/u-1', 'PUT', {
      email: 'ana@example.com',
      name: 'Ana María Torres',
      role: 'ADMIN',
      version: 1,
    });
    await user.type(screen.getByLabelText(/Nombre/), ' Gómez');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Los datos cambiaron/);
    await user.click(screen.getByRole('button', { name: 'Recargar' }));

    expect(await screen.findByDisplayValue('Ana María Torres')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('treats a network failure on save as uncertain and offers no retry', async () => {
    server.use(http.post('*/api/users', () => HttpResponse.error()));
    const user = userEvent.setup();
    renderRoute('/usuarios/nuevo');

    await fillNewUser(user, 'hugo@example.com');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /No sabemos si la operación se aplicó/,
    );
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });
});
