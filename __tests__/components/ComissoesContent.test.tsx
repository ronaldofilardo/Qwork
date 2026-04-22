/**
 * @fileoverview Testes do componente ComissoesContent (admin)
 */
import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import { ComissoesContent } from '@/components/admin/ComissoesContent';

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

jest.spyOn(console, 'error').mockImplementation(() => {});

const mockResumo = {
  total_comissoes: '50',
  pendentes_consolidacao: '3',
  liberadas: '5',
  pagas: '30',
  congeladas: '2',
  valor_a_pagar: '1500.00',
  valor_pago_total: '30000.00',
};

const mockComissao = {
  id: 1,
  representante_id: 42,
  representante_nome: 'Carlos Rep',
  representante_email: 'rep@test.dev',
  representante_tipo_pessoa: 'pf',
  entidade_nome: 'Empresa Z',
  lote_pagamento_id: null,
  lote_pagamento_metodo: null,
  lote_pagamento_parcelas: null,
  valor_laudo: '10000.00',
  valor_comissao: '500.00',
  percentual_comissao: '5.00',
  parcela_numero: 1,
  total_parcelas: 1,
  status: 'pendente_consolidacao',
  motivo_congelamento: null,
  mes_emissao: '2026-01-01',
  mes_pagamento: '2026-02-01',
  data_emissao_laudo: '2026-01-15',
  data_aprovacao: null,
  data_liberacao: null,
  data_pagamento: null,
  comprovante_pagamento_path: null,
};

function mockAPIResponse(
  comissoes = [mockComissao],
  resumo = mockResumo,
  total = 1
) {
  return {
    ok: true,
    json: () =>
      Promise.resolve({ comissoes, total, page: 1, limit: 30, resumo }),
  } as Response;
}

function mockAPIError(status = 500) {
  return {
    ok: false,
    status,
    json: () => Promise.resolve({ error: 'Erro interno do servidor' }),
  } as unknown as Response;
}

describe('ComissoesContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it('deve exibir loading inicialmente', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));
    render(<ComissoesContent />);
    expect(
      document.querySelector('.animate-spin') ||
        document.querySelector('.animate-pulse')
    ).toBeTruthy();
  });

  it('deve renderizar cards de resumo', async () => {
    mockFetch.mockResolvedValueOnce(mockAPIResponse());

    render(<ComissoesContent />);

    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(
        text.includes('30.000') || text.includes('30000') || text.includes('30')
      ).toBe(true);
    });
  });

  it('deve renderizar lista de comissoes', async () => {
    mockFetch.mockResolvedValueOnce(mockAPIResponse());

    render(<ComissoesContent />);

    await waitFor(() => {
      expect(screen.getByText(/Carlos Rep/i)).toBeInTheDocument();
    });
  });

  it('deve exibir badge de status da comissao (pendente_consolidacao exibe No Ciclo)', async () => {
    mockFetch.mockResolvedValueOnce(mockAPIResponse());

    render(<ComissoesContent />);

    await waitFor(() => {
      // status 'pendente_consolidacao' eh renderizado como label 'No Ciclo' pelo componente
      expect(screen.getByText(/No Ciclo/i)).toBeInTheDocument();
    });
  });

  it('deve mostrar nome da entidade', async () => {
    mockFetch.mockResolvedValueOnce(mockAPIResponse());

    render(<ComissoesContent />);

    await waitFor(() => {
      expect(screen.getByText(/Empresa Z/i)).toBeInTheDocument();
    });
  });

  it('deve mostrar mensagem quando lista esta vazia', async () => {
    mockFetch.mockResolvedValueOnce(mockAPIResponse([], mockResumo, 0));

    render(<ComissoesContent />);

    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(
        text.includes('Nenhuma') ||
          text.includes('nenhuma') ||
          text.includes('vazio')
      ).toBe(true);
    });
  });

  it('deve exibir erro quando API retorna 500', async () => {
    mockFetch.mockResolvedValueOnce(mockAPIError(500));

    render(<ComissoesContent />);

    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(
        text.includes('erro') ||
          text.includes('Erro') ||
          text.includes('falha') ||
          text.includes('Falha')
      ).toBe(true);
    });
  });
});
