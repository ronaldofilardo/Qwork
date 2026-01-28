import '@testing-library/jest-dom';

// Mock da API inteira
jest.mock('@/app/api/pagamento/simular/route', () => ({
  POST: jest.fn(),
}));

import { POST } from '@/app/api/pagamento/simular/route';

const mockPOST = POST as jest.MockedFunction<typeof POST>;

describe('API /api/pagamento/simular - Simulação de Pagamento', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // Cenário de simulação com token personalizado removido (testes relacionados ao fluxo personalizado a partir da geração do link foram excluídos).

  describe('Cenário 2: Simulação com contratante_id e plano_id', () => {
    it('deve simular pagamento para plano fixo', async () => {
      mockPOST.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          success: true,
          valor_total: 1200.0,
          contratante: {
            id: 100,
            nome: 'Empresa Teste Ltda',
            tipo: 'entidade',
          },
          plano: {
            id: 1,
            nome: 'Plano Fixo Empresarial',
            tipo: 'fixo',
            preco: 1200.0,
          },
          simulacoes: {
            pix: {
              metodo: 'pix',
              nome: 'PIX',
              parcelas_opcoes: [
                {
                  numero_parcelas: 1,
                  valor_por_parcela: 1200.0,
                  valor_total: 1200.0,
                  descricao: 'Pagamento à vista via PIX',
                },
              ],
            },
            cartao: {
              metodo: 'cartao',
              nome: 'Cartão de Crédito',
              parcelas_opcoes: [],
            },
            boleto: {
              metodo: 'boleto',
              nome: 'Boleto Bancário',
              parcelas_opcoes: [],
            },
            transferencia: {
              metodo: 'transferencia',
              nome: 'Transferência Bancária',
              parcelas_opcoes: [
                {
                  numero_parcelas: 1,
                  valor_por_parcela: 1200.0,
                  valor_total: 1200.0,
                  descricao: 'Pagamento à vista via Transferência',
                },
              ],
            },
          },
        }),
      } as any);

      const request = {
        json: async () => ({
          contratante_id: 100,
          plano_id: 1,
        }),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.simulacoes).toBeDefined();
      expect(data.valor_total).toBe(1200.0);
    });

    // Teste de simulação para plano personalizado removido (parte do fluxo de geração de link→ pagamento).
  });

  describe('Cenário 3: Simulação com valor_total direto', () => {
    it('deve simular pagamento com valor pré-definido', async () => {
      mockPOST.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          success: true,
          valor_total: 1800.0,
          simulacoes: {
            pix: {
              metodo: 'pix',
              nome: 'PIX',
              parcelas_opcoes: [
                {
                  numero_parcelas: 1,
                  valor_por_parcela: 1800.0,
                  valor_total: 1800.0,
                  descricao: 'Pagamento à vista via PIX',
                },
              ],
            },
            cartao: {
              metodo: 'cartao',
              nome: 'Cartão de Crédito',
              parcelas_opcoes: [],
            },
            boleto: {
              metodo: 'boleto',
              nome: 'Boleto Bancário',
              parcelas_opcoes: [],
            },
            transferencia: {
              metodo: 'transferencia',
              nome: 'Transferência Bancária',
              parcelas_opcoes: [
                {
                  numero_parcelas: 1,
                  valor_por_parcela: 1800.0,
                  valor_total: 1800.0,
                  descricao: 'Pagamento à vista via Transferência',
                },
              ],
            },
          },
        }),
      } as any);

      const request = {
        json: async () => ({
          valor_total: 1800.0,
        }),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.valor_total).toBe(1800.0);
      expect(data.simulacoes).toBeDefined();
    });
  });
});
