/**
 * Testes para API de verificação de pagamento
 * Endpoint: /api/contratante/verificar-pagamento
 */

import { query } from '@/lib/db';
import { NextRequest } from 'next/server';
import {
  createTestContratante,
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

describe('API Verificar Pagamento', () => {
  let contratanteComPagamento: number;
  let contratanteSemPagamento: number;
  let contratantePendente: number;
  let contratoComPagamento: number;
  let contratoSemPagamento: number;
  let contratoPendente: number;

  beforeAll(async () => {
    // Criar contratante COM pagamento confirmado
    contratanteComPagamento = await createTestContratante({
      nome: 'Empresa Com Pagamento',
      status: 'pago', // Status que indica pagamento confirmado
    });
    contratoComPagamento = await createTestContrato({
      contratante_id: contratanteComPagamento,
      conteudo_gerado: 'Contrato ativo',
    });
    // Atualizar contrato para status 'aprovado' que o endpoint espera
    await query(`UPDATE contratos SET status = 'aprovado' WHERE id = $1`, [
      contratoComPagamento,
    ]);
    // Atualizar contratante para ter pagamento confirmado
    await query(
      `UPDATE contratantes SET pagamento_confirmado = true WHERE id = $1`,
      [contratanteComPagamento]
    );
    await createTestPagamento({
      contratante_id: contratanteComPagamento,
      contrato_id: contratoComPagamento,
      status: 'pago',
    });

    // Criar contratante SEM pagamento
    contratanteSemPagamento = await createTestContratante({
      nome: 'Empresa Sem Pagamento',
      status: 'aguardando_pagamento',
    });
    contratoSemPagamento = await createTestContrato({
      contratante_id: contratanteSemPagamento,
      conteudo_gerado: 'Contrato pendente',
    });

    // Criar contratante com status PENDENTE
    contratantePendente = await createTestContratante({
      nome: 'Empresa Pendente',
      status: 'aguardando_pagamento',
    });
    contratoPendente = await createTestContrato({
      contratante_id: contratantePendente,
      conteudo_gerado: 'Contrato aguardando pagamento',
    });
  });

  afterAll(async () => {
    // Limpar dados de teste usando helper
    await cleanupTestData();
  });

  describe('GET /api/contratante/verificar-pagamento', () => {
    it('deve retornar erro 400 se contratante_id não for fornecido', async () => {
      const { GET } =
        await import('@/app/api/contratante/verificar-pagamento/route');

      const mockRequest = {
        nextUrl: new URL(
          'http://localhost:3000/api/contratante/verificar-pagamento'
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('obrigatório');
    });

    it('deve retornar erro 404 se contratante não existir', async () => {
      const { GET } =
        await import('@/app/api/contratante/verificar-pagamento/route');

      const mockRequest = {
        nextUrl: new URL(
          'http://localhost:3000/api/contratante/verificar-pagamento?contratante_id=999999'
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('não encontrado');
    });

    it('deve confirmar acesso liberado para contratante com pagamento', async () => {
      const { GET } =
        await import('@/app/api/contratante/verificar-pagamento/route');

      const mockRequest = {
        nextUrl: new URL(
          `http://localhost:3000/api/contratante/verificar-pagamento?contratante_id=${contratanteComPagamento}`
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.contratante.pagamento_confirmado).toBe(true);
      expect(data.needs_payment).toBe(false);
      expect(data.access_granted).toBe(true);
      expect(data.payment_link).toBeNull();
      expect(data.message).toContain('confirmado');
    });

    it('deve indicar necessidade de pagamento para contratante sem pagamento', async () => {
      const { GET } =
        await import('@/app/api/contratante/verificar-pagamento/route');

      const mockRequest = {
        nextUrl: new URL(
          `http://localhost:3000/api/contratante/verificar-pagamento?contratante_id=${contratanteSemPagamento}`
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.contratante.pagamento_confirmado).toBe(false);
      expect(data.needs_payment).toBe(true);
      expect(data.access_granted).toBe(false);
      expect(data.payment_link).toBeTruthy();
      expect(data.payment_link).toContain('/pagamento/simulador');
      expect(data.message).toContain('pendente');
    });

    it('deve gerar link de pagamento para contratante com status pendente', async () => {
      const { GET } =
        await import('@/app/api/contratante/verificar-pagamento/route');

      const mockRequest = {
        nextUrl: new URL(
          `http://localhost:3000/api/contratante/verificar-pagamento?contratante_id=${contratantePendente}`
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.needs_payment).toBe(true);
      expect(data.payment_link).toBeTruthy();
      expect(data.payment_link).toContain('retry=true');
      expect(data.payment_link).toContain(
        `contratante_id=${contratantePendente}`
      );
      expect(data.payment_link).toContain(`contrato_id=${contratoPendente}`);
    });

    it('deve retornar dados do contrato e plano quando existirem', async () => {
      const { GET } =
        await import('@/app/api/contratante/verificar-pagamento/route');

      const mockRequest = {
        nextUrl: new URL(
          `http://localhost:3000/api/contratante/verificar-pagamento?contratante_id=${contratanteComPagamento}`
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.contrato).toBeDefined();
      expect(data.contrato.id).toBe(contratoComPagamento);
      expect(data.contrato.status).toBe('aprovado');
      expect(data.contrato.numero_funcionarios).toBe(10);
      expect(data.contrato.plano).toBeDefined();
      expect(data.contrato.plano.id).toBe(1);
    });

    it('deve retornar dados do pagamento quando existir', async () => {
      const { GET } =
        await import('@/app/api/contratante/verificar-pagamento/route');

      const mockRequest = {
        nextUrl: new URL(
          `http://localhost:3000/api/contratante/verificar-pagamento?contratante_id=${contratanteComPagamento}`
        ),
      } as NextRequest;

      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.pagamento).toBeDefined();
      expect(data.pagamento.status).toBe('pago');
      expect(data.pagamento.metodo).toBe('pix');
      expect(parseFloat(data.pagamento.valor)).toBe(200.0);
    });
  });
});
