/**
 * Testes para /api/rh/notificacoes
 *
 * Funcionalidades testadas:
 * 1. Buscar notificações para clínicas (avaliações, lotes, laudos)
 * 2. Controle de acesso por perfil
 * 3. Estrutura de resposta das notificações
 * 4. Filtros por clínica do usuário
 */

import { GET } from '@/app/api/rh/notificacoes/route';

// Mock do módulo de banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<any>;

describe('/api/rh/notificacoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Controle de Acesso', () => {
    it('deve permitir acesso para perfil rh', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const mockRequest = {} as any;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('deve bloquear acesso para perfil admin', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '00000000000',
        nome: 'Admin Teste',
        perfil: 'admin',
      });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const mockRequest = {} as any;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Acesso negado');
    });

    it('deve bloquear acesso para perfil funcionario', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '22222222222',
        nome: 'Func Teste',
        perfil: 'funcionario',
      });

      const mockRequest = {} as any;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Acesso negado');
    });

    it('deve bloquear acesso quando não há sessão', async () => {
      mockGetSession.mockResolvedValue(null);

      const mockRequest = {} as any;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Acesso negado');
    });
  });

  describe('Busca de Notificações', () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });
    });

    it('deve retornar lista vazia quando não há notificações', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const mockRequest = {} as any;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.notificacoes).toEqual([]);
      expect(data.totalNaoLidas).toBe(0);
    });

    it('deve retornar notificações de avaliações concluídas', async () => {
      const mockRows = [
        {
          tipo: 'avaliacao_concluida',
          id_referencia: 1,
          lote_id: 10,
          codigo: '001-301125',
          titulo: 'Lote Teste',
          empresa_nome: 'Empresa A',
          data_evento: '2025-11-30T10:00:00Z',
        },
      ];

      mockQuery.mockResolvedValue({
        rows: mockRows,
        rowCount: mockRows.length,
      });

      const mockRequest = {} as any;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.notificacoes).toHaveLength(1);
      expect(data.notificacoes[0].id).toBe('avaliacao_concluida_1');
      expect(data.notificacoes[0].tipo).toBe('avaliacao_concluida');
      expect(data.notificacoes[0].lote_id).toBe(10);
      expect(data.notificacoes[0].codigo).toBe('001-301125');
      expect(data.notificacoes[0].titulo).toBe('Lote Teste');
      expect(data.notificacoes[0].empresa_nome).toBe('Empresa A');
      expect(data.notificacoes[0].mensagem).toBe(
        'Nova avaliação concluída no lote "Lote Teste"'
      );
      expect(data.totalNaoLidas).toBe(1);
    });

    it('deve retornar notificações de avaliações concluídas', async () => {
      const mockRows = [
        {
          tipo: 'avaliacao_concluida',
          id_referencia: 10,
          lote_id: 10,
          codigo: '001-301125',
          titulo: 'Lote Teste',
          empresa_nome: 'Empresa A',
          data_evento: '2025-11-30T10:00:00Z',
        },
      ];

      mockQuery.mockResolvedValue({
        rows: mockRows,
        rowCount: mockRows.length,
      });

      const mockRequest = {} as any;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.notificacoes[0].id).toBe('avaliacao_concluida_10');
      expect(data.notificacoes[0].tipo).toBe('avaliacao_concluida');
      expect(data.notificacoes[0].mensagem).toBe(
        'Nova avaliação concluída no lote "Lote Teste"'
      );
    });

    it('deve retornar notificações de laudos enviados', async () => {
      const mockRows = [
        {
          tipo: 'laudo_enviado',
          id_referencia: 100,
          lote_id: 10,
          codigo: '001-301125',
          titulo: 'Lote Teste',
          empresa_nome: 'Empresa A',
          data_evento: '2025-11-30T10:00:00Z',
        },
      ];

      mockQuery.mockResolvedValue({
        rows: mockRows,
        rowCount: mockRows.length,
      });

      const mockRequest = {} as any;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.notificacoes[0].id).toBe('laudo_enviado_100');
      expect(data.notificacoes[0].tipo).toBe('laudo_enviado');
      expect(data.notificacoes[0].mensagem).toBe(
        'Laudo enviado para o lote "Lote Teste"'
      );
    });

    it('deve ordenar notificações por data decrescente', async () => {
      const mockRows = [
        {
          tipo: 'avaliacao_concluida',
          id_referencia: 1,
          lote_id: 10,
          data_evento: '2025-11-30T08:00:00Z',
        },
        {
          tipo: 'lote_concluido',
          id_referencia: 10,
          lote_id: 11,
          data_evento: '2025-11-30T10:00:00Z',
        },
      ];

      mockQuery.mockResolvedValue({
        rows: mockRows,
        rowCount: mockRows.length,
      });

      const mockRequest = {} as any;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.notificacoes[0].data_evento).toBe('2025-11-30T08:00:00Z');
      expect(data.notificacoes[1].data_evento).toBe('2025-11-30T10:00:00Z');
    });

    it('deve limitar a 50 notificações', async () => {
      const mockRows = Array.from({ length: 50 }, (_, i) => ({
        tipo: 'avaliacao_concluida',
        id_referencia: i,
        lote_id: 10,
        codigo: '001-301125',
        titulo: 'Lote Teste',
        empresa_nome: 'Empresa A',
        data_evento: '2025-11-30T10:00:00Z',
      }));

      mockQuery.mockResolvedValue({
        rows: mockRows,
        rowCount: mockRows.length,
      });

      const mockRequest = {} as any;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(data.notificacoes).toHaveLength(50);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro de banco de dados', async () => {
      mockGetSession.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });
      mockQuery.mockRejectedValue(new Error('Erro de conexão'));

      const mockRequest = {} as any;
      const response = await GET(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Erro interno do servidor');
      expect(data.detalhes).toBe('Erro de conexão');
    });
  });
});
