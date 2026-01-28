/**
 * Testes para API de geração de recibos
 * @jest-environment node
 */

// Garantir ambiente Node.js para este teste
import { POST, GET } from '@/app/api/recibo/gerar/route';
import { NextRequest } from 'next/server';

// Mock do módulo db
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const { query } = require('@/lib/db');

describe('API Recibo - POST /api/recibo/gerar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve gerar recibo com sucesso', async () => {
    // Mock: verificar se recibo já existe (não existe)
    query.mockResolvedValueOnce({ rows: [] });

    // Mock: detectar colunas do plano
    query.mockResolvedValueOnce({
      rows: [
        { column_name: 'valor_por_funcionario' },
        { column_name: 'preco' },
      ],
    });

    // Mock: buscar dados do contrato, pagamento, contratante, plano
    query.mockResolvedValueOnce({
      rows: [
        {
          contrato_id: 1,
          contratante_id: 1,
          plano_id: 1,
          contrato_valor_total: 15000.0,
          numero_funcionarios: 50,
          contratante_nome: 'Empresa XYZ',
          contratante_cnpj: '12.345.678/0001-90',
          numero_funcionarios_estimado: 50,
          pagamento_valor: 15000.0,
          pagamento_metodo: 'boleto',
          data_pagamento: '2025-12-22T10:00:00Z',
          numero_parcelas: 10,
          plano_nome: 'Plano Personalizado',
          plano_tipo: 'personalizado',
          valor_por_funcionario: 300.0,
          preco: 15000.0,
        },
      ],
    });

    // Mock: verificar status do pagamento (pago)
    query.mockResolvedValueOnce({
      rows: [{ status: 'pago' }],
    });

    // Mock: inserir recibo
    query.mockResolvedValueOnce({
      rows: [{ id: 1, numero_recibo: 'REC-2025-00001' }],
      rowCount: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/recibo/gerar', {
      method: 'POST',
      body: JSON.stringify({
        contrato_id: 1,
        pagamento_id: 5,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.recibo.numero_recibo).toBe('REC-2025-00001');
    expect(data.recibo.vigencia_inicio).toBeDefined();
    expect(data.recibo.vigencia_fim).toBeDefined();
    expect(data.recibo.numero_funcionarios_cobertos).toBe(50);
    expect(data.recibo.valor_total_anual).toBe(15000.0);
  });

  it('deve retornar erro se contrato_id não for fornecido', async () => {
    // Mock: recibo não existe
    query.mockResolvedValueOnce({ rows: [] });

    // Mock: detectar colunas do plano
    query.mockResolvedValueOnce({ rows: [] });

    // Mock: dados do pagamento (sem contrato)
    query.mockResolvedValueOnce({
      rows: [
        {
          contratante_id: 1,
          pagamento_valor: 15000.0,
          pagamento_metodo: 'boleto',
          data_pagamento: '2025-12-22T10:00:00Z',
          numero_parcelas: 1,
          numero_funcionarios: 50,
          valor_por_funcionario: 300.0,
          contratante_nome: 'Empresa XYZ',
          contratante_cnpj: '12.345.678/0001-90',
          numero_funcionarios_estimado: 50,
        },
      ],
    });

    // Mock: verificar status do pagamento (não pago)
    query.mockResolvedValueOnce({
      rows: [{ status: 'pendente' }],
    });

    const request = new NextRequest('http://localhost:3000/api/recibo/gerar', {
      method: 'POST',
      body: JSON.stringify({
        pagamento_id: 5,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('não foi confirmado');
  });

  it('deve retornar erro se pagamento não foi encontrado', async () => {
    // Mock: recibo não existe
    query.mockResolvedValueOnce({ rows: [] });

    // Mock: detectar colunas do plano
    query.mockResolvedValueOnce({ rows: [] });

    // Mock: dados do contrato não encontrados
    query.mockResolvedValueOnce({
      rows: [],
    });

    const request = new NextRequest('http://localhost:3000/api/recibo/gerar', {
      method: 'POST',
      body: JSON.stringify({
        contrato_id: 1,
        pagamento_id: 99,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('não encontrado');
  });

  it('deve retornar recibo existente se já foi gerado', async () => {
    // Mock: recibo já existe
    query.mockResolvedValueOnce({
      rows: [{ id: 1, numero_recibo: 'REC-2025-00001' }],
      rowCount: 1,
    });

    const request = new NextRequest('http://localhost:3000/api/recibo/gerar', {
      method: 'POST',
      body: JSON.stringify({
        contrato_id: 1,
        pagamento_id: 5,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('já foi gerado');
    expect(data.recibo).toBeDefined();
  });
});

describe('API Recibo - GET /api/recibo/gerar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve buscar recibo por ID', async () => {
    query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          numero_recibo: 'REC-2025-00001',
          vigencia_inicio: '2025-12-22',
          vigencia_fim: '2026-12-21',
          numero_funcionarios_cobertos: 50,
          valor_total_anual: 15000.0,
          contratante_nome: 'Empresa XYZ',
        },
      ],
    });

    const request = new NextRequest(
      'http://localhost:3000/api/recibo/gerar?id=1',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.recibo.numero_recibo).toBe('REC-2025-00001');
  });

  it('deve retornar erro se recibo não for encontrado', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const request = new NextRequest(
      'http://localhost:3000/api/recibo/gerar?id=999',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toContain('não encontrado');
  });

  it('deve retornar erro se parâmetros forem insuficientes', async () => {
    const request = new NextRequest('http://localhost:3000/api/recibo/gerar', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Parâmetros insuficientes');
  });
});

describe('Helpers de Recibo', () => {
  describe('determinarFormaPagamento', () => {
    it('deve retornar "parcelado" se numero_parcelas > 1', () => {
      const {
        determinarFormaPagamento,
      } = require('@/app/api/recibo/gerar/route');
      expect(determinarFormaPagamento('boleto', 10)).toBe('parcelado');
    });

    it('deve retornar método mapeado se parcela única', () => {
      const {
        determinarFormaPagamento,
      } = require('@/app/api/recibo/gerar/route');
      expect(determinarFormaPagamento('pix', 1)).toBe('pix');
      expect(determinarFormaPagamento('cartao', 1)).toBe('cartao');
    });
  });

  describe('gerarDescricaoPagamento', () => {
    it('deve gerar descrição de pagamento à vista', () => {
      const {
        gerarDescricaoPagamento,
      } = require('@/app/api/recibo/gerar/route');
      const descricao = gerarDescricaoPagamento(
        'pix',
        1,
        1500.0,
        new Date('2025-12-22')
      );

      expect(descricao).toContain('à vista');
      expect(descricao).toContain('R$ 1.500,00');
      expect(descricao).toContain('PIX');
    });

    it('deve gerar descrição de pagamento parcelado com vencimentos', () => {
      const {
        gerarDescricaoPagamento,
      } = require('@/app/api/recibo/gerar/route');
      const descricao = gerarDescricaoPagamento(
        'boleto',
        3,
        3000.0,
        new Date('2025-12-22')
      );

      expect(descricao).toContain('parcelado');
      expect(descricao).toContain('3x');
      expect(descricao).toContain('R$ 1.000,00');
      expect(descricao).toContain('BOLETO');
      expect(descricao).toMatch(/\d{2}\/\d{2}/); // Deve ter vencimentos formatados
    });
  });

  describe('gerarDetalhesParcelas', () => {
    it('deve gerar array de parcelas corretamente', () => {
      const { gerarDetalhesParcelas } = require('@/app/api/recibo/gerar/route');
      const parcelas = gerarDetalhesParcelas(3, 3000.0, new Date('2025-12-22'));

      expect(parcelas).toHaveLength(3);
      expect(parcelas[0]).toMatchObject({
        parcela: 1,
        valor: 1000.0,
        vencimento: expect.any(String),
      });
      expect(parcelas[2]).toMatchObject({
        parcela: 3,
        valor: 1000.0,
      });
    });

    it('deve incrementar vencimentos mensalmente', () => {
      const { gerarDetalhesParcelas } = require('@/app/api/recibo/gerar/route');
      const parcelas = gerarDetalhesParcelas(2, 2000.0, new Date('2025-01-15'));

      const venc1 = new Date(parcelas[0].vencimento);
      const venc2 = new Date(parcelas[1].vencimento);

      expect(venc2.getMonth()).toBe((venc1.getMonth() + 1) % 12);
    });
  });
});
