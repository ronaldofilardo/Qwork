/**
 * @file __tests__/components/admin/AuditoriasContent.test.tsx
 * Testes: AuditoriasContent
 *
 * Garante que:
 *  1. As 7 sub-tabs de auditoria são renderizadas corretamente
 *  2. Aba padrão inicial é "Gestores"
 *  3. NÃO há auto-fetch ao montar o componente (dados carregam apenas via Atualizar)
 *  4. Clicar em "Atualizar" na aba ativa dispara fetch com endpoint correto
 *  5. Navegar para outra aba não causa fetch automático
 *  6. Clicar em "Atualizar" após navegar carrega dados da nova aba
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
    mockFetchWith({ gestores: [] });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve renderizar as 7 sub-tabs de auditoria', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });
    expect(screen.getByText('Gestores')).toBeInTheDocument();
    expect(screen.getByText('Avaliações')).toBeInTheDocument();
    expect(screen.getByText('Lotes')).toBeInTheDocument();
    expect(screen.getByText('Laudos')).toBeInTheDocument();
    expect(screen.getByText('Operacionais')).toBeInTheDocument();
    expect(screen.getByText('Aceites')).toBeInTheDocument();
    expect(screen.getByText('Deleção')).toBeInTheDocument();
  });

  it('deve exibir título "Auditorias"', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });
    expect(screen.getByText('Auditorias')).toBeInTheDocument();
  });

  it('NÃO deve chamar fetch ao montar o componente', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve chamar fetch com endpoint de gestores ao clicar em Atualizar na aba Gestores', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });

    mockFetchWith({ gestores: [] });

    // Aba Gestores é a inicial — o botão "Atualizar" dentro de TabelaGestores deve estar visível
    const btnAtualizar = screen.getByText('Atualizar');
    await act(async () => {
      fireEvent.click(btnAtualizar);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gestores'),
        expect.anything()
      );
    });
  });

  it('deve NÃO chamar fetch automaticamente ao trocar para aba Laudos', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Laudos'));
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve chamar fetch com endpoint de laudos ao clicar Atualizar na aba Laudos', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });

    // Navegar para Laudos
    await act(async () => {
      fireEvent.click(screen.getByText('Laudos'));
    });

    mockFetchWith({ laudos: [] });

    // Clicar em Atualizar dentro de TabelaLaudos
    const btnAtualizar = screen.getByText('Atualizar');
    await act(async () => {
      fireEvent.click(btnAtualizar);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('laudos'),
        expect.anything()
      );
    });
  });

  it('deve chamar fetch com endpoint de aceites ao clicar Atualizar na aba Aceites', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Aceites'));
    });

    mockFetchWith({ aceites: [] });

    const btnAtualizar = screen.getByText('Atualizar');
    await act(async () => {
      fireEvent.click(btnAtualizar);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('aceites'),
        expect.anything()
      );
    });
  });

  it('deve exibir botão "Atualizar" na aba ativa', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });
    expect(screen.getByText('Atualizar')).toBeInTheDocument();
  });

  it('deve exibir erro na UI quando fetch retorna erro', async () => {
    await act(async () => {
      render(<AuditoriasContent />);
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Acesso negado' }),
    }) as jest.Mock;

    await act(async () => {
      fireEvent.click(screen.getByText('Atualizar'));
    });

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar dados/)).toBeInTheDocument();
    });
  });
});

