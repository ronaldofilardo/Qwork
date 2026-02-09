/**
 * Testes para API /api/admin/gerar-link-plano-fixo
 * - Suporte para planos fixos e personalizados
 * - Regeneração de links para tomadors aguardando pagamento
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/gerar-link-plano-fixo/route';
import { query } from '@/lib/db';

// Mocks
jest.mock('@/lib/db');
// Use factory mocks to avoid hoisting issues — factories create jest.fn internally
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));
jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
// Obtain references to the mocked functions after jest.mock has been processed
const mockGetSession = require('@/lib/session')
  .getSession as jest.MockedFunction<any>;
const mockLogAudit = require('@/lib/audit')
  .logAudit as jest.MockedFunction<any>;

describe('/api/admin/gerar-link-plano-fixo', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const mockSession = {
      cpf: '12345678901',
      perfil: 'admin',
      nome: 'Admin Teste',
    };

    mockGetSession.mockReturnValue(mockSession);
  });

  describe('POST - Gerar link para plano fixo', () => {
    it('deve gerar link com sucesso para plano fixo', async () => {
      const tomadorId = 1;

      // Mock dos dados do tomador
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: tomadorId,
            nome: 'Clínica Teste',
            cnpj: '12345678000123',
            responsavel_nome: 'João Silva',
            responsavel_email: 'joao@teste.com',
            status: 'aguardando_pagamento',
            plano_id: 1,
            numero_funcionarios_estimado: 10,
            ativa: false,
            pagamento_confirmado: false,
            plano_nome: 'Plano Fixo Básico',
            plano_tipo: 'fixo',
            plano_preco: 20.0,
            plano_caracteristicas: { limite_funcionarios: 50 },
          },
        ],
        rowCount: 1,
      });

      // Mock de resposta para BEGIN (transação) - consumido pelo BEGIN
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Mock do contrato existente (nenhum contrato existente)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Mock do INSERT do contrato (novo contrato)
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 10 }],
        rowCount: 1,
      });

      // Mock da inserção do token
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      // Mock da atualização do tomador
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/gerar-link-plano-fixo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tomador_id: tomadorId }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.payment_link).toContain(
        '/pagamento/simulador?tomador_id='
      );
      expect(data.data.payment_link).toContain('plano_id=');
      expect(data.data.payment_link).toContain('numero_funcionarios=10');
      expect(data.data.payment_info.plano_tipo).toBe('fixo');
      expect(data.data.payment_info.numero_funcionarios).toBe(10);
      expect(data.data.payment_info.valor_total).toBe(200); // 10 * 20
    });

    it('deve rejeitar tomador já ativo', async () => {
      const tomadorId = 1;

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: tomadorId,
            ativa: true,
            pagamento_confirmado: true,
          },
        ],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/gerar-link-plano-fixo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tomador_id: tomadorId }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('já está ativo');
    });

    it('deve rejeitar tomador com pagamento já confirmado', async () => {
      const tomadorId = 1;

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: tomadorId,
            ativa: false,
            pagamento_confirmado: true,
          },
        ],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/gerar-link-plano-fixo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tomador_id: tomadorId }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('já tem pagamento confirmado');
    });
  });

  describe('POST - Gerar link para plano personalizado', () => {
    it('deve gerar link com sucesso para plano personalizado', async () => {
      const tomadorId = 2;

      // Mock dos dados do tomador
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: tomadorId,
            nome: 'Empresa Teste',
            cnpj: '12345678000123',
            responsavel_nome: 'Maria Silva',
            responsavel_email: 'maria@teste.com',
            status: 'aguardando_pagamento',
            plano_id: 2,
            numero_funcionarios_estimado: 5,
            ativa: false,
            pagamento_confirmado: false,
            plano_nome: 'Plano Personalizado',
            plano_tipo: 'personalizado',
            plano_preco: null,
            plano_caracteristicas: null,
          },
        ],
        rowCount: 1,
      });

      // Mock de resposta para BEGIN (transação) - consumido pelo BEGIN
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Mock da busca do contrato (dados do contrato)
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            numero_funcionarios: 5,
            valor_total: 250.0,
          },
        ],
        rowCount: 1,
      });

      // Mock do contrato existente (nenhum contrato existente)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Mock do INSERT do contrato (novo contrato)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 20 }], rowCount: 1 });

      // Mock da inserção do token
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 2 }],
        rowCount: 1,
      });

      // Mock da atualização do tomador
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/gerar-link-plano-fixo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tomador_id: tomadorId }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.payment_link).toContain(
        '/pagamento/simulador?tomador_id='
      );
      expect(data.data.payment_link).toContain('plano_id=');
      expect(data.data.payment_link).toContain('numero_funcionarios=5');
      expect(data.data.payment_info.plano_tipo).toBe('personalizado');
      expect(data.data.payment_info.numero_funcionarios).toBe(5);
      expect(data.data.payment_info.valor_total).toBe(250);
    });

    it('deve rejeitar plano personalizado sem contrato', async () => {
      const tomadorId = 2;

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: tomadorId,
            plano_id: 2,
            plano_tipo: 'personalizado',
            ativa: false,
            pagamento_confirmado: false,
          },
        ],
        rowCount: 1,
      });

      // Mock de resposta para BEGIN (transação) - consumido pelo BEGIN
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Mock da busca do contrato (vazio)
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/gerar-link-plano-fixo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tomador_id: tomadorId }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Contrato não encontrado');
    });
  });

  describe('Validações gerais', () => {
    it('deve rejeitar acesso sem sessão de admin', async () => {
      // Override mock to simulate no session
      const mockGetSession = require('@/lib/session')
        .getSession as jest.MockedFunction<any>;
      mockGetSession.mockReturnValueOnce(null);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/gerar-link-plano-fixo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tomador_id: 1 }),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('deve rejeitar tomador não encontrado', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/gerar-link-plano-fixo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tomador_id: 999 }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('tomador não encontrado');
    });

    it('deve validar limite de funcionários para plano fixo', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            plano_id: 1,
            numero_funcionarios_estimado: 100,
            plano_tipo: 'fixo',
            plano_preco: 10,
            plano_caracteristicas: { limite_funcionarios: 50 },
            ativa: false,
            pagamento_confirmado: false,
          },
        ],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/gerar-link-plano-fixo',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tomador_id: 1 }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('excede o limite do plano');
    });
  });
});
