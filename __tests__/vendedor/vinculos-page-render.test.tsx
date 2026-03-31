/**
 * @file __tests__/vendedor/vinculos-page-render.test.tsx
 *
 * Testes: VinculosVendedor — renderização básica e comportamento de estados
 *
 * CONTEXTO:
 * As variáveis `setErro` e `setSucesso` foram identificadas como mortas
 * (declaradas mas nunca chamadas). Os banners de erro/sucesso na UI nunca
 * serão exibidos enquanto os setters permanecerem sem chamadores.
 * Estes testes documentam esse comportamento e garantem que o componente
 * não crashe por causa disso.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import VinculosVendedor from '@/app/vendedor/(portal)/vinculos/page';

// ── helpers de mock ──────────────────────────────────────────────────────────

function mockFetchEmpty() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ vinculos: [], total: 0 }),
  } as any);
}

function mockFetchWithData() {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      vinculos: [
        {
          id: 1,
          entidade_nome: 'Empresa Teste LTDA',
          entidade_cnpj: '12345678000195',
          status: 'ativo',
          data_inicio: '2026-01-01T00:00:00Z',
          data_expiracao: '2027-01-01T00:00:00Z',
          dias_para_expirar: 300,
          ultimo_laudo_em: null,
          lead_valor_negociado: null,
          lead_contato_nome: null,
          lead_contato_email: null,
          lead_criado_em: null,
          lead_data_conversao: null,
        },
      ],
      total: 1,
    }),
  } as any);
}

// ── Testes ───────────────────────────────────────────────────────────────────

describe('VinculosVendedor — renderização básica', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchEmpty();
  });

  it('deve renderizar sem erros (componente monta)', async () => {
    // Arrange / Act
    const { container } = render(<VinculosVendedor />);
    // Assert
    expect(container).toBeDefined();
  });

  it('deve mostrar título "Meus Vínculos de Clientes"', async () => {
    render(<VinculosVendedor />);
    await waitFor(() =>
      expect(screen.getByText('Meus Vínculos de Clientes')).toBeInTheDocument()
    );
  });

  it('deve chamar fetch na montagem com rota /api/vendedor/vinculos', async () => {
    render(<VinculosVendedor />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(String(url)).toContain('/api/vendedor/vinculos');
    });
  });

  it('deve passar parâmetro page=1 para a primeira requisição', async () => {
    render(<VinculosVendedor />);
    await waitFor(() => {
      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(String(url)).toMatch(/page=1/);
    });
  });
});

describe('VinculosVendedor — banners de erro e sucesso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchEmpty();
  });

  it('banner de erro NÃO é exibido por padrão (setErro nunca é chamado)', async () => {
    // CONTEXTO: _setErro é um setter morto — o banner de erro não tem como
    // aparecer até que um chamador de _setErro seja implementado.
    render(<VinculosVendedor />);
    await waitFor(() =>
      expect(
        screen.queryByText(/bg-red-50|text-red-700/i)
      ).not.toBeInTheDocument()
    );
    // Confirma ausência pelo conteúdo: nenhum texto de erro visível
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('banner de sucesso NÃO é exibido por padrão (_setSucesso nunca é chamado)', async () => {
    render(<VinculosVendedor />);
    // Se houver texto de sucesso visível, o setter teria sido chamado indevidamente
    await waitFor(() => {
      const successDiv = document.querySelector(
        '.bg-green-50.border-green-200'
      );
      expect(successDiv).toBeNull();
    });
  });

  it('quando fetch falha (ok: false), NÃO exibe banner de erro — silencioso', async () => {
    // Documenta o comportamento atual: a API de fetch falhando retorna silenciosamente
    // pois `if (!res.ok) return;` não chama _setErro
    global.fetch = jest.fn().mockResolvedValue({ ok: false } as any);
    render(<VinculosVendedor />);
    // Aguarda fim do loading
    await waitFor(() => {
      expect(
        screen.queryByText('Meus Vínculos de Clientes')
      ).toBeInTheDocument();
    });
    // Nenhum banner de erro
    expect(document.querySelector('.bg-red-50')).toBeNull();
  });
});

describe('VinculosVendedor — lista de vínculos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve mostrar "Nenhum vínculo encontrado" quando lista está vazia', async () => {
    mockFetchEmpty();
    render(<VinculosVendedor />);
    await waitFor(() =>
      expect(screen.getByText('Nenhum vínculo encontrado')).toBeInTheDocument()
    );
  });

  it('deve exibir nome da entidade quando há vínculos', async () => {
    mockFetchWithData();
    render(<VinculosVendedor />);
    await waitFor(() =>
      expect(screen.getByText('Empresa Teste LTDA')).toBeInTheDocument()
    );
  });

  it('deve exibir o total de vínculos no cabeçalho', async () => {
    mockFetchWithData();
    render(<VinculosVendedor />);
    await waitFor(() =>
      expect(screen.getByText('1 vínculo')).toBeInTheDocument()
    );
  });
});

describe('VinculosVendedor — filtros de status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchEmpty();
  });

  it('deve renderizar botões de filtro: Todos, Ativo, Inativo, Suspenso, Encerrado', async () => {
    render(<VinculosVendedor />);
    await waitFor(() => {
      expect(screen.getByText('Todos')).toBeInTheDocument();
      expect(screen.getByText('Ativo')).toBeInTheDocument();
      expect(screen.getByText('Inativo')).toBeInTheDocument();
      expect(screen.getByText('Suspenso')).toBeInTheDocument();
      expect(screen.getByText('Encerrado')).toBeInTheDocument();
    });
  });
});
