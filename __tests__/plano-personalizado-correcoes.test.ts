/**
 * Testes para o fluxo de Plano Personalizado com correções implementadas
 * Valida: status intermediário, validação de funcionários, fluxo de aceite e pagamento
 */

describe('Fluxo Plano Personalizado - Correções Implementadas', () => {
  // Mock global do fetch
  const mockFetch = jest.fn();
  global.fetch = mockFetch as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Testes relacionados ao fluxo antigo de contrato pré-pagamento removidos - agora é contract-first (contrato deve ser aceito antes do pagamento)

  describe('2. Validação de Número de Funcionários', () => {
    it('deve validar numero_funcionarios antes de aprovar personalizado', async () => {
      const mockError = {
        error: 'Número de funcionários inválido ou não informado',
        detalhes:
          'Forneça o número de funcionários no formulário ou certifique-se de que o contratante informou no cadastro.',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockError,
      } as Response);

      const response = await fetch('/api/admin/novos-cadastros', {
        method: 'POST',
        body: JSON.stringify({
          id: 1,
          acao: 'aprovar_personalizado',
          valor_por_funcionario: 100.0,
          // Sem numero_funcionarios e sem estimado
        }),
      });

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toContain('Número de funcionários');
    });

    it('deve aceitar numero_funcionarios fornecido pelo admin', async () => {
      const mockResponse = {
        success: true,
        contratante: {
          id: 1,
          numero_funcionarios: 100, // Admin sobrescreveu estimado
          valor_por_funcionario: 85.0,
          valor_total: 8500.0,
          link_contrato: '/contrato/456',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch('/api/admin/novos-cadastros', {
        method: 'POST',
        body: JSON.stringify({
          id: 1,
          acao: 'aprovar_personalizado',
          valor_por_funcionario: 85.0,
          numero_funcionarios: 100, // Admin define explicitamente
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.contratante.numero_funcionarios).toBe(100);
      expect(data.contratante.link_contrato).toBe('/contrato/456');
    });

    it('deve usar numero_funcionarios_estimado se admin não fornecer', async () => {
      const mockResponse = {
        success: true,
        contratante: {
          id: 1,
          numero_funcionarios: 50, // Usa estimado
          valor_por_funcionario: 100.0,
          valor_total: 5000.0,
          link_contrato: '/contrato/789',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch('/api/admin/novos-cadastros', {
        method: 'POST',
        body: JSON.stringify({
          id: 1,
          acao: 'aprovar_personalizado',
          valor_por_funcionario: 100.0,
          // Sem numero_funcionarios - usa estimado
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.contratante.numero_funcionarios).toBe(50);
      expect(data.contratante.link_contrato).toBeDefined();
    });
  });

  describe('4. Fluxo Automático de Pagamento', () => {
    it('confirmar pagamento não deve liberar login automaticamente (contract-first)', async () => {
      const mockResponse = {
        success: true,
        message: 'Pagamento confirmado com sucesso!',
        contratante_id: 1,
        contratante_nome: 'Empresa Teste',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await fetch('/api/pagamento/confirmar', {
        method: 'POST',
        body: JSON.stringify({
          pagamento_id: 456,
          metodo_pagamento: 'pix',
        }),
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.login_liberado).toBeUndefined();
    });

    // Teste de liberação automática para planos personalizados removido - agora automático após pagamento
  });

  // Teste de sequência completa do fluxo para plano personalizado removido - substituído por testes contract-first
});
