/**
 * Testes para API de verificação de pagamento
 * Endpoint: /api/tomador/verificar-pagamento
 */

import { query } from '@/lib/db';
import { NextRequest } from 'next/server';
import {
  createTesttomador,
  createTestContrato,
  createTestPagamento,
  cleanupTestData,
} from '../helpers/test-data-factory';

jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

function makeMockRequest(url: string): NextRequest {
  return {
    nextUrl: new URL(url),
    headers: { get: jest.fn().mockReturnValue(null) },
    ip: undefined,
  } as unknown as NextRequest;
}

describe('API Verificar Pagamento', () => {
  let tomadorComPagamento: number;
  let tomadorSemPagamento: number;
  let tomadorPendente: number;
  let contratoComPagamento: number;
  let contratoSemPagamento: number;
  let contratoPendente: number;

  beforeAll(async () => {
    // Criar tomador COM pagamento confirmado
    tomadorComPagamento = await createTesttomador({
      nome: 'Empresa Com Pagamento',
      status: 'aprovado', // entidade aprovada; pagamento confirmado via tabela pagamentos
    });
    contratoComPagamento = await createTestContrato({
      tomador_id: tomadorComPagamento,
    });
    // Atualizar contrato para status 'aprovado' que o endpoint espera
    await query(`UPDATE contratos SET status = 'aprovado' WHERE id = $1`, [
      contratoComPagamento,
    ]);
    await createTestPagamento({
      entidade_id: tomadorComPagamento,
      contrato_id: contratoComPagamento,
      status: 'pago',
    });

    // Criar tomador SEM pagamento
    tomadorSemPagamento = await createTesttomador({
      nome: 'Empresa Sem Pagamento',
      status: 'aguardando_pagamento',
    });
    contratoSemPagamento = await createTestContrato({
      tomador_id: tomadorSemPagamento,
    });

    // Criar tomador com status PENDENTE
    tomadorPendente = await createTesttomador({
      nome: 'Empresa Pendente',
      status: 'aguardando_pagamento',
    });
    contratoPendente = await createTestContrato({
      tomador_id: tomadorPendente,
    });
  });

  afterAll(async () => {
    // Limpar dados de teste usando helper
    await cleanupTestData();
  });

  describe('GET /api/tomador/verificar-pagamento', () => {
    it('deve retornar erro 400 se tomador_id não for fornecido', async () => {
      const { GET } =
        await import('@/app/api/tomador/verificar-pagamento/route');

      const mockRequest = makeMockRequest(
        'http://localhost:3000/api/tomador/verificar-pagamento'
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('obrigatório');
    });

    it('deve retornar erro 404 se tomador não existir', async () => {
      const { GET } =
        await import('@/app/api/tomador/verificar-pagamento/route');

      const mockRequest = makeMockRequest(
        'http://localhost:3000/api/tomador/verificar-pagamento?tomador_id=999999'
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('não encontrado');
    });

    it('deve confirmar acesso liberado para tomador com pagamento', async () => {
      const { GET } =
        await import('@/app/api/tomador/verificar-pagamento/route');

      const mockRequest = makeMockRequest(
        `http://localhost:3000/api/tomador/verificar-pagamento?tomador_id=${tomadorComPagamento}`
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.needs_payment).toBe(false);
      expect(data.access_granted).toBe(true);
      expect(data.payment_link).toBeNull();
      expect(data.message).toMatch(/liberado/i);
    });

    it('deve indicar necessidade de pagamento para tomador sem pagamento', async () => {
      const { GET } =
        await import('@/app/api/tomador/verificar-pagamento/route');

      const mockRequest = makeMockRequest(
        `http://localhost:3000/api/tomador/verificar-pagamento?tomador_id=${tomadorSemPagamento}`
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.needs_payment).toBe(true);
      expect(data.access_granted).toBe(false);
      expect(data.payment_link).toBeTruthy();
      expect(data.payment_link).toContain('/pagamento/simulador');
      expect(data.message).toMatch(/pendente|liberado/i);
    });

    it('deve gerar link de pagamento para tomador com status pendente', async () => {
      const { GET } =
        await import('@/app/api/tomador/verificar-pagamento/route');

      const mockRequest = makeMockRequest(
        `http://localhost:3000/api/tomador/verificar-pagamento?tomador_id=${tomadorPendente}`
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.needs_payment).toBe(true);
      expect(data.payment_link).toBeTruthy();
      expect(data.payment_link).toContain('retry=true');
      expect(data.payment_link).toContain(`tomador_id=${tomadorPendente}`);
      expect(data.payment_link).toContain(`contrato_id=${contratoPendente}`);
    });

    it('deve retornar dados do contrato e plano quando existirem', async () => {
      const { GET } =
        await import('@/app/api/tomador/verificar-pagamento/route');

      const mockRequest = makeMockRequest(
        `http://localhost:3000/api/tomador/verificar-pagamento?tomador_id=${tomadorComPagamento}`
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.contrato).toBeDefined();
      expect(data.contrato.id).toBe(contratoComPagamento);
      expect(data.contrato.status).toBe('aprovado');
      expect(data.contrato.numero_funcionarios).toBe(10);
    });

    it('deve retornar dados do pagamento quando existir', async () => {
      const { GET } =
        await import('@/app/api/tomador/verificar-pagamento/route');

      const mockRequest = makeMockRequest(
        `http://localhost:3000/api/tomador/verificar-pagamento?tomador_id=${tomadorComPagamento}`
      );

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.pagamento).toBeDefined();
      expect(data.pagamento.status).toBe('pago');
      expect(data.pagamento.metodo).toBe('pix');
      expect(parseFloat(data.pagamento.valor)).toBe(200.0);
    });
  });
});
