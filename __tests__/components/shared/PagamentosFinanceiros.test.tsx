/**
 * @file __tests__/components/shared/PagamentosFinanceiros.test.tsx
 * Testes: componente PagamentosFinanceiros
 * Cobre: estado loading, estado vazio melhorado, estado de erro com retry, lista de pagamentos
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PagamentosFinanceiros from '@/components/shared/PagamentosFinanceiros';

// Mock do ModalRecibo para isolar o componente
jest.mock('@/components/shared/ModalRecibo', () => {
  return function MockModalRecibo({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="modal-recibo">
        <button onClick={onClose}>Fechar</button>
      </div>
    );
  };
});

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

const fakePagamento = {
  id: 1,
  valor: 1500,
  metodo: 'pix',
  status: 'pago',
  numeroParcelas: 1,
  detalhesParcelas: null,
  numeroFuncionarios: 10,
  valorPorFuncionario: 150,
  reciboNumero: 'REC-001',
  reciboUrl: null,
  dataPagamento: '2026-03-01T00:00:00Z',
  dataConfirmacao: '2026-03-01T00:00:00Z',
  criadoEm: '2026-03-01T00:00:00Z',
  loteId: null,
  loteCodigo: null,
  loteNumero: null,
  laudoId: null,
};

describe('PagamentosFinanceiros', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Loading ──────────────────────────────────────────────────────────────

  it('deve exibir spinner e texto de carregamento durante fetch', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // nunca resolve

    render(
      <PagamentosFinanceiros
        apiUrl="/api/test"
        organizacaoNome="Empresa Teste"
      />
    );

    expect(screen.getByText('Carregando pagamentos...')).toBeInTheDocument();
  });

  // ── Estado vazio ─────────────────────────────────────────────────────────

  it('deve exibir mensagem "Nenhum pagamento registrado" quando lista vazia', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pagamentos: [] }),
    } as Response);

    render(
      <PagamentosFinanceiros
        apiUrl="/api/test"
        organizacaoNome="Empresa Teste"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Nenhum pagamento registrado')
      ).toBeInTheDocument();
    });
  });

  it('deve exibir descrição contextual sobre o primeiro ciclo no estado vazio', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pagamentos: [] }),
    } as Response);

    render(
      <PagamentosFinanceiros
        apiUrl="/api/test"
        organizacaoNome="Empresa Teste"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/primeiro ciclo/i)).toBeInTheDocument();
    });
  });

  // ── Estado de erro ────────────────────────────────────────────────────────

  it('deve exibir mensagem de erro e botão "Tentar novamente" quando fetch lança erro', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));

    render(
      <PagamentosFinanceiros
        apiUrl="/api/test"
        organizacaoNome="Empresa Teste"
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('Erro ao carregar dados financeiros.')
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
  });

  it('deve exibir botão "Tentar novamente" quando API retorna status não-ok', async () => {
    mockFetch.mockResolvedValue({ ok: false } as Response);

    render(
      <PagamentosFinanceiros
        apiUrl="/api/test"
        organizacaoNome="Empresa Teste"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
    });
  });

  it('botão "Tentar novamente" deve re-executar o carregamento', async () => {
    mockFetch.mockRejectedValueOnce(new Error('fail')).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ pagamentos: [] }),
    } as Response);

    render(
      <PagamentosFinanceiros
        apiUrl="/api/test"
        organizacaoNome="Empresa Teste"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Tentar novamente')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Tentar novamente'));

    await waitFor(() => {
      expect(
        screen.getByText('Nenhum pagamento registrado')
      ).toBeInTheDocument();
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // ── Lista de pagamentos ───────────────────────────────────────────────────

  it('deve exibir quantidade de registros no subtítulo quando há pagamentos', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pagamentos: [fakePagamento] }),
    } as Response);

    render(
      <PagamentosFinanceiros
        apiUrl="/api/test"
        organizacaoNome="Empresa Teste"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/1 registro/i)).toBeInTheDocument();
    });
  });

  it('deve exibir "N registros" (plural) quando há múltiplos pagamentos', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          pagamentos: [fakePagamento, { ...fakePagamento, id: 2 }],
        }),
    } as Response);

    render(
      <PagamentosFinanceiros
        apiUrl="/api/test"
        organizacaoNome="Empresa Teste"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/2 registros/i)).toBeInTheDocument();
    });
  });

  // ── Renderização de Laudo nº (sem Lote) ──────────────────────────────

  it('deve exibir "Laudo nº:" quando laudoId está presente', async () => {
    const pagamentoComLaudo = {
      ...fakePagamento,
      laudoId: 42,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pagamentos: [pagamentoComLaudo] }),
    } as Response);

    render(
      <PagamentosFinanceiros
        apiUrl="/api/test"
        organizacaoNome="Empresa Teste"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Laudo nº:')).toBeInTheDocument();
      expect(screen.getByText('000042')).toBeInTheDocument();
    });
  });

  it('não deve exibir "Lote:" quando loteNumero está presente', async () => {
    const pagamentoComLote = {
      ...fakePagamento,
      loteId: 10,
      loteCodigo: 'ABC123',
      loteNumero: 5,
      laudoId: 42,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pagamentos: [pagamentoComLote] }),
    } as Response);

    render(
      <PagamentosFinanceiros
        apiUrl="/api/test"
        organizacaoNome="Empresa Teste"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/^Lote:/)).not.toBeInTheDocument();
      expect(screen.getByText('Laudo nº:')).toBeInTheDocument();
    });
  });

  it('não deve exibir nada quando nem laudoId nem loteId estão presentes', async () => {
    const pagementoSemReferencia = {
      ...fakePagamento,
      laudoId: null,
      loteId: null,
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ pagamentos: [pagementoSemReferencia] }),
    } as Response);

    render(
      <PagamentosFinanceiros
        apiUrl="/api/test"
        organizacaoNome="Empresa Teste"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Laudo nº:')).not.toBeInTheDocument();
      expect(screen.queryByText(/^Lote:/)).not.toBeInTheDocument();
    });
  });
});
