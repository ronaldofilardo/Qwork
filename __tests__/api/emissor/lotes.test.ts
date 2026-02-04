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

// Garantir que testes usem exclusivamente o banco de teste
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://localhost/nr-bps_db_test';

import { NextRequest } from 'next/server';
import { QueryResult } from 'pg';

// Garantir que testes usem exclusivamente o banco de teste
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://localhost/nr-bps_db_test';

// Declarar mocks ANTES de carregar módulos que acessam DB
jest.mock('@/lib/session');
jest.mock('@/lib/db');
// Mock FS para testar presença de arquivos locais de laudo
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readFile: jest.fn(),
  unlink: jest.fn(),
  copyFile: jest.fn(),
}));

let GET: any;
let mockRequireRole: jest.MockedFunction<any>;
let mockQuery: jest.MockedFunction<any>;

// Recarregar módulos isoladamente antes de cada teste para aplicar mocks corretamente
beforeEach(() => {
  jest.resetModules();
  const session = require('@/lib/session');
  const db = require('@/lib/db');

  mockRequireRole = session.requireRole;
  mockQuery = db.query;

  const route = require('@/app/api/emissor/lotes/route');
  GET = route.GET;
});

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

    it('deve considerar laudo emitido se arquivo local existe mesmo sem hash/emitido_em', async () => {
      const fs = await import('fs/promises');
      const spyAccess = jest
        .spyOn(fs, 'access')
        .mockResolvedValue(undefined as any);
      const realRead = jest
        .spyOn(fs, 'readFile')
        .mockResolvedValue(Buffer.from('PDF'));

      mockQuery.mockResolvedValueOnce({
        rows: [{ total: 1 }],
        rowCount: 1,
      } as QueryResult<unknown>);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 3,
            titulo: 'Lote Arquivo Local',
            tipo: 'completo',
            liberado_em: '2025-11-29T12:00:00Z',
            empresa_nome: 'Empresa C',
            clinica_nome: 'Clínica C',
            total_avaliacoes: '2',
            avaliacoes_concluidas: '2',
            observacoes: null,
            status_laudo: null,
            laudo_id: null,
            emitido_em: null,
            enviado_em: null,
            hash_pdf: null,
          },
        ],
        rowCount: 1,
      } as QueryResult<unknown>);

      // Expect that an INSERT will be attempted - mock query to accept it
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as QueryResult<unknown>);

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.lotes[0].laudo).toBeDefined();
      expect(data.lotes[0].laudo._emitido).toBeTruthy();

      spyAccess.mockRestore();
      realRead.mockRestore();
    });

    it('deve criar registro de laudo no banco se arquivo local existe e não há registro', async () => {
      const fs = require('fs/promises');
      // ensure our mocked fs functions resolve like a real file present
      (fs.access as jest.MockedFunction<any>).mockResolvedValue(undefined);
      (fs.readFile as jest.MockedFunction<any>).mockResolvedValue(
        Buffer.from('PDF')
      );

      // Provide a smart mock implementation to handle the intermediate queries and the INSERT
      mockQuery.mockImplementation(async (sql: string) => {
        if (
          typeof sql === 'string' &&
          sql.includes('SELECT COUNT(*) as total')
        ) {
          return { rows: [{ total: 1 }], rowCount: 1 } as any;
        }
        if (
          typeof sql === 'string' &&
          sql.includes('FROM lotes_avaliacao la')
        ) {
          return {
            rows: [
              {
                id: 4,
                titulo: 'Lote sem DB mas com arquivo',
                tipo: 'completo',
                liberado_em: '2025-11-29T13:00:00Z',
                empresa_nome: 'Empresa D',
                clinica_nome: 'Clínica D',
                total_avaliacoes: '1',
                avaliacoes_concluidas: '1',
                observacoes: null,
                status_laudo: null,
                laudo_id: null,
                emitido_em: null,
                enviado_em: null,
                hash_pdf: null,
              },
            ],
            rowCount: 1,
          } as any;
        }
        if (typeof sql === 'string' && sql.includes('INSERT INTO laudos')) {
          return { rows: [], rowCount: 1 } as any;
        }
        // Default fallback
        return { rows: [], rowCount: 0 } as any;
      });

      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      expect(data.lotes[0].laudo).toBeDefined();
      expect(data.lotes[0].laudo._emitido).toBeTruthy();

      (fs.access as jest.MockedFunction<any>).mockRestore();
      (fs.readFile as jest.MockedFunction<any>).mockRestore();
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
      expect(data.lotes[0].laudo.status).toBe('rascunho'); // Status real do banco, sem conversão
    });

    it('deve incluir lotes com laudos em qualquer status', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
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
      // codigo removido
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
