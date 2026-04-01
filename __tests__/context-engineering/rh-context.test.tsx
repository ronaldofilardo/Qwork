/**
 * @file __tests__/context-engineering/rh-context.test.tsx
 * Testes para RHProvider e useRH (context engineering — fase 1)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ----- Mocks -----
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/rh',
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

const SESSION_RH = { cpf: '000', nome: 'Ana RH', perfil: 'rh', clinica_id: 1 };
const SESSION_ADMIN = { cpf: '111', nome: 'Carlos Admin', perfil: 'admin' };

function makeSessionFetch(session: object) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(session),
  } as Response);
}

function makeTermosFetch(aceitos = true) {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        termos_uso_aceito: aceitos,
        politica_privacidade_aceito: aceitos,
      }),
  } as Response);
}

function makeCountsFetch(data: object) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);
}

function makeUnauthorized() {
  return Promise.resolve({ ok: false, status: 401 } as Response);
}

import { RHProvider, useRH, RHContext } from '@/app/rh/rh-context';

// Componente auxiliar para inspecionar o contexto
function ContextInspector() {
  const ctx = useRH();
  return (
    <div>
      <span data-testid="nome">{ctx.session?.nome ?? 'null'}</span>
      <span data-testid="empresas">{ctx.counts.empresas}</span>
      <span data-testid="notificacoes">{ctx.counts.notificacoes}</span>
      <span data-testid="laudos">{ctx.counts.laudos}</span>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
    </div>
  );
}

describe('RHContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('useRH retorna default value fora do provider', () => {
    const { getByTestId } = render(<ContextInspector />);
    expect(getByTestId('nome').textContent).toBe('null');
    expect(getByTestId('empresas').textContent).toBe('0');
    expect(getByTestId('loading').textContent).toBe('true');
  });

  it('RHContext.Provider disponibiliza values customizados', () => {
    const customValue = {
      session: { nome: 'Test', perfil: 'rh' } as Parameters<
        typeof RHContext.Provider
      >[0]['value']['session'],
      counts: { empresas: 5, notificacoes: 3, laudos: 2 },
      isLoading: false,
      reloadCounts: jest.fn(),
    };

    const { getByTestId } = render(
      <RHContext.Provider value={customValue}>
        <ContextInspector />
      </RHContext.Provider>
    );

    expect(getByTestId('nome').textContent).toBe('Test');
    expect(getByTestId('empresas').textContent).toBe('5');
    expect(getByTestId('notificacoes').textContent).toBe('3');
    expect(getByTestId('laudos').textContent).toBe('2');
    expect(getByTestId('loading').textContent).toBe('false');
  });

  it('RHProvider redireciona para /login quando sessão inválida', async () => {
    mockFetch.mockReturnValueOnce(makeUnauthorized());

    render(
      <RHProvider>
        <ContextInspector />
      </RHProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('RHProvider redireciona para /dashboard quando perfil incorreto', async () => {
    mockFetch.mockReturnValueOnce(
      makeSessionFetch({ cpf: '000', nome: 'Wrong', perfil: 'gestor' })
    );

    render(
      <RHProvider>
        <ContextInspector />
      </RHProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('RHProvider redireciona quando termos não aceitos (perfil rh)', async () => {
    mockFetch
      .mockReturnValueOnce(makeSessionFetch(SESSION_RH))
      .mockReturnValueOnce(makeTermosFetch(false));

    render(
      <RHProvider>
        <ContextInspector />
      </RHProvider>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login?motivo=termos_pendentes');
    });
  });

  it('RHProvider admin não verifica termos e carrega contadores', async () => {
    mockFetch
      .mockReturnValueOnce(makeSessionFetch(SESSION_ADMIN))
      .mockReturnValueOnce(makeCountsFetch([{ id: 1 }, { id: 2 }])) // empresas
      .mockReturnValueOnce(makeCountsFetch({ laudos: [{ id: 1 }] })) // laudos
      .mockReturnValueOnce(
        makeCountsFetch({ totalNaoLidas: 4, notificacoes: [] })
      ); // notificacoes

    render(
      <RHProvider>
        <ContextInspector />
      </RHProvider>
    );

    await waitFor(() => {
      // Não deve ter redirecionado para termos
      const termosCalls = mockFetch.mock.calls.filter(
        (call: unknown[]) =>
          typeof call[0] === 'string' && call[0].includes('termos')
      );
      expect(termosCalls.length).toBe(0);
    });
  });
});
