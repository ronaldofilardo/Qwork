/**
 * @file __tests__/vendedor/dados-page-render.test.tsx
 *
 * Testes de renderização: VendedorDadosPage — ausência de seção Dados Bancários
 *
 * CONTEXTO (30/03/2026):
 * A UI do vendedor (dados/page.tsx) teve a seção "Dados Bancários" removida.
 * A rota /api/vendedor/dados/bancarios continua existindo no backend.
 * Esta página agora realiza apenas um fetch para /api/vendedor/dados e
 * exibe somente os dados pessoais (Nome, CPF, Email, Telefone).
 *
 * Cobre:
 * - Heading "Meus Dados" renderiza
 * - Heading "Dados Bancários" NÃO está no documento
 * - Botões "Adicionar Dados Bancários" / "Editar Dados Bancários" NÃO existem
 * - Dados pessoais (Nome, CPF, Email, Telefone) aparecem
 * - Apenas UM fetch é realizado (sem chamada a /bancarios)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import VendedorDadosPage from '@/app/vendedor/(portal)/dados/page';

// ── helpers de mock ──────────────────────────────────────────────────────────

const USUARIO_MOCK = {
  id: 7,
  cpf: '12345678901',
  nome: 'Vendedor Teste',
  email: 'vendedor@teste.com',
  telefone: '11999999999',
  ativo: true,
  criado_em: '2026-01-15T00:00:00Z',
};

function mockFetchDados() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ usuario: USUARIO_MOCK }),
  } as any);
}

// ── testes ───────────────────────────────────────────────────────────────────

describe('VendedorDadosPage — renderização básica', () => {
  test('exibe heading "Meus Dados" após carregar', async () => {
    mockFetchDados();
    render(<VendedorDadosPage />);

    await waitFor(() =>
      expect(screen.getByText('Meus Dados')).toBeInTheDocument()
    );
  });

  test('exibe rótulo "Nome" com o valor do usuário', async () => {
    mockFetchDados();
    render(<VendedorDadosPage />);

    await waitFor(() =>
      expect(screen.getByText('Vendedor Teste')).toBeInTheDocument()
    );

    expect(screen.getByText('Nome')).toBeInTheDocument();
  });

  test('exibe rótulos Email e Telefone (campos editáveis)', async () => {
    mockFetchDados();
    render(<VendedorDadosPage />);

    await waitFor(() =>
      expect(screen.getByText('Meus Dados')).toBeInTheDocument()
    );

    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Telefone')).toBeInTheDocument();
  });
});

describe('VendedorDadosPage — ausência da seção Dados Bancários', () => {
  test('NÃO exibe heading "Dados Bancários"', async () => {
    mockFetchDados();
    render(<VendedorDadosPage />);

    await waitFor(() =>
      expect(screen.getByText('Meus Dados')).toBeInTheDocument()
    );

    expect(screen.queryByText(/Dados Banc[aá]rios/i)).not.toBeInTheDocument();
  });

  test('NÃO exibe botão "Adicionar Dados Bancários"', async () => {
    mockFetchDados();
    render(<VendedorDadosPage />);

    await waitFor(() =>
      expect(screen.getByText('Meus Dados')).toBeInTheDocument()
    );

    expect(
      screen.queryByText(/Adicionar Dados Banc[aá]rios/i)
    ).not.toBeInTheDocument();
  });

  test('NÃO exibe botão "Editar Dados Bancários"', async () => {
    mockFetchDados();
    render(<VendedorDadosPage />);

    await waitFor(() =>
      expect(screen.getByText('Meus Dados')).toBeInTheDocument()
    );

    expect(
      screen.queryByText(/Editar Dados Banc[aá]rios/i)
    ).not.toBeInTheDocument();
  });

  test('realiza apenas 1 fetch (sem chamar /api/vendedor/dados/bancarios)', async () => {
    mockFetchDados();
    render(<VendedorDadosPage />);

    await waitFor(() =>
      expect(screen.getByText('Meus Dados')).toBeInTheDocument()
    );

    const calls = (global.fetch as jest.Mock).mock.calls;
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe('/api/vendedor/dados');

    const calledBancarios = calls.some(([url]: [string]) =>
      String(url).includes('bancarios')
    );
    expect(calledBancarios).toBe(false);
  });
});
