/**
 * Testes para gestão de parcelas
 * Endpoints: /api/admin/cobranca/parcela (PATCH e GET)
 */

import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('API Gestão de Parcelas', () => {
  let tomadorId: number;
  let contratoId: number;
  let pagamentoId: number;
  let reciboId: number;

  beforeAll(async () => {
    // Criar tomador
    const cont = await query(
      `INSERT INTO entidades (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, status)
       VALUES ('entidade', 'Empresa Parcelas', '77777777000107', 'parcelas@teste.com', '11999999997',
               'Rua G', 'São Paulo', 'SP', '07000-000', 'aprovado')
       RETURNING id`
    );
    tomadorId = cont.rows[0].id;

    // Criar contrato
    const contr = await query(
      `INSERT INTO contratos (tomador_id, plano_id, numero_funcionarios, valor_total, status, conteudo_gerado)
       VALUES ($1, 1, 10, 300.00, 'aprovado', 'Contrato parcelas')
       RETURNING id`,
      [tomadorId]
    );
    contratoId = contr.rows[0].id;

    // Criar pagamento com parcelas
    const detalhesParcelas = [
      {
        numero: 1,
        valor: 100,
        data_vencimento: '2025-01-01',
        status: 'pago',
      },
      {
        numero: 2,
        valor: 100,
        data_vencimento: '2025-02-01',
        status: 'pendente',
      },
      {
        numero: 3,
        valor: 100,
        data_vencimento: '2025-03-01',
        status: 'pendente',
      },
    ];

    const pag = await query(
      `INSERT INTO pagamentos (tomador_id, metodo, valor, numero_parcelas,
                               numero_funcionarios, valor_por_funcionario, detalhes_parcelas, status, data_pagamento)
       VALUES ($1, 'cartao', 300.00, 3, 10, 20.00, $2, 'pago', NOW())
       RETURNING id`,
      [tomadorId, JSON.stringify(detalhesParcelas)]
    );
    pagamentoId = pag.rows[0].id;

    // Criar recibo
    const rec = await query(
      `INSERT INTO recibos (contrato_id, pagamento_id, tomador_id, vigencia_inicio, vigencia_fim,
                            numero_funcionarios_cobertos, valor_total_anual, valor_por_funcionario,
                            forma_pagamento, numero_parcelas, valor_parcela, detalhes_parcelas, ativo)
       VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_DATE + INTERVAL '364 days', 10, 300.00, 20.00,
               'cartao', 3, 100.00, $4, true)
       RETURNING id`,
      [contratoId, pagamentoId, tomadorId, JSON.stringify(detalhesParcelas)]
    );
    reciboId = rec.rows[0].id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query('DELETE FROM recibos WHERE id = $1', [reciboId]);
    await query('DELETE FROM pagamentos WHERE id = $1', [pagamentoId]);
    await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
    await query('DELETE FROM tomadores WHERE id = $1', [tomadorId]);
  });

  describe('PATCH /api/admin/cobranca/parcela/atualizar-status', () => {
    it('deve retornar erro 400 se campos obrigatórios não forem fornecidos', async () => {
      const { PATCH } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        json: async () => ({}),
      } as NextRequest;

      const response = await PATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('obrigatórios');
    });

    it('deve retornar erro 400 se status for inválido', async () => {
      const { PATCH } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        json: async () => ({
          pagamento_id: pagamentoId,
          parcela_numero: 2,
          novo_status: 'invalido',
        }),
      } as NextRequest;

      const response = await PATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Status deve ser');
    });

    it('deve retornar erro 404 se pagamento não existir', async () => {
      const { PATCH } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        json: async () => ({
          pagamento_id: 999999,
          parcela_numero: 1,
          novo_status: 'pago',
        }),
      } as NextRequest;

      const response = await PATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('não encontrado');
    });

    it('deve atualizar status da parcela com sucesso', async () => {
      const { PATCH } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        json: async () => ({
          pagamento_id: pagamentoId,
          parcela_numero: 2,
          novo_status: 'pago',
        }),
      } as NextRequest;

      const response = await PATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('atualizado');
      expect(data.detalhes_parcelas).toBeDefined();

      // Verificar se status foi atualizado no banco
      const check = await query(
        `SELECT detalhes_parcelas FROM pagamentos WHERE id = $1`,
        [pagamentoId]
      );
      const parcelas = check.rows[0].detalhes_parcelas;
      const parcela2 = parcelas.find((p: any) => p.numero === 2);
      expect(parcela2.status).toBe('pago');
    });

    it('deve sincronizar status com tabela recibos', async () => {
      const { PATCH } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        json: async () => ({
          pagamento_id: pagamentoId,
          parcela_numero: 3,
          novo_status: 'pago',
        }),
      } as NextRequest;

      await PATCH(mockRequest);

      // Verificar se recibo também foi atualizado
      const reciboCheck = await query(
        `SELECT detalhes_parcelas FROM recibos WHERE pagamento_id = $1`,
        [pagamentoId]
      );
      const parcelas = reciboCheck.rows[0].detalhes_parcelas;
      const parcela3 = parcelas.find((p: any) => p.numero === 3);
      expect(parcela3.status).toBe('pago');
    });

    it('deve atualizar apenas a parcela especificada', async () => {
      const { PATCH } = await import('@/app/api/admin/cobranca/parcela/route');

      // Obter estado inicial
      const before = await query(
        `SELECT detalhes_parcelas FROM pagamentos WHERE id = $1`,
        [pagamentoId]
      );
      const parcelasBefore = before.rows[0].detalhes_parcelas;

      const mockRequest = {
        json: async () => ({
          pagamento_id: pagamentoId,
          parcela_numero: 2,
          novo_status: 'pendente', // Voltar para pendente
        }),
      } as NextRequest;

      await PATCH(mockRequest);

      // Verificar estado após
      const after = await query(
        `SELECT detalhes_parcelas FROM pagamentos WHERE id = $1`,
        [pagamentoId]
      );
      const parcelasAfter = after.rows[0].detalhes_parcelas;

      // Parcela 1 não deve ter mudado
      expect(parcelasAfter[0].status).toBe(parcelasBefore[0].status);
      // Parcela 2 deve ter mudado
      expect(parcelasAfter[1].status).toBe('pendente');
      // Parcela 3 não deve ter mudado
      expect(parcelasAfter[2].status).toBe(parcelasBefore[2].status);
    });

    it('deve aceitar status cancelado', async () => {
      const { PATCH } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        json: async () => ({
          pagamento_id: pagamentoId,
          parcela_numero: 3,
          novo_status: 'cancelado',
        }),
      } as NextRequest;

      const response = await PATCH(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verificar no banco
      const check = await query(
        `SELECT detalhes_parcelas FROM pagamentos WHERE id = $1`,
        [pagamentoId]
      );
      const parcelas = check.rows[0].detalhes_parcelas;
      const parcela3 = parcelas.find((p: any) => p.numero === 3);
      expect(parcela3.status).toBe('cancelado');
    });
  });

  describe('GET /api/admin/cobranca/parcela/historico', () => {
    beforeAll(async () => {
      // Criar mais um pagamento para o mesmo tomador
      const detalhesParcelas2 = [
        {
          numero: 1,
          valor: 150,
          data_vencimento: '2024-12-01',
          status: 'pago',
        },
        {
          numero: 2,
          valor: 150,
          data_vencimento: '2025-01-01',
          status: 'pago',
        },
      ];

      await query(
        `INSERT INTO pagamentos (tomador_id, metodo, valor, numero_parcelas,
                                 numero_funcionarios, valor_por_funcionario, detalhes_parcelas, status, data_pagamento)
         VALUES ($1, 'pix', 300.00, 2, 10, 20.00, $2, 'pago', NOW() - INTERVAL '30 days')`,
        [tomadorId, JSON.stringify(detalhesParcelas2)]
      );
    });

    it('deve retornar erro 400 se tomador_id não for fornecido', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        nextUrl: new URL(
          'http://localhost:3000/api/admin/cobranca/parcela/historico'
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('obrigatório');
    });

    it('deve retornar histórico de pagamentos do tomador', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        nextUrl: new URL(
          `http://localhost:3000/api/admin/cobranca/parcela/historico?tomador_id=${tomadorId}`
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.historico).toBeDefined();
      expect(Array.isArray(data.historico)).toBe(true);
      expect(data.historico.length).toBeGreaterThanOrEqual(2); // Pelo menos 2 pagamentos
    });

    it('deve retornar pagamentos ordenados por data (mais recente primeiro)', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        nextUrl: new URL(
          `http://localhost:3000/api/admin/cobranca/parcela/historico?tomador_id=${tomadorId}`
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verificar ordenação
      for (let i = 1; i < data.historico.length; i++) {
        const atual = new Date(data.historico[i].data_pagamento);
        const anterior = new Date(data.historico[i - 1].data_pagamento);
        expect(atual.getTime()).toBeLessThanOrEqual(anterior.getTime());
      }
    });

    it('deve incluir detalhes do plano e contrato', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        nextUrl: new URL(
          `http://localhost:3000/api/admin/cobranca/parcela/historico?tomador_id=${tomadorId}`
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      const pagamento = data.historico[0];
      expect(pagamento).toHaveProperty('pagamento_id');
      expect(pagamento).toHaveProperty('data_pagamento');
      expect(pagamento).toHaveProperty('valor_total');
      expect(pagamento).toHaveProperty('metodo');
      expect(pagamento).toHaveProperty('numero_parcelas');
      expect(pagamento).toHaveProperty('plano');
      expect(pagamento).toHaveProperty('status_contrato');
      expect(pagamento).toHaveProperty('detalhes_parcelas');
    });

    it('deve incluir detalhes_parcelas para cada pagamento', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        nextUrl: new URL(
          `http://localhost:3000/api/admin/cobranca/parcela/historico?tomador_id=${tomadorId}`
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      const pagamento = data.historico[0];
      expect(pagamento.detalhes_parcelas).toBeDefined();
      expect(Array.isArray(pagamento.detalhes_parcelas)).toBe(true);

      if (pagamento.detalhes_parcelas.length > 0) {
        const parcela = pagamento.detalhes_parcelas[0];
        expect(parcela).toHaveProperty('numero');
        expect(parcela).toHaveProperty('valor');
        expect(parcela).toHaveProperty('data_vencimento');
        expect(parcela).toHaveProperty('status');
      }
    });

    it('deve retornar valores numéricos corretos', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/parcela/route');

      const mockRequest = {
        nextUrl: new URL(
          `http://localhost:3000/api/admin/cobranca/parcela/historico?tomador_id=${tomadorId}`
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      const pagamento = data.historico[0];
      expect(typeof pagamento.valor_total).toBe('number');
      expect(typeof pagamento.valor_por_funcionario).toBe('number');
      expect(typeof pagamento.numero_funcionarios).toBe('number');
      expect(typeof pagamento.numero_parcelas).toBe('number');
    });
  });
});
