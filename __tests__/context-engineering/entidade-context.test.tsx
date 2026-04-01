/**
 * @file __tests__/context-engineering/entidade-context.test.tsx
 * Testes para EntidadeProvider e useEntidade (context engineering — fase 2)
 */

import React from 'react';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ----- Mocks -----
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/entidade',
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

const SESSION_GESTOR = {
  cpf: '999',
  nome: 'Maria Gestora',
  perfil: 'gestor',
  entidade_id: 5,
  tomador_id: 5,
};

function makeFetch(ok: boolean, data: object) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 401,
    json: () => Promise.resolve(data),
  } as Response);
}

import {
  EntidadeProvider,
  useEntidade,
  EntidadeContext,
} from '@/app/entidade/entidade-context';

function Inspector() {
  const ctx = useEntidade();
  return (
    <div>
      <span data-testid="nome">{ctx.session?.nome ?? 'null'}</span>
      <span data-testid="lotes">{ctx.counts.lotes}</span>
      <span data-testid="funcionarios">{ctx.counts.funcionarios}</span>
    </div>
  );
}

describe('EntidadeContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('useEntidade retorna default value fora do provider', () => {
    const { getByTestId } = render(<Inspector />);
    expect(getByTestId('nome').textContent).toBe('null');
    expect(getByTestId('lotes').textContent).toBe('0');
    expect(getByTestId('funcionarios').textContent).toBe('0');
  });

  it('EntidadeContext.Provider fornece values customizados', () => {
    const value = {
      session: SESSION_GESTOR as Parameters<
        typeof EntidadeContext.Provider
      >[0]['value']['session'],
      counts: { lotes: 3, funcionarios: 10 },
      isLoading: false,
      reloadCounts: jest.fn(),
    };
    const { getByTestId } = render(
      <EntidadeContext.Provider value={value}>
        <Inspector />
      </EntidadeContext.Provider>
    );
    expect(getByTestId('nome').textContent).toBe('Maria Gestora');
    expect(getByTestId('lotes').textContent).toBe('3');
    expect(getByTestId('funcionarios').textContent).toBe('10');
  });

  it('EntidadeProvider redireciona para /login quando sem sessão', async () => {
    mockFetch.mockReturnValueOnce(makeFetch(false, {}));

    render(
      <EntidadeProvider>
        <Inspector />
      </EntidadeProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('EntidadeProvider redireciona quando perfil errado', async () => {
    mockFetch.mockReturnValueOnce(
      makeFetch(true, { ...SESSION_GESTOR, perfil: 'rh' })
    );

    render(
      <EntidadeProvider>
        <Inspector />
      </EntidadeProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('EntidadeProvider redireciona para termos_pendentes quando não aceitos', async () => {
    mockFetch
      .mockReturnValueOnce(makeFetch(true, SESSION_GESTOR))
      .mockReturnValueOnce(
        makeFetch(true, {
          termos_uso_aceito: false,
          politica_privacidade_aceito: false,
        })
      );

    render(
      <EntidadeProvider>
        <Inspector />
      </EntidadeProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?motivo=termos_pendentes');
    });
  });
});
