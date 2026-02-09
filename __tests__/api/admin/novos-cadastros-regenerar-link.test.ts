/**
 * Testes para API /api/admin/novos-cadastros - Ação 'regenerar_link'
 * - Regeneração de links para tomadors aguardando pagamento
 * - Lógica direta sem chamadas HTTP
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/novos-cadastros/route';
import { query, gettomadorById } from '@/lib/db';

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
const mockGettomadorById = gettomadorById as jest.MockedFunction<
  typeof gettomadorById
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
    it('deve regenerar link com sucesso para plano fixo', async () => {
      const tomadorId = 1;

      // Mock do gettomadorById
      mockGettomadorById.mockResolvedValueOnce({
        id: tomadorId,
        nome: 'Clínica Teste',
        status: 'aguardando_pagamento',
        plano_tipo: 'fixo',
        plano_id: 1,
        numero_funcionarios_estimado: 10,
        pagamento_confirmado: false,
        ativa: false,
      });

      // Mock da busca de dados do tomador
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
        'http://localhost:3000/api/admin/novos-cadastros',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: tomadorId,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tomador.link_pagamento).toContain(
        '/pagamento/simulador?tomador_id='
      );
      expect(data.tomador.link_pagamento).toContain('plano_id=');
      expect(data.tomador.status).toBe('aguardando_pagamento');
      expect(data.message).toBe('Link de pagamento regenerado com sucesso');
    });

    it('deve regenerar link com sucesso para plano personalizado', async () => {
      const tomadorId = 2;

      // Mock do gettomadorById
      mockGettomadorById.mockResolvedValueOnce({
        id: tomadorId,
        nome: 'Empresa Teste',
        status: 'aguardando_pagamento',
        plano_tipo: 'personalizado',
        plano_id: 2,
        numero_funcionarios_estimado: 5,
        pagamento_confirmado: false,
        ativa: false,
      });

      // Mock da busca de dados do tomador
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

      // Mock da busca do contrato
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            numero_funcionarios: 5,
            valor_total: 250.0,
          },
        ],
        rowCount: 1,
      });

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
        'http://localhost:3000/api/admin/novos-cadastros',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: tomadorId,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tomador.link_pagamento).toContain(
        '/pagamento/simulador?tomador_id='
      );
      expect(data.tomador.link_pagamento).toContain('plano_id=');
      expect(data.tomador.status).toBe('aguardando_pagamento');
    });

    it('deve regenerar link para plano personalizado usando contratacao_personalizada quando não existem contratos', async () => {
      const tomadorId = 3;

      // Mock do gettomadorById
      mockGettomadorById.mockResolvedValueOnce({
        id: tomadorId,
        nome: 'Empresa Teste 2',
        status: 'aguardando_pagamento',
        plano_tipo: 'personalizado',
        plano_id: 3,
        numero_funcionarios_estimado: 8,
        pagamento_confirmado: false,
        ativa: false,
      });

      // Mock da busca de dados do tomador
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: tomadorId,
            nome: 'Empresa Teste 2',
            cnpj: '98765432000199',
            responsavel_nome: 'Pedro Lopes',
            responsavel_email: 'pedro@teste.com',
            status: 'aguardando_pagamento',
            plano_id: 3,
            numero_funcionarios_estimado: 8,
            ativa: false,
            pagamento_confirmado: false,
            plano_nome: 'Plano Personalizado Light',
            plano_tipo: 'personalizado',
            plano_preco: null,
            plano_caracteristicas: null,
          },
        ],
        rowCount: 1,
      });

      // Mock da busca do contrato (vazio)
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      // Mock da busca em contratacao_personalizada
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 77,
            numero_funcionarios_estimado: 8,
            valor_por_funcionario: 15.0,
            valor_total_estimado: 120.0,
          },
        ],
        rowCount: 1,
      });

      // Mock da inserção do token
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 3 }],
        rowCount: 1,
      });

      // Mock da atualização do tomador
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
            id: tomadorId,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // como é personalizado, link deve apontar para pagamento/personalizado
      expect(data.tomador.link_pagamento).toContain(
        '/pagamento/personalizado?tomador_id='
      );
      expect(data.tomador.link_pagamento).toContain('plano_id=');
      expect(data.tomador.status).toBe('aguardando_pagamento');
    });

    it('deve rejeitar regeneração para tomador não aguardando pagamento', async () => {
      const tomadorId = 1;

      // Mock do gettomadorById com status diferente
      mockGettomadorById.mockResolvedValueOnce({
        id: tomadorId,
        nome: 'Clínica Teste',
        status: 'aprovado', // Status diferente
        plano_tipo: 'fixo',
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
            id: tomadorId,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain(
        'Regeneração de link só é permitida para tomadors aguardando pagamento'
      );
    });

    it('deve rejeitar tomador já ativo', async () => {
      const tomadorId = 1;

      // Mock do gettomadorById
      mockGettomadorById.mockResolvedValueOnce({
        id: tomadorId,
        nome: 'Clínica Teste',
        status: 'aguardando_pagamento',
        plano_tipo: 'fixo',
        plano_id: 1,
        numero_funcionarios_estimado: 10,
        pagamento_confirmado: false,
        ativa: false,
      });

      // Mock da busca de dados com tomador ativo
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: tomadorId,
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
            id: tomadorId,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('já está ativo');
    });

    it('deve rejeitar tomador com pagamento já confirmado', async () => {
      const tomadorId = 1;

      // Mock do gettomadorById
      mockGettomadorById.mockResolvedValueOnce({
        id: tomadorId,
        nome: 'Clínica Teste',
        status: 'aguardando_pagamento',
        plano_tipo: 'fixo',
        plano_id: 1,
        numero_funcionarios_estimado: 10,
        pagamento_confirmado: false,
        ativa: false,
      });

      // Mock da busca de dados com pagamento confirmado
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: tomadorId,
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
            id: tomadorId,
            acao: 'regenerar_link',
          }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('já tem pagamento confirmado');
    });

    it('deve rejeitar plano personalizado sem contrato', async () => {
      const tomadorId = 2;

      // Mock do gettomadorById
      mockGettomadorById.mockResolvedValueOnce({
        id: tomadorId,
        nome: 'Empresa Teste',
        status: 'aguardando_pagamento',
        plano_tipo: 'personalizado',
        plano_id: 2,
        numero_funcionarios_estimado: 5,
        pagamento_confirmado: false,
        ativa: false,
      });

      // Mock da busca de dados do tomador
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: tomadorId,
            plano_tipo: 'personalizado',
            ativa: false,
            pagamento_confirmado: false,
          },
        ],
        rowCount: 1,
      });

      // Mock da busca do contrato (vazio)
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/novos-cadastros',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: tomadorId,
            acao: 'regenerar_link',
          }),
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

    it('deve rejeitar tomador não encontrado', async () => {
      mockGettomadorById.mockResolvedValueOnce(null);

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
      expect(data.error).toContain('tomador não encontrado');
    });
  });
});
