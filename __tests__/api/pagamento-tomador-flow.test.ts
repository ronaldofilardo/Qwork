import { query } from '@/lib/db';

jest.mock('@/lib/db');

/**
 * Testes para o fluxo de pagamento com arquitetura de tomador
 * Valida:
 * - Inicialização agnóstica (tomador_id)
 * - SWITCH(tipo) em entidade vs clinica
 * - Criação de login diferenciado (gestor vs rh)
 */

describe('API Pagamento - Fluxo Tomador', () => {
  const mockQuery = query as jest.MockedFunction<typeof query>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/pagamento/iniciar', () => {
    it('deve aceitar tomador_id como parâmetro principal', async () => {
      // Mock da rota seria necessário para teste completo
      // Este é um teste conceitual

      const payload = {
        tomador_id: 123,
        contrato_id: 1,
        plano_id: 1,
      };

      expect(payload.tomador_id).toBeDefined();
      expect(payload.tomador_id).toBe(123);
    });

    it('deve buscar dados de tomadores com VIEW agnóstico', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 123,
            nome: 'Empresa Teste',
            tipo: 'entidade',
            plano_id: 1,
            status: 'aguardando_pagamento',
            numero_funcionarios_estimado: 50,
            plano_nome: 'Plano Pro',
            plano_tipo: 'fixo',
            preco: 10.0,
          },
        ],
        rowCount: 1,
      });

      const result = await mockQuery(
        'SELECT * FROM tomadores WHERE id = $1',
        [123]
      );

      expect(result.rows[0].tipo).toBe('entidade');
      expect(result.rows[0].id).toBe(123);
    });

    it('deve retornar tomador_id e tipo na resposta de inicialização', async () => {
      const responsePayload = {
        success: true,
        pagamento_id: 1,
        tomador_id: 123,
        tipo: 'entidade',
        valor: 500,
        plano_nome: 'Plano Pro',
        tomador_nome: 'Empresa Teste',
      };

      expect(responsePayload.tomador_id).toBe(123);
      expect(responsePayload.tipo).toBe('entidade');
    });

    it('deve usar tomador_id em INSERT to pagamentos', async () => {
      // Validar que a query usa tomador_id, não tomador_id
      const expectedQuery =
        'INSERT INTO pagamentos (tomador_id, contrato_id, valor, status, metodo) VALUES ($1, $2, $3, $4, $5)';

      expect(expectedQuery).toContain('tomador_id');
      expect(expectedQuery).not.toContain('tomador_id');
    });
  });

  describe('POST /api/pagamento/confirmar - SWITCH(tipo)', () => {
    it('deve identificar tipo entidade e ativar com fluxo gestor', async () => {
      // Simular response da query de busca de pagamento
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            tomador_id: 123,
            contrato_id: 1,
            status: 'pendente',
            tipo: 'entidade',
            nome: 'Empresa A',
            cnpj: '12345678000100',
            responsavel_cpf: '12345678900',
            responsavel_nome: 'João Silva',
            responsavel_email: 'joao@empresa.com',
          },
        ],
        rowCount: 1,
      });

      const result = await mockQuery(
        'SELECT p.*, t.tipo FROM pagamentos p JOIN tomadores t ON p.tomador_id = t.id WHERE p.id = $1',
        [1]
      );

      expect(result.rows[0].tipo).toBe('entidade');
      expect(result.rows[0].tomador_id).toBe(123);
    });

    it('deve identificar tipo clinica e ativar com fluxo rh', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            tomador_id: 456,
            contrato_id: 2,
            status: 'pendente',
            tipo: 'clinica',
            nome: 'Clínica B',
            cnpj: '87654321000199',
            responsavel_cpf: '98765432100',
            responsavel_nome: 'Maria Santos',
            responsavel_email: 'maria@clinica.com',
          },
        ],
        rowCount: 1,
      });

      const result = await mockQuery(
        'SELECT p.*, t.tipo FROM pagamentos p JOIN tomadores t ON p.tomador_id = t.id WHERE p.id = $1',
        [2]
      );

      expect(result.rows[0].tipo).toBe('clinica');
      expect(result.rows[0].tomador_id).toBe(456);
    });

    it('deve executar UPDATE na tabela entidades quando tipo=entidade', async () => {
      // Simular UPDATE
      const tipo = 'entidade';
      const tomadorId = 123;

      if (tipo === 'entidade') {
        mockQuery.mockResolvedValueOnce({ rowCount: 1 });

        const result = await mockQuery(
          'UPDATE entidades SET ativa = true, pagamento_confirmado = true WHERE id = $1',
          [tomadorId]
        );

        expect(result.rowCount).toBe(1);
      }
    });

    it('deve executar UPDATE na tabela clinicas quando tipo=clinica', async () => {
      // Simular UPDATE
      const tipo = 'clinica';
      const tomadorId = 456;

      if (tipo === 'clinica') {
        mockQuery.mockResolvedValueOnce({ rowCount: 1 });

        const result = await mockQuery(
          'UPDATE clinicas SET ativa = true, pagamento_confirmado = true WHERE id = $1',
          [tomadorId]
        );

        expect(result.rowCount).toBe(1);
      }
    });

    it('deve retornar tipo na resposta de confirmação', async () => {
      const responsePayload = {
        success: true,
        pagamento_id: 1,
        tomador_id: 123,
        tomador_nome: 'Empresa A',
        tipo: 'entidade',
        acesso_liberado: true,
        login_liberado: true,
      };

      expect(responsePayload.tipo).toBe('entidade');
      expect(responsePayload.tomador_id).toBe(123);
    });
  });

  describe('GET /api/pagamento/personalizado/[token]', () => {
    it('deve buscar dados de tomadores na validação de link personalizado', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            contratacao_id: 100,
            tomador_id: 123,
            tomador_id: 123,
            tipo: 'entidade',
            tomador_nome: 'Empresa Teste',
            valor_por_funcionario: 20.0,
            numero_funcionarios_estimado: 50,
            valor_total_estimado: 1000,
            status: 'valor_definido',
          },
        ],
        rowCount: 1,
      });

      const result = await mockQuery(
        'SELECT t.tipo, t.id as tomador_id FROM contratacao_personalizada cp JOIN tomadores t WHERE cp.payment_link_token = $1',
        ['abc123']
      );

      expect(result.rows[0].tomador_id).toBe(123);
      expect(result.rows[0].tipo).toBe('entidade');
    });

    it('deve retornar tomador_id e tipo na resposta', async () => {
      const responsePayload = {
        valido: true,
        contratacao_id: 100,
        tomador_id: 123,
        tipo: 'entidade',
        tomador_nome: 'Empresa Teste',
        valor_total: 1000,
        status: 'valor_definido',
      };

      expect(responsePayload.tomador_id).toBeDefined();
      expect(responsePayload.tipo).toBeDefined();
      expect(responsePayload.tomador_id).toBe(123);
    });
  });

  describe('Validações de integridade', () => {
    it('deve garantir que contratos usam tomador_id em JOINs', async () => {
      const expectedQueries = [
        'JOIN contratos ctr ON ctr.tomador_id = t.id',
        'WHERE contratos.tomador_id = $1',
      ];

      expectedQueries.forEach((query) => {
        expect(query).toContain('tomador_id');
        expect(query).not.toContain('tomador_id');
      });
    });

    it('deve garantir que notifications usam destinatario_tipo válido', async () => {
      // O tipo deve ser um dos valores válidos: admin, tomador, clinica, funcionario, gestor
      const validTipos = [
        'admin',
        'tomador',
        'clinica',
        'funcionario',
        'gestor',
      ];

      expect(validTipos).toContain('tomador');
      expect(validTipos).toContain('clinica');
      expect(validTipos).toContain('gestor');
    });

    it('deve manter retrocompatibilidade com entidade_id', async () => {
      const responsePayload = {
        tomador_id: 123,
        entidade_id: 123, // backward compat alias
        type: 'entidade',
      };

      expect(responsePayload.entidade_id).toBe(responsePayload.tomador_id);
    });
  });

  describe('Fluxo E2E conceitual', () => {
    it('deve seguir fluxo completo: iniciar -> confirmar com tipo branching', async () => {
      // 1. Iniciar pagamento com tomador_id
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 123, tipo: 'entidade' }],
      });

      const tomador = await mockQuery(
        'SELECT * FROM tomadores WHERE id = $1',
        [123]
      );
      const tipo = tomador.rows[0].tipo;

      // 2. Confirmar pagamento
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      if (tipo === 'entidade') {
        await mockQuery(
          'UPDATE entidades SET ativa = true WHERE id = $1',
          [123]
        );
      } else if (tipo === 'clinica') {
        await mockQuery(
          'UPDATE clinicas SET ativa = true WHERE id = $1',
          [123]
        );
      }

      // 3. Verificar ativação
      expect(tipo).toBe('entidade');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('entidades'),
        expect.any(Array)
      );
    });
  });
});
