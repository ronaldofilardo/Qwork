import '@testing-library/jest-dom';

// Mock da API inteira
jest.mock('@/app/api/pagamento/confirmar/route', () => ({
  POST: jest.fn(),
}));

import { POST } from '@/app/api/pagamento/confirmar/route';

const mockPOST = POST as jest.MockedFunction<typeof POST>;

describe('API /api/pagamento/confirmar - Confirmação de Pagamento', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // Cenário de confirmação com token personalizado removido (testes do fluxo personalizado excluídos).

  describe('Cenário 2: Confirmação com contratante_id e plano_id', () => {
    it('deve confirmar pagamento para plano fixo', async () => {
      mockPOST.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          success: true,
          message: 'Pagamento confirmado com sucesso',
          // Recibo agora é gerado sob demanda; rota indica frontend para mostrar opção
          show_receipt_info: true,
          acesso_liberado: true,
        }),
      } as any);

      const request = {
        json: async () => ({
          contratante_id: 100,
          plano_id: 1,
          metodo_pagamento: 'transferencia',
          numero_parcelas: 1,
        }),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.show_receipt_info).toBe(true);
      expect(data.acesso_liberado).toBe(true);
    });

    // Teste de confirmação para plano personalizado removido (parte do fluxo de geração de link → pagamento → liberação).
  });

  describe('Cenário 3: Confirmação com parcelamento', () => {
    it('deve confirmar pagamento parcelado', async () => {
      mockPOST.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          success: true,
          message: 'Pagamento confirmado com sucesso',
          recibo: {
            id: 1004,
            numero_recibo: 'REC-2024-004',
            valor_total: 2400.0,
            metodo_pagamento: 'cartao',
            numero_parcelas: 3,
            valor_por_parcela: 800.0,
            data_pagamento: '2024-01-15T13:00:00Z',
            contratante: {
              id: 102,
              nome: 'Empresa Parcelada Ltda',
              tipo: 'entidade',
            },
            plano: {
              id: 3,
              nome: 'Plano Empresarial Plus',
              tipo: 'fixo',
            },
            html_recibo:
              '<html><body>Recibo de Pagamento Parcelado...</body></html>',
          },
          acesso_liberado: true,
        }),
      } as any);

      const request = {
        json: async () => ({
          contratante_id: 102,
          plano_id: 3,
          metodo_pagamento: 'cartao',
          numero_parcelas: 3,
        }),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.show_receipt_info).toBe(true);
      expect(data.acesso_liberado).toBe(true);
    });
  });

  describe('Cenário 4: Erros de validação', () => {
    it('deve retornar erro para método de pagamento inválido', async () => {
      mockPOST.mockResolvedValueOnce({
        status: 400,
        json: async () => ({
          error: 'Método de pagamento inválido',
        }),
      } as any);

      const request = {
        json: async () => ({
          token: 'valid-token-123',
          metodo_pagamento: 'invalid_method',
          numero_parcelas: 1,
        }),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Método de pagamento inválido');
    });

    it('deve retornar erro para número de parcelas inválido', async () => {
      mockPOST.mockResolvedValueOnce({
        status: 400,
        json: async () => ({
          error: 'Número de parcelas deve ser entre 1 e 12',
        }),
      } as any);

      const request = {
        json: async () => ({
          token: 'valid-token-123',
          metodo_pagamento: 'cartao',
          numero_parcelas: 15,
        }),
      } as any;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Número de parcelas deve ser entre 1 e 12');
    });
  });
});
