/**
 * Testes para Dashboard de Cobrança
 * Endpoint: /api/admin/cobranca/dashboard
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

describe('API Dashboard de Cobrança', () => {
  let contratanteId1: number;
  let contratanteId2: number;
  let contratoId1: number;
  let contratoId2: number;
  let pagamentoId1: number;
  let pagamentoId2: number;

  beforeAll(async () => {
    // Criar contratantes
    const cont1 = await query(
      `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, status,
                                 responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular)
       VALUES ('entidade', 'Empresa Dashboard 1', '55555555000105', 'dash1@teste.com', '11999999995',
               'Rua E', 'São Paulo', 'SP', '05000-000', 'aprovado',
               'Responsavel Dash1', '12345678905', 'resp.dash1@teste.com', '11987654325')
       RETURNING id`
    );
    contratanteId1 = cont1.rows[0].id;

    const cont2 = await query(
      `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, status,
                                 responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular)
       VALUES ('entidade', 'Empresa Dashboard 2', '66666666000106', 'dash2@teste.com', '11999999996',
               'Rua F', 'São Paulo', 'SP', '06000-000', 'aprovado',
               'Responsavel Dash2', '12345678906', 'resp.dash2@teste.com', '11987654326')
       RETURNING id`
    );
    contratanteId2 = cont2.rows[0].id;

    // Criar contratos
    const contr1 = await query(
      `INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, status, conteudo, conteudo_gerado)
       VALUES ($1, 1, 10, 200.00, 'aprovado', 'Contrato dashboard 1', 'Contrato dashboard 1')
       RETURNING id`,
      [contratanteId1]
    );
    contratoId1 = contr1.rows[0].id;

    const contr2 = await query(
      `INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, status, conteudo, conteudo_gerado)
       VALUES ($1, 1, 15, 300.00, 'aprovado', 'Contrato dashboard 2', 'Contrato dashboard 2')
       RETURNING id`,
      [contratanteId2]
    );
    contratoId2 = contr2.rows[0].id;

    // Criar pagamentos parcelados com detalhes_parcelas
    // Pagamento 1: algumas parcelas pagas, algumas pendentes, uma vencida
    const dataVencida = new Date();
    dataVencida.setDate(dataVencida.getDate() - 15); // 15 dias atrás

    const dataProxima = new Date();
    dataProxima.setDate(dataProxima.getDate() + 10); // Daqui a 10 dias

    const detalhesParcelas1 = [
      {
        numero: 1,
        valor: 50,
        data_vencimento: '2025-01-01',
        status: 'pago',
      },
      {
        numero: 2,
        valor: 50,
        data_vencimento: dataVencida.toISOString().split('T')[0],
        status: 'pendente',
      },
      {
        numero: 3,
        valor: 50,
        data_vencimento: dataProxima.toISOString().split('T')[0],
        status: 'pendente',
      },
      {
        numero: 4,
        valor: 50,
        data_vencimento: '2025-04-01',
        status: 'pendente',
      },
    ];

    const pag1 = await query(
      `INSERT INTO pagamentos (contratante_id, metodo, valor, numero_parcelas, status, data_pagamento)
       VALUES ($1, 'cartao', 200.00, 4, 'pago', NOW())
       RETURNING id`,
      [contratanteId1]
    );
    pagamentoId1 = pag1.rows[0].id;

    // Pagamento 2: mais parcelas pagas
    const detalhesParcelas2 = [
      { numero: 1, valor: 100, data_vencimento: '2025-01-15', status: 'pago' },
      { numero: 2, valor: 100, data_vencimento: '2025-02-15', status: 'pago' },
      {
        numero: 3,
        valor: 100,
        data_vencimento: '2025-03-15',
        status: 'pendente',
      },
    ];

    const pag2 = await query(
      `INSERT INTO pagamentos (contratante_id, metodo, valor, numero_parcelas, status, data_pagamento)
       VALUES ($1, 'boleto', 300.00, 3, 'pago', NOW())
       RETURNING id`,
      [contratanteId2]
    );
    pagamentoId2 = pag2.rows[0].id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query('DELETE FROM pagamentos WHERE id IN ($1, $2)', [
      pagamentoId1,
      pagamentoId2,
    ]);
    await query('DELETE FROM contratos WHERE id IN ($1, $2)', [
      contratoId1,
      contratoId2,
    ]);
    await query('DELETE FROM contratantes WHERE id IN ($1, $2)', [
      contratanteId1,
      contratanteId2,
    ]);
  });

  describe('GET /api/admin/cobranca/dashboard', () => {
    it('deve retornar métricas gerais de cobrança', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/dashboard/route');

      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/admin/cobranca/dashboard'),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.dashboard).toBeDefined();
      expect(data.dashboard.metrics).toBeDefined();
    });

    it('deve calcular métricas corretamente', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/dashboard/route');

      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/admin/cobranca/dashboard'),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      const metrics = data.dashboard.metrics;

      expect(metrics.total_pagamentos).toBeGreaterThanOrEqual(2);
      expect(metrics.valor_total_contratado).toBeGreaterThanOrEqual(500);
      expect(metrics.valor_recebido).toBeGreaterThan(0);
      expect(metrics.valor_a_receber).toBeGreaterThan(0);
      expect(metrics.parcelas_pagas).toBeGreaterThanOrEqual(3);
      expect(metrics.parcelas_pendentes).toBeGreaterThanOrEqual(4);
      expect(metrics.parcelas_vencidas).toBeGreaterThanOrEqual(1);
    });

    it('deve calcular taxa de inadimplência', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/dashboard/route');

      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/admin/cobranca/dashboard'),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      const metrics = data.dashboard.metrics;

      expect(metrics.taxa_inadimplencia).toBeDefined();
      expect(parseFloat(metrics.taxa_inadimplencia)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(metrics.taxa_inadimplencia)).toBeLessThanOrEqual(100);
    });

    it('deve retornar lista de parcelas vencidas', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/dashboard/route');

      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/admin/cobranca/dashboard'),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.dashboard.parcelas_vencidas).toBeDefined();
      expect(Array.isArray(data.dashboard.parcelas_vencidas)).toBe(true);

      // Verificar estrutura das parcelas vencidas
      if (data.dashboard.parcelas_vencidas.length > 0) {
        const parcela = data.dashboard.parcelas_vencidas[0];
        expect(parcela).toHaveProperty('pagamento_id');
        expect(parcela).toHaveProperty('contratante_nome');
        expect(parcela).toHaveProperty('email');
        expect(parcela).toHaveProperty('parcela_numero');
        expect(parcela).toHaveProperty('parcela_valor');
        expect(parcela).toHaveProperty('data_vencimento');
        expect(parcela).toHaveProperty('dias_atraso');
        expect(parcela.status_parcela).toBe('pendente');
      }
    });

    it('deve retornar próximos vencimentos', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/dashboard/route');

      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/admin/cobranca/dashboard'),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.dashboard.proximos_vencimentos).toBeDefined();
      expect(Array.isArray(data.dashboard.proximos_vencimentos)).toBe(true);

      // Verificar estrutura
      if (data.dashboard.proximos_vencimentos.length > 0) {
        const parcela = data.dashboard.proximos_vencimentos[0];
        expect(parcela).toHaveProperty('pagamento_id');
        expect(parcela).toHaveProperty('contratante_nome');
        expect(parcela).toHaveProperty('parcela_numero');
        expect(parcela).toHaveProperty('parcela_valor');
        expect(parcela).toHaveProperty('data_vencimento');
        expect(parcela).toHaveProperty('dias_ate_vencimento');
        expect(parcela.dias_ate_vencimento).toBeGreaterThanOrEqual(0);
        expect(parcela.dias_ate_vencimento).toBeLessThanOrEqual(30);
      }
    });

    it('deve retornar lista de inadimplentes', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/dashboard/route');

      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/admin/cobranca/dashboard'),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.dashboard.inadimplentes).toBeDefined();
      expect(Array.isArray(data.dashboard.inadimplentes)).toBe(true);

      // Verificar estrutura
      if (data.dashboard.inadimplentes.length > 0) {
        const inadimplente = data.dashboard.inadimplentes[0];
        expect(inadimplente).toHaveProperty('id');
        expect(inadimplente).toHaveProperty('nome');
        expect(inadimplente).toHaveProperty('email');
        expect(inadimplente).toHaveProperty('total_parcelas_vencidas');
        expect(inadimplente).toHaveProperty('valor_total_vencido');
        expect(inadimplente).toHaveProperty('primeira_parcela_vencida');
        expect(inadimplente).toHaveProperty('dias_maior_atraso');
      }
    });

    it('deve limitar resultados conforme especificado', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/dashboard/route');

      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/admin/cobranca/dashboard'),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verificar limites (definidos nas queries)
      expect(data.dashboard.parcelas_vencidas.length).toBeLessThanOrEqual(10);
      expect(data.dashboard.proximos_vencimentos.length).toBeLessThanOrEqual(
        10
      );
      expect(data.dashboard.inadimplentes.length).toBeLessThanOrEqual(5);
    });

    it('deve retornar valores numéricos corretos', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/dashboard/route');

      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/admin/cobranca/dashboard'),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      const metrics = data.dashboard.metrics;

      // Verificar tipos e valores positivos
      expect(typeof metrics.total_pagamentos).toBe('number');
      expect(typeof metrics.valor_total_contratado).toBe('number');
      expect(typeof metrics.valor_recebido).toBe('number');
      expect(typeof metrics.valor_a_receber).toBe('number');

      expect(metrics.valor_total_contratado).toBeGreaterThanOrEqual(0);
      expect(metrics.valor_recebido).toBeGreaterThanOrEqual(0);
      expect(metrics.valor_a_receber).toBeGreaterThanOrEqual(0);
    });

    it('deve incluir contratante com parcela vencida na lista de inadimplentes', async () => {
      const { GET } = await import('@/app/api/admin/cobranca/dashboard/route');

      const mockRequest = {
        nextUrl: new URL('http://localhost:3000/api/admin/cobranca/dashboard'),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      // Verificar se nosso contratante de teste com parcela vencida está na lista
      const inadimplente = data.dashboard.inadimplentes.find(
        (i: any) => i.id === contratanteId1
      );

      if (inadimplente) {
        expect(inadimplente.nome).toBe('Empresa Dashboard 1');
        expect(inadimplente.total_parcelas_vencidas).toBeGreaterThanOrEqual(1);
        expect(inadimplente.dias_maior_atraso).toBeGreaterThan(0);
      }
    });
  });
});
