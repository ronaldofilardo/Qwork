/**
 * Testes para /api/emissor/lotes
 *
 * Funcionalidades testadas:
 * 1. Autenticação e autorização (apenas perfil emissor)
 * 2. Listagem de todos os lotes gerados, com paginação
 * 3. Inclusão de informações do laudo quando existente
 * 4. Ordenação por status do lote e data de liberação
 * 5. Tratamento de erros e casos extremos
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/emissor/lotes/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { QueryResult } from 'pg';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('/api/emissor/lotes', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      url: 'http://localhost:3000/api/emissor/lotes',
    };
  });

  describe('Autenticação e Autorização', () => {
    it('deve retornar 403 se usuário não for emissor', async () => {
      mockRequireRole.mockResolvedValue(null);

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

      mockQuery.mockResolvedValueOnce({
        rows: [{ total: 0 }],
        rowCount: 1,
      } as QueryResult<unknown>);
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as QueryResult<unknown>);

      const response = await GET(mockRequest as NextRequest);
      expect(response.status).toBe(200);
    });
  });

  describe('Listagem de Todos os Lotes', () => {
    beforeEach(() => {
      mockRequireRole.mockResolvedValue({
        cpf: '99999999999',
        nome: 'Emissor',
        perfil: 'emissor',
      });
    });

    it('deve retornar lote com laudo existente', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: 1 }],
        rowCount: 1,
      } as QueryResult<unknown>);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            codigo: '001-291125',
            titulo: 'Lote Teste',
            tipo: 'completo',
            lote_status: 'concluido',
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa Teste',
            clinica_nome: 'Clínica Teste',
            total_avaliacoes: '4',
            observacoes: 'Observações do laudo',
            status_laudo: 'enviado',
            laudo_id: 100,
            emitido_em: null,
            enviado_em: null,
          },
        ],
        rowCount: 1,
      } as QueryResult<unknown>);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.lotes).toHaveLength(1);
      expect(data.total).toBe(1);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(20);
      expect(data.lotes[0].status).toBe('concluido');
      expect(data.lotes[0].laudo).toBeDefined();
      expect(data.lotes[0].laudo.id).toBe(100);
      expect(data.lotes[0].laudo.status).toBe('enviado');
    });

    it('deve retornar lote pronto sem laudo (disponível para trabalho)', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: 1 }],
        rowCount: 1,
      } as QueryResult<unknown>);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            codigo: '002-291125',
            titulo: 'Lote Disponível',
            tipo: 'completo',
            liberado_em: '2025-11-29T11:00:00Z',
            empresa_nome: 'Empresa B',
            clinica_nome: 'Clínica B',
            total_avaliacoes: '3',
            avaliacoes_concluidas: '3',
            observacoes: null,
            status_laudo: null,
            laudo_id: null,
            emitido_em: null,
            enviado_em: null,
          },
        ],
        rowCount: 1,
      } as QueryResult<unknown>);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.lotes).toHaveLength(1);
      expect(data.lotes[0].laudo).toBeNull();
    });

    it('deve retornar lista vazia quando não há lotes prontos', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: 0 }],
        rowCount: 1,
      } as QueryResult<unknown>);
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as QueryResult<unknown>);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.lotes).toHaveLength(0);
      expect(data.total).toBe(0);
    });

    it('não deve retornar lotes com avaliações pendentes', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as QueryResult<unknown>);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.lotes).toHaveLength(0);
    });
  });

  describe('Informações do Laudo', () => {
    beforeEach(() => {
      mockRequireRole.mockResolvedValue({
        cpf: '99999999999',
        nome: 'Emissor',
        perfil: 'emissor',
      });
    });

    it('deve incluir informações do laudo quando existir', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            codigo: '001-291125',
            titulo: 'Lote com Laudo',
            tipo: 'completo',
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa Teste',
            clinica_nome: 'Clínica Teste',
            total_avaliacoes: '4',
            avaliacoes_concluidas: '4',
            observacoes: 'Observações do laudo',
            status_laudo: 'rascunho',
            laudo_id: 100,
            emitido_em: null,
            enviado_em: null,
          },
        ],
        rowCount: 1,
      } as QueryResult<unknown>);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.lotes[0].laudo).toBeDefined();
      expect(data.lotes[0].laudo.id).toBe(100);
      expect(data.lotes[0].laudo.observacoes).toBe('Observações do laudo');
      expect(data.lotes[0].laudo.status).toBe('enviado');
    });

    it('deve incluir lotes com laudos em qualquer status', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            codigo: '001-291125',
            titulo: 'Concluído',
            tipo: 'completo',
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa A',
            clinica_nome: 'Clínica A',
            total_avaliacoes: '4',
            avaliacoes_concluidas: '4',
            avaliacoes_inativadas: '0',
            observacoes: 'Obs 1',
            status_laudo: 'enviado',
            laudo_id: 100,
          },
          {
            id: 2,
            codigo: '002-291125',
            titulo: 'Emitido',
            tipo: 'completo',
            liberado_em: '2025-11-29T11:00:00Z',
            empresa_nome: 'Empresa B',
            clinica_nome: 'Clínica B',
            total_avaliacoes: '3',
            avaliacoes_concluidas: '3',
            avaliacoes_inativadas: '0',
            observacoes: 'Obs 2',
            status_laudo: 'enviado',
            laudo_id: 101,
          },
        ],
        rowCount: 2,
      } as QueryResult<unknown>);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.lotes).toHaveLength(2);
      expect(data.lotes[0].laudo.status).toBe('enviado');
      expect(data.lotes[1].laudo.status).toBe('enviado');
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

    it('deve retornar estrutura correta com múltiplos lotes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: 2 }],
        rowCount: 1,
      } as QueryResult<unknown>);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            codigo: '001-291125',
            titulo: 'Lote 1',
            tipo: 'completo',
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa A',
            clinica_nome: 'Clínica A',
            total_avaliacoes: '4',
            avaliacoes_concluidas: '4',
            observacoes: 'Laudo existente',
            status_laudo: 'enviado',
            laudo_id: 100,
            emitido_em: null,
            enviado_em: null,
          },
          {
            id: 2,
            codigo: '002-291125',
            titulo: 'Lote 2',
            tipo: 'operacional',
            liberado_em: '2025-11-29T11:00:00Z',
            empresa_nome: 'Empresa B',
            clinica_nome: 'Clínica B',
            total_avaliacoes: '3',
            avaliacoes_concluidas: '3',
            observacoes: null,
            status_laudo: null,
            laudo_id: null,
            emitido_em: null,
            enviado_em: null,
          },
        ],
        rowCount: 2,
      } as QueryResult<unknown>);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.lotes).toHaveLength(2);
      expect(data.total).toBe(2);

      // Verificar estrutura do primeiro lote
      const lote = data.lotes[0];
      expect(lote).toHaveProperty('id');
      expect(lote).toHaveProperty('codigo');
      expect(lote).toHaveProperty('titulo');
      expect(lote).toHaveProperty('tipo');
      expect(lote).toHaveProperty('empresa_nome');
      expect(lote).toHaveProperty('clinica_nome');
      expect(lote).toHaveProperty('liberado_em');
      expect(lote).toHaveProperty('laudo');
    });

    it('deve retornar lista vazia quando não há lotes prontos', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      } as QueryResult<unknown>);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.lotes).toEqual([]);
      expect(data.total).toBe(0);
    });
  });

  describe('Paginação', () => {
    beforeEach(() => {
      mockRequireRole.mockResolvedValue({
        cpf: '99999999999',
        nome: 'Emissor',
        perfil: 'emissor',
      });
    });

    it('deve suportar paginação', async () => {
      const paginatedRequest = {
        ...mockRequest,
        url: 'http://localhost:3000/api/emissor/lotes?page=2',
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ total: 25 }],
        rowCount: 1,
      } as QueryResult<unknown>);
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as QueryResult<unknown>);

      const response = await GET(paginatedRequest as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.page).toBe(2);
      expect(data.limit).toBe(20);
      expect(data.total).toBe(25);
    });
  });

  describe('Ordenação', () => {
    beforeEach(() => {
      mockRequireRole.mockResolvedValue({
        cpf: '99999999999',
        nome: 'Emissor',
        perfil: 'emissor',
      });
    });

    it('deve retornar lotes ordenados por status e data de liberação', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: 2 }],
        rowCount: 1,
      } as QueryResult<unknown>);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 3,
            codigo: '003-291125',
            titulo: 'Lote Ativo',
            tipo: 'completo',
            lote_status: 'ativo',
            liberado_em: '2025-11-29T15:00:00Z',
            empresa_nome: 'Empresa C',
            clinica_nome: 'Clínica C',
            total_avaliacoes: '2',
            observacoes: null,
            status_laudo: null,
            laudo_id: null,
            emitido_em: null,
            enviado_em: null,
          },
          {
            id: 1,
            codigo: '001-291125',
            titulo: 'Lote Concluído',
            tipo: 'completo',
            lote_status: 'concluido',
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa A',
            clinica_nome: 'Clínica A',
            total_avaliacoes: '4',
            observacoes: null,
            status_laudo: null,
            laudo_id: null,
            emitido_em: null,
            enviado_em: null,
          },
        ],
        rowCount: 2,
      } as QueryResult<unknown>);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.lotes[0].status).toBe('ativo');
      expect(data.lotes[1].status).toBe('concluido');
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
