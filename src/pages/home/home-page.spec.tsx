import { describe, expect, it, vi } from 'vitest';

import { screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';

import { setTelemetrySink } from '@/lib/telemetry';
import { server } from '@/mocks/server';
import { renderRoute } from '@/test/render-route';

describe('HomePage', () => {
  it('confirms the BFF is reachable and reports the view', async () => {
    const sink = vi.fn();
    setTelemetrySink(sink);
    renderRoute('/');

    // The loader is also role=status, so wait for the text itself.
    expect(await screen.findByText(/conectada al BFF/)).toBeInTheDocument();
    expect(sink).toHaveBeenCalledWith({ name: 'home', type: 'view' });
  });

  it('shows a functional message and the tracking code when the BFF fails', async () => {
    server.use(
      http.get('*/api/health', () =>
        HttpResponse.json(
          { status: 403, title: 'Forbidden' },
          { headers: { 'X-Correlation-Id': 'abc-123' }, status: 403 },
        ),
      ),
    );
    renderRoute('/');

    expect(await screen.findByRole('alert')).toHaveTextContent(/No tienes permiso/);
    expect(screen.getByText('abc-123')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });
});
