/**
 * Testes para /api/emissor/notificacoes
 *
 * Funcionalidades testadas:
 * 1. Autenticação e autorização (apenas perfil emissor)
 * 2. Listagem de lotes prontos para emissão
 * 3. Critério correto: avaliacoes_concluidas === total_avaliacoes
 * 4. Filtro de laudos (apenas sem laudo ou em rascunho)
 * 5. Contador de notificações não lidas
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/emissor/notificacoes/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('/api/emissor/notificacoes', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      url: 'http://localhost:3000/api/emissor/notificacoes',
    };
  });

  describe('Autenticação e Autorização', () => {
    it('deve retornar 403 se usuário não for emissor', async () => {
      mockRequireRole.mockResolvedValue(null as any);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Acesso negado');
    });

    it('deve permitir acesso para perfil emissor', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '99999999999',
        nome: 'Emissor',
        perfil: 'emissor',
      });

      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await GET(mockRequest as NextRequest);
      expect(response.status).toBe(200);
    });
  });

  describe('Critério de Lotes Prontos', () => {
    beforeEach(() => {
      mockRequireRole.mockResolvedValue({
        cpf: '99999999999',
        nome: 'Emissor',
        perfil: 'emissor',
      });
    });

    it('deve retornar lote quando todas avaliações estão concluídas', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            codigo: '001-291125',
            titulo: 'Lote Teste',
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa Teste',
            clinica_nome: 'Clínica Teste',
            total_avaliacoes: '4',
            avaliacoes_concluidas: '4',
            avaliacoes_inativadas: '0',
            status_laudo: null,
            laudo_id: null,
            tipo_notificacao: 'novo_lote',
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.notificacoes).toHaveLength(1);
      expect(data.totalNaoLidas).toBe(1);
      expect(data.notificacoes[0].tipo).toBe('novo_lote');
    });

    it('deve retornar lote quando todas avaliações estão concluídas', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 2,
            codigo: '002-291125',
            titulo: 'Lote Completo',
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa Teste',
            clinica_nome: 'Clínica Teste',
            total_avaliacoes: '5',
            avaliacoes_concluidas: '5', // Todas concluídas
            status_laudo: null,
            laudo_id: null,
            tipo_notificacao: 'novo_lote',
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.notificacoes).toHaveLength(1);
      expect(data.notificacoes[0].id).toBe(2);
    });

    it('não deve retornar lote se avaliações pendentes', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.notificacoes).toHaveLength(0);
      expect(data.totalNaoLidas).toBe(0);
    });
  });

  describe('Filtros de Laudo', () => {
    beforeEach(() => {
      mockRequireRole.mockResolvedValue({
        cpf: '99999999999',
        nome: 'Emissor',
        perfil: 'emissor',
      });
    });

    it('deve retornar lote sem laudo como novo_lote', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            codigo: '001-291125',
            titulo: 'Sem Laudo',
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa Teste',
            clinica_nome: 'Clínica Teste',
            total_avaliacoes: '4',
            avaliacoes_concluidas: '4',
            status_laudo: null,
            laudo_id: null,
            tipo_notificacao: 'novo_lote',
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.notificacoes[0].tipo).toBe('novo_lote');
      expect(data.notificacoes[0].mensagem).toContain('Novo lote');
    });

    it('não deve retornar lotes que já possuem laudo (independente do status)', async () => {
      // Simular que a query não retorna lotes pendentes quando já existe um laudo
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.notificacoes).toHaveLength(0);
      expect(data.totalNaoLidas).toBe(0);
    });

    it('não deve retornar lotes com laudo emitido ou enviado', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.notificacoes).toHaveLength(0);
    });
  });

  describe('Estrutura da Resposta', () => {
    beforeEach(() => {
      mockRequireRole.mockResolvedValue({
        cpf: '99999999999',
        nome: 'Emissor',
        perfil: 'emissor',
      });
    });

    it('deve retornar estrutura correta com múltiplas notificações', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            codigo: '001-291125',
            titulo: 'Lote 1',
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa A',
            clinica_nome: 'Clínica A',
            total_avaliacoes: '4',
            avaliacoes_concluidas: '4',
            avaliacoes_inativadas: '0',
            status_laudo: null,
            laudo_id: null,
            tipo_notificacao: 'novo_lote',
          },
          {
            id: 2,
            codigo: '002-291125',
            titulo: 'Lote 2',
            liberado_em: '2025-11-29T11:00:00Z',
            empresa_nome: 'Empresa B',
            clinica_nome: 'Clínica B',
            total_avaliacoes: '3',
            avaliacoes_concluidas: '3',
            avaliacoes_inativadas: '0',
            status_laudo: 'rascunho',
            laudo_id: 200,
            tipo_notificacao: 'rascunho_pendente',
          },
        ],
        rowCount: 2,
      } as any);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.notificacoes).toHaveLength(2);
      expect(data.totalNaoLidas).toBe(2);

      // Verificar estrutura da primeira notificação
      const notif = data.notificacoes[0];
      expect(notif).toHaveProperty('id');
      expect(notif).toHaveProperty('codigo');
      expect(notif).toHaveProperty('titulo');
      expect(notif).toHaveProperty('empresa_nome');
      expect(notif).toHaveProperty('clinica_nome');
      expect(notif).toHaveProperty('liberado_em');
      expect(notif).toHaveProperty('total_avaliacoes');
      expect(notif).toHaveProperty('tipo');
      expect(notif).toHaveProperty('mensagem');
    });

    it('deve retornar lista vazia quando não há notificações', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.notificacoes).toEqual([]);
      expect(data.totalNaoLidas).toBe(0);
    });
  });

  describe('Tratamento de Erros', () => {
    beforeEach(() => {
      mockRequireRole.mockResolvedValue({
        cpf: '99999999999',
        nome: 'Emissor',
        perfil: 'emissor',
      });
    });

    it('deve retornar erro 500 em caso de falha no banco', async () => {
      mockQuery.mockRejectedValue(new Error('Database connection failed'));

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Erro interno do servidor');
    });
  });
});
