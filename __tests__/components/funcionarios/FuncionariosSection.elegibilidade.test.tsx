import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FuncionariosSection from '@/components/funcionarios/FuncionariosSection';

// Mock fetch
global.fetch = jest.fn();

describe('FuncionariosSection - elegibilidade visual', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mostra badge de "Avaliação válida" mesmo quando ultima_avaliacao_status = inativada', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        funcionarios: [
          {
            cpf: '15226398964',
            nome: 'Thiago Rocha',
            email: 'thiago.rocha@qwork.com',
            setor: 'Operacional',
            funcao: 'Assistente',
            nivel_cargo: 'operacional',
            ativo: true,
            ultimo_lote_codigo: '001-050126',
            ultima_avaliacao_status: 'inativada',
            ultima_avaliacao_data_conclusao: '2026-01-04T16:06:15.385Z',
            data_ultimo_lote: '2026-01-04T16:04:48.265Z',
            tem_avaliacao_recente: true,
          },
        ],
      }),
    });

    render(
      <FuncionariosSection contexto="entidade" defaultStatusFilter="ativos" />
    );

    await waitFor(() => {
      expect(screen.getByText('Funcionários Ativos')).toBeInTheDocument();
    });

    // O badge de avaliação válida deve estar presente
    await waitFor(() => {
      expect(screen.getByText(/✓ Avaliação válida/)).toBeInTheDocument();
    });

    // Deve mostrar o badge de avaliação válida e a data dentro do badge
    const badge = screen.getByText(/✓ Avaliação válida/);
    expect(badge).toBeInTheDocument();
    expect(badge.textContent).toContain('04/01/2026');
  });

  it('mostra aviso de elegibilidade quando só inativadas (sem data de conclusão) e índice > 0', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        funcionarios: [
          {
            cpf: '99999999999',
            nome: 'Inativada Somente',
            email: 'inativada@test.com',
            setor: 'Operacional',
            funcao: 'Analista',
            nivel_cargo: 'operacional',
            ativo: true,
            ultimo_lote_codigo: null,
            ultima_avaliacao_status: 'inativada',
            ultima_avaliacao_data_conclusao: null,
            data_ultimo_lote: null,
            ultima_inativacao_em: '2026-01-10T10:00:00Z',
            ultima_inativacao_lote: '003-240126',
            ultimo_motivo_inativacao: 'Teste motivo',
            tem_avaliacao_recente: false,
            indice_avaliacao: 1,
          },
        ],
      }),
    });

    render(
      <FuncionariosSection contexto="entidade" defaultStatusFilter="ativos" />
    );

    await waitFor(() => {
      expect(screen.getByText('Funcionários Ativos')).toBeInTheDocument();
    });

    // Deve mostrar badge de elegibilidade
    await waitFor(() => {
      expect(screen.getByText(/Elegível/)).toBeInTheDocument();
    });

    // Deve mostrar a informação de Inativada com lote
    await waitFor(() => {
      expect(screen.getByText(/Inativada \(003-240126\)/)).toBeInTheDocument();
    });
  });
});
