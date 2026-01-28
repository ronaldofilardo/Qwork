/**
 * Testes para API de Consentimento LGPD
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/consentimento/route';
import { query } from '@/lib/db';

// Mock das dependências
jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = jest.requireMock('@/lib/session').requireAuth;

describe('API Consentimento - LGPD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/consentimento', () => {
    const mockSession = {
      cpf: '12345678909',
      perfil: 'funcionario' as const,
      clinica_id: 1,
      nome: 'João Silva',
    };

    it('deve registrar consentimento com sucesso', async () => {
      mockRequireAuth.mockResolvedValue(mockSession);

      // Mock da verificação da avaliação
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, funcionario_cpf: '12345678909', nome: 'João Silva' }],
        rowCount: 1,
      });

      // Mock do UPDATE
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            base_legal: 'consentimento',
            data_consentimento: new Date(),
            ip_consentimento: '192.168.1.1',
          },
        ],
        rowCount: 1,
      });

      const request = new NextRequest('http://localhost/api/consentimento', {
        method: 'POST',
        body: JSON.stringify({
          avaliacao_id: 1,
          base_legal: 'consentimento',
          consentimento_explicito: true,
          documento_consentimento: 'hash123',
        }),
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.consentimento.base_legal).toBe('consentimento');
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('deve rejeitar base legal inválida', async () => {
      mockRequireAuth.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost/api/consentimento', {
        method: 'POST',
        body: JSON.stringify({
          avaliacao_id: 1,
          base_legal: 'base_invalida',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('base_legal inválida');
    });

    it('deve exigir consentimento explícito para base "consentimento"', async () => {
      mockRequireAuth.mockResolvedValue(mockSession);

      const request = new NextRequest('http://localhost/api/consentimento', {
        method: 'POST',
        body: JSON.stringify({
          avaliacao_id: 1,
          base_legal: 'consentimento',
          consentimento_explicito: false,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('consentimento_explicito=true');
    });

    it('deve rejeitar acesso não autorizado', async () => {
      const sessionOutroUsuario = {
        ...mockSession,
        cpf: '52998224725', // CPF diferente
      };
      mockRequireAuth.mockResolvedValue(sessionOutroUsuario);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, funcionario_cpf: '12345678909', nome: 'João Silva' }],
        rowCount: 1,
      });

      const request = new NextRequest('http://localhost/api/consentimento', {
        method: 'POST',
        body: JSON.stringify({
          avaliacao_id: 1,
          base_legal: 'contrato',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Sem permissão');
    });

    it('deve permitir acesso para RH/Admin', async () => {
      const sessionRH = {
        ...mockSession,
        perfil: 'rh' as const,
        cpf: '52998224725', // CPF diferente do funcionário
      };
      mockRequireAuth.mockResolvedValue(sessionRH);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, funcionario_cpf: '12345678909', nome: 'João Silva' }],
        rowCount: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            base_legal: 'contrato',
            data_consentimento: new Date(),
            ip_consentimento: null,
          },
        ],
        rowCount: 1,
      });

      const request = new NextRequest('http://localhost/api/consentimento', {
        method: 'POST',
        body: JSON.stringify({
          avaliacao_id: 1,
          base_legal: 'contrato',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('GET /api/consentimento', () => {
    const mockSession = {
      cpf: '12345678909',
      perfil: 'funcionario' as const,
      clinica_id: 1,
      nome: 'João Silva',
    };

    it('deve consultar consentimento com sucesso', async () => {
      mockRequireAuth.mockResolvedValue(mockSession);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            base_legal: 'consentimento',
            data_consentimento: new Date(),
            ip_consentimento: '192.168.1.1',
            consentimento_documento: 'hash123',
            funcionario_nome: 'João Silva',
          },
        ],
        rowCount: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ funcionario_cpf: '12345678909' }],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost/api/consentimento?avaliacao_id=1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.consentimento.base_legal).toBe('consentimento');
      expect(data.consentimento.funcionario).toBe('Você'); // Próprio funcionário
    });

    it('deve mostrar nome do funcionário para RH/Admin', async () => {
      const sessionRH = {
        ...mockSession,
        perfil: 'rh' as const,
      };
      mockRequireAuth.mockResolvedValue(sessionRH);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            base_legal: 'contrato',
            data_consentimento: new Date(),
            ip_consentimento: null,
            consentimento_documento: null,
            funcionario_nome: 'João Silva',
          },
        ],
        rowCount: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ funcionario_cpf: '12345678909' }],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost/api/consentimento?avaliacao_id=1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.consentimento.funcionario).toBe('João Silva'); // Nome completo para RH
    });

    it('deve rejeitar avaliação não encontrada', async () => {
      mockRequireAuth.mockResolvedValue(mockSession);

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const request = new NextRequest(
        'http://localhost/api/consentimento?avaliacao_id=999'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Avaliação não encontrada');
    });

    it('deve rejeitar acesso não autorizado', async () => {
      const sessionOutroUsuario = {
        ...mockSession,
        cpf: '52998224725', // CPF diferente
      };
      mockRequireAuth.mockResolvedValue(sessionOutroUsuario);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            base_legal: 'contrato',
            data_consentimento: new Date(),
            ip_consentimento: null,
            consentimento_documento: null,
            funcionario_nome: 'João Silva',
          },
        ],
        rowCount: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ funcionario_cpf: '12345678909' }],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost/api/consentimento?avaliacao_id=1'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Sem permissão');
    });
  });
});
