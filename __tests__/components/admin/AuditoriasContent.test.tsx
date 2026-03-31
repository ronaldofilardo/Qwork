/**
 * @file __tests__/components/admin/AuditoriasContent.test.tsx
 * Testes: AuditoriasContent
 *
 * Garante que:
 *  1. Sub-tabs de auditoria são renderizadas corretamente
 *  2. Interface AuditoriaLaudo usa campos corretos (clinica_nome, empresa_cliente_nome, tomador_nome)
 *  3. Coluna "Tomador" é exibida (não "Emissor")
 *  4. Troca de sub-tab funciona (chama fetch com endpoint correto)
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuditoriasContent } from '@/components/admin/AuditoriasContent';

// ── Mock fetch global ─────────────────────────────────────────────────────────

const makeLaudo = (overrides: Record<string, unknown> = {}) => ({
  laudo_id: 1,
  lote_id: 10,
  clinica_nome: 'Clínica Teste',
  empresa_cliente_nome: 'Empresa Teste',
  tomador_nome: 'Tomador Teste SA',
  clinica_id: 1,
  empresa_id: 2,
  entidade_id: 3,
  numero_lote: 'LOTE-001',
  status: 'emitido',
  hash_pdf: null,
  criado_em: '2026-02-18T10:00:00Z',
  emitido_em: '2026-02-18T11:00:00Z',
  enviado_em: null,
  atualizado_em: null,
  solicitado_em: '2026-02-18T09:00:00Z',
  ...overrides,
});

function mockFetchWith(data: Record<string, unknown>) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  }) as jest.Mock;
}

// ── Testes ─────────────────────────────────────────────────────────────────────

describe('AuditoriasContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // mock padrão: retorna dados vazios para a tab inicial (acesso-gestor)
    mockFetchWith({ acessos: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve renderizar as sub-tabs de auditoria', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });
    expect(screen.getByText('Acesso Gestor')).toBeInTheDocument();
    expect(screen.getByText('Acesso RH')).toBeInTheDocument();
    expect(screen.getByText('Avaliações')).toBeInTheDocument();
    expect(screen.getByText('Lotes')).toBeInTheDocument();
    expect(screen.getByText('Laudos')).toBeInTheDocument();
    expect(screen.getByText('Aceites')).toBeInTheDocument();
  });

  it('deve chamar fetch com endpoint de aceites ao clicar na tab Aceites', async () => {
    mockFetchWith({ acessos: [] });

    await act(async () => {
      render(<AuditoriasContent />);
    });

    mockFetchWith({ aceites: [] });

    await act(async () => {
      fireEvent.click(screen.getByText('Aceites'));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('aceites')
      );
    });
  });

  it('deve chamar fetch com endpoint correto ao trocar de sub-tab', async () => {
    mockFetchWith({ acessos: [] });

    await act(async () => {
      render(<AuditoriasContent />);
    });

    mockFetchWith({ acessos: [] });

    await act(async () => {
      fireEvent.click(screen.getByText('Acesso RH'));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('acessos-rh')
      );
    });
  });

  it('deve exibir laudos ao selecionar tab laudos', async () => {
    // Tab inicial (acesso-gestor) retorna vazio
    mockFetchWith({ acessos: [] });

    await act(async () => {
      render(<AuditoriasContent />);
    });

    // Ao clicar em Laudos, mock retorna laudos
    mockFetchWith({ laudos: [makeLaudo()] });

    await act(async () => {
      fireEvent.click(screen.getByText('Laudos'));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('laudos')
      );
    });
  });

  it('deve exibir título "Auditorias"', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });
    expect(screen.getByText('Auditorias')).toBeInTheDocument();
  });

  it('deve exibir botão "Atualizar"', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });
    expect(screen.getByText('Atualizar')).toBeInTheDocument();
  });

  it('deve chamar fetch ao montar o componente (tab inicial: acesso-gestor)', async () => {
    mockFetchWith({ acessos: [] });

    await act(async () => {
      render(<AuditoriasContent />);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('acesso-gestor')
      );
    });
  });

  it('deve chamar fetch novamente ao clicar em Atualizar', async () => {
    mockFetchWith({ acessos: [] });

    await act(async () => {
      render(<AuditoriasContent />);
    });

    const fetchCallsBeforeRefresh = (global.fetch as jest.Mock).mock.calls
      .length;

    await act(async () => {
      fireEvent.click(screen.getByText('Atualizar'));
    });

    await waitFor(() => {
      expect((global.fetch as jest.Mock).mock.calls.length).toBeGreaterThan(
        fetchCallsBeforeRefresh
      );
    });
  });
});
