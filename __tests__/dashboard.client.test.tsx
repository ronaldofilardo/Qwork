import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '@/app/dashboard/page';

// Mock fetch globally
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

test('Dashboard não redireciona gestor_entidade e exibe nome', async () => {
  // Mock /api/auth/session returning gestor_entidade and /api/avaliacao/todas
  global.fetch = jest.fn((url: RequestInfo) => {
    const u = String(url);
    if (u.endsWith('/api/auth/session')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            cpf: '87545772920',
            nome: 'RONALDO FILARDO',
            perfil: 'gestor_entidade',
          }),
          { status: 200 }
        )
      );
    }
    if (u.endsWith('/api/avaliacao/todas')) {
      return Promise.resolve(
        new Response(JSON.stringify({ avaliacoes: [] }), { status: 200 })
      );
    }

    // fallback empty OK
    return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
  }) as any;

  render(<Dashboard />);

  // Esperar que o nome seja renderizado
  await waitFor(() => {
    expect(screen.getByText(/RONALDO FILARDO/i)).toBeInTheDocument();
  });

  // Assegurar que não houve redirecionamento forçado (window.location não alterado)
  // (jsdom default location is about:blank)
  expect(window.location.href).not.toContain('/entidade');
});
