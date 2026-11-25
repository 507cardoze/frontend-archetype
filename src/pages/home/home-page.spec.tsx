import { describe, expect, it } from 'vitest';

import { screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { server } from '@/mocks/server';
import { renderRoute } from '@/test/render-route';

describe('HomePage', () => {
  it('confirms the BFF is reachable', async () => {
    renderRoute('/');

    // The loader is also role=status, so wait for the text itself.
    expect(await screen.findByText(/conectada al BFF/)).toBeInTheDocument();
  });

  it('shows a functional message when the BFF fails', async () => {
    server.use(
      http.get('*/api/health', () =>
        HttpResponse.json({ status: 403, title: 'Forbidden' }, { status: 403 }),
      ),
    );
    renderRoute('/');

    expect(await screen.findByRole('alert')).toHaveTextContent(/No tienes permiso/);
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });
});
