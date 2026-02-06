/**
 * @fileoverview Testes client-side para Dashboard principal
 * @description Valida renderização e comportamento de redirecionamento do Dashboard
 * para diferentes perfis de usuário (gestor)
 */

import type { Session } from '@/types/auth';
import type { AvaliacoesTodasResponse } from '@/types/avaliacao';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Dashboard from '@/app/dashboard/page';

// Mock fetch globally
const originalFetch = global.fetch;

beforeEach(() => {
  // Limpar mocks antes de cada teste
  jest.clearAllMocks();
  // Resetar location para estado inicial
  Object.defineProperty(window, 'location', {
    value: { href: 'about:blank' },
    writable: true,
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.clearAllMocks();
});

/**
 * @test Valida que gestor não é redirecionado
 * @description gestor deve permanecer no dashboard e ver seu nome renderizado
 */
test('Dashboard não redireciona gestor e exibe nome', async () => {
  // Arrange - Mock /api/auth/session returning gestor e /api/avaliacao/todas
  global.fetch = jest.fn((url: RequestInfo) => {
    const u = String(url);
    if (u.endsWith('/api/auth/session')) {
      const session: Session = {
        cpf: '87545772920',
        nome: 'RONALDO FILARDO',
        perfil: 'gestor',
      };
      return Promise.resolve(
        new Response(JSON.stringify(session), { status: 200 })
      );
    }
    if (u.endsWith('/api/avaliacao/todas')) {
      const response: AvaliacoesTodasResponse = { avaliacoes: [] };
      return Promise.resolve(
        new Response(JSON.stringify(response), { status: 200 })
      );
    }

    // fallback empty OK
    return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
  }) as jest.MockedFunction<typeof fetch>;

  // Act - Renderizar Dashboard
  render(<Dashboard />);

  // Assert - Esperar que o nome seja renderizado
  await waitFor(
    () => {
      expect(screen.getByText(/RONALDO FILARDO/i)).toBeInTheDocument();
    },
    { timeout: 3000 }
  );

  // Assert - Assegurar que não houve redirecionamento forçado
  expect(window.location.href).not.toContain('/entidade');
  expect(window.location.href).toBe('about:blank');
});
