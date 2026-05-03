/**
 * Testes para API /api/admin/novos-cadastros - Ação 'regenerar_link'
 * - Regeneração de links para contratantes aguardando pagamento
 * - Lógica direta sem chamadas HTTP
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/novos-cadastros/route';
import { query, getContratanteById } from '@/lib/db';

// Mocks
jest.mock('@/lib/db');
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));
jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn(),
  extractRequestInfo: jest.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  })),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetContratanteById = getContratanteById as jest.MockedFunction<
  typeof getContratanteById
>;
const { getSession } = require('@/lib/session');
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe('/api/admin/novos-cadastros - regenerar_link', () => {
  let mockSession: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSession = {
      cpf: '12345678901',
      perfil: 'admin',
      nome: 'Admin Teste',
    };

    // Configure mock - getSession retorna diretamente (síncrono)
    mockGetSession.mockReturnValue(mockSession);
  });

  describe('POST - regenerar_link', () => {
    it('deve regenerar link com sucesso', async () => {
      const contratanteId = 1;

      // Mock do getContratanteById
      mockGetContratanteById.mockResolvedValueOnce({
        id: contratanteId,
        nome: 'Clínica Teste',
        status: 'aguardando_pagamento',
        plano_id: 1,
        numero_funcionarios_estimado: 10,
        pagamento_confirmado: false,
        ativa: false,
      });

      // Mock da busca de dados do contratante
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: contratanteId,
            nome: 'Clínica Teste',
            cnpj: '12345678000123',
            responsavel_nome: 'João Silva',
            responsavel_email: 'joao@teste.com',
            status: 'aguardando_pagamento',
            plano_id: 1,
            numero_funcionarios_estimado: 10,
            ativa: false,
            pagamento_confirmado: false,
            plano_nome: 'Plano Padrão',
            plano_preco: 20.0,
            plano_caracteristicas: { limite_funcionarios: 50 },
          },
        ],
        rowCount: 1,
      });

      // Mock da inserção do token
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      });

      // Mock da atualização do contratante
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/novos-cadastros',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contratanteId,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.contratante.link_pagamento).toContain(
        '/pagamento/simulador?contratante_id='
      );
      expect(data.contratante.link_pagamento).toContain('plano_id=');
      expect(data.contratante.status).toBe('aguardando_pagamento');
      expect(data.message).toBe('Link de pagamento regenerado com sucesso');
    });

    it('deve rejeitar regeneração para contratante não aguardando pagamento', async () => {
      const contratanteId = 1;

      // Mock do getContratanteById com status diferente
      mockGetContratanteById.mockResolvedValueOnce({
        id: contratanteId,
        nome: 'Clínica Teste',
        status: 'aprovado', // Status diferente
        plano_id: 1,
        numero_funcionarios_estimado: 10,
        pagamento_confirmado: true,
        ativa: true,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/novos-cadastros',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contratanteId,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain(
        'Regeneração de link só é permitida para contratantes aguardando pagamento'
      );
    });

    it('deve rejeitar contratante já ativo', async () => {
      const contratanteId = 1;

      // Mock do getContratanteById
      mockGetContratanteById.mockResolvedValueOnce({
        id: contratanteId,
        nome: 'Clínica Teste',
        status: 'aguardando_pagamento',
        plano_id: 1,
        numero_funcionarios_estimado: 10,
        pagamento_confirmado: false,
        ativa: false,
      });

      // Mock da busca de dados com contratante ativo
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: contratanteId,
            ativa: true, // Já ativo
            pagamento_confirmado: false,
          },
        ],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/novos-cadastros',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contratanteId,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('já está ativo');
    });

    it('deve rejeitar contratante com pagamento já confirmado', async () => {
      const contratanteId = 1;

      // Mock do getContratanteById
      mockGetContratanteById.mockResolvedValueOnce({
        id: contratanteId,
        nome: 'Clínica Teste',
        status: 'aguardando_pagamento',
        plano_id: 1,
        numero_funcionarios_estimado: 10,
        pagamento_confirmado: false,
        ativa: false,
      });

      // Mock da busca de dados com pagamento confirmado
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: contratanteId,
            ativa: false,
            pagamento_confirmado: true, // Já confirmado
          },
        ],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/novos-cadastros',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contratanteId,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('já tem pagamento confirmado');
    });
  });

  describe('Validações gerais', () => {
    it('deve rejeitar acesso sem sessão de admin', async () => {
      // Sobrescrever o mock para retornar null apenas neste teste
      mockGetSession.mockReturnValueOnce(null);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/novos-cadastros',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 1,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('deve rejeitar ação inválida', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/admin/novos-cadastros',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 1,
            acao: 'acao_invalida',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Ação inválida');
    });

    it('deve rejeitar contratante não encontrado', async () => {
      mockGetContratanteById.mockResolvedValueOnce(null);

      const request = new NextRequest(
        'http://localhost:3000/api/admin/novos-cadastros',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 999,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Contratante não encontrado');
    });
  });
});
