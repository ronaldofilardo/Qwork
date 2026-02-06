/**
 * @fileoverview Testes para Layout da área de Entidade
 * @description Valida autenticação e redirecionamento baseado em perfil
 * para o layout da área administrativa de entidades
 */

import type { Session } from '@/types/auth';
import type { NotificacoesResponse } from '@/types/notificacao';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import EntidadeLayout from '@/app/entidade/layout';

// Mock useRouter push
const pushMock = jest.fn() as jest.MockedFunction<(path: string) => void>;

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/entidade',
}));

beforeEach(() => {
  // Limpar mocks antes de cada teste
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
  // restore fetch
  // @ts-ignore
  if (global.fetch && global.fetch.mockRestore) global.fetch.mockRestore();
});

/**
 * @test Valida redirecionamento quando perfil não é autorizado
 * @description Layout deve redirecionar para /login quando usuário não tem perfil gestor
 */
test('Entidade layout redireciona para login se perfil incorreto', async () => {
  // Arrange - Mock session endpoint returning perfil 'rh' (não autorizado)
  // @ts-ignore
  global.fetch = jest.fn((url: RequestInfo) => {
    if (String(url).endsWith('/api/auth/session')) {
      const session: Session = { cpf: '123', nome: 'Usuário RH', perfil: 'rh' };
      return Promise.resolve(
        new Response(JSON.stringify(session), { status: 200 })
      );
    }
    return Promise.resolve(new Response('{}', { status: 200 }));
  }) as jest.MockedFunction<typeof fetch>;

  // Act - Renderizar layout
  render(<EntidadeLayout>{<div>conteudo</div>}</EntidadeLayout>);

  // Assert - Deve redirecionar para login
  await waitFor(
    () => {
      expect(pushMock).toHaveBeenCalledWith('/login');
    },
    { timeout: 3000 }
  );
});

/**
 * @test Valida renderização com perfil autorizado
 * @description Layout deve aceitar gestor e renderizar conteúdo sem redirecionar
 */
test('Entidade layout aceita gestor e carrega conteudo', async () => {
  // Arrange - Mock session endpoint returning gestor
  // @ts-ignore
  global.fetch = jest.fn((url: RequestInfo) => {
    if (String(url).endsWith('/api/auth/session')) {
      const session: Session = {
        cpf: '87545772920',
        nome: 'RONALDO',
        perfil: 'gestor',
      };
      return Promise.resolve(
        new Response(JSON.stringify(session), { status: 200 })
      );
    }
    // Simulate other APIs used by loadCounts
    if (String(url).endsWith('/api/entidade/notificacoes')) {
      const response: NotificacoesResponse = { totalNaoLidas: 0 };
      return Promise.resolve(
        new Response(JSON.stringify(response), { status: 200 })
      );
    }
    return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
  }) as jest.MockedFunction<typeof fetch>;

  // Act - Renderizar layout
  const { getByText } = render(
    <EntidadeLayout>{<div>conteudo</div>}</EntidadeLayout>
  );

  // Assert - Deve renderizar conteúdo sem redirecionar
  await waitFor(
    () => {
      expect(getByText('conteudo')).toBeInTheDocument();
    },
    { timeout: 3000 }
  );

  expect(pushMock).not.toHaveBeenCalled();
});
