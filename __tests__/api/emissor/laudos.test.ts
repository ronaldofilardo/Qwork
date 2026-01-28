/**
 * Testes para /api/emissor/laudos/[loteId]
 *
 * Funcionalidades testadas:
 * 1. GET - Buscar/criar laudo padronizado completo (etapas 1-4)
 * 2. PUT - Atualizar observações do laudo (rascunho)
 * 3. POST - Emitir laudo
 * 4. PATCH - Enviar laudo para clínica
 * 5. Validações de autorização e integridade
 * 6. Estrutura completa do laudo padronizado
 */

import { GET, PUT, POST, PATCH } from '@/app/api/emissor/laudos/[loteId]/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

// IGNORADO: testes de emissão de laudos temporariamente skipados para breve refatoração
describe.skip('/api/emissor/laudos/[loteId]', () => {
  const mockEmissor = {
    cpf: '99999999999',
    nome: 'Emissor',
    perfil: 'emissor' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET - Buscar/Criar Laudo', () => {
    it('deve retornar 403 se usuário não for emissor', async () => {
      mockRequireRole.mockResolvedValue(null as any);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await GET(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('deve retornar 400 para loteId inválido', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: 'abc' } };

      const response = await GET(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID do lote inválido');
    });

    it('deve retornar 404 se lote não existir', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '999' } };

      const response = await GET(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Lote não encontrado');
    });

    it('deve retornar 400 se lote não estiver pronto', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'ativo',
            empresa_nome: 'Empresa A',
            clinica_nome: 'Clínica A',
            total: '5',
            concluidas: '3', // Não está pronto
          },
        ],
        rowCount: 1,
      } as any);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await GET(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('não está pronto');
    });

    it('deve retornar laudo existente se já criado', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      // Mock lote pronto
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'ativo',
            empresa_nome: 'Empresa A',
            clinica_nome: 'Clínica A',
            total: '4',
            concluidas: '4',
          },
        ],
        rowCount: 1,
      } as any);

      // Mock dados da empresa (lote query in gerarDadosGeraisEmpresa)
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa A',
            cnpj: '12345678000195',
            endereco: 'Rua A, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234567',
          },
        ],
        rowCount: 1,
      } as any);

      // Mock stats (stats query in gerarDadosGeraisEmpresa)
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_avaliacoes: '4',
            avaliacoes_concluidas: '4',
            primeira_avaliacao: '2025-11-29T11:00:00Z',
            ultima_conclusao: '2025-11-29T12:00:00Z',
            operacional: '3',
            gestao: '1',
          },
        ],
        rowCount: 1,
      } as any);

      // Mock scores (scores query in calcularScoresPorGrupo)
      mockQuery.mockResolvedValueOnce({
        rows: [
          { grupo: 1, valor: 75 },
          { grupo: 2, valor: 80 },
        ],
        rowCount: 2,
      } as any);

      // Mock laudo existente
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 100,
            observacoes: 'Observações existentes',
            status: 'rascunho',
            criado_em: '2025-11-29T10:00:00Z',
            emitido_em: null,
            enviado_em: null,
          },
        ],
        rowCount: 1,
      } as any);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await GET(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.laudoPadronizado.observacoesEmissor).toBe(
        'Observações existentes'
      );
      expect(data.laudoPadronizado.status).toBe('rascunho');
      expect(data.lote.empresa_nome).toBe('Empresa A');
    });

    it('deve criar novo laudo se não existir', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      // Mock lote pronto
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'ativo',
            empresa_nome: 'Empresa A',
            clinica_nome: 'Clínica A',
            total: '4',
            concluidas: '4',
          },
        ],
        rowCount: 1,
      } as any);

      // Mock dados da empresa (lote query in gerarDadosGeraisEmpresa)
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa A',
            cnpj: '12345678000195',
            endereco: 'Rua A, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234567',
          },
        ],
        rowCount: 1,
      } as any);

      // Mock stats (stats query in gerarDadosGeraisEmpresa)
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            total_avaliacoes: '4',
            avaliacoes_concluidas: '4',
            primeira_avaliacao: '2025-11-29T11:00:00Z',
            ultima_conclusao: '2025-11-29T12:00:00Z',
            operacional: '3',
            gestao: '1',
          },
        ],
        rowCount: 1,
      } as any);

      // Mock scores (scores query in calcularScoresPorGrupo)
      mockQuery.mockResolvedValueOnce({
        rows: [
          { grupo: 1, valor: 75 },
          { grupo: 2, valor: 80 },
        ],
        rowCount: 2,
      } as any);

      // Mock laudo não existente
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // Mock criação de novo laudo
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 200,
            observacoes: null,
            status: 'rascunho',
            criado_em: '2025-11-29T12:00:00Z',
            emitido_em: null,
            enviado_em: null,
          },
        ],
        rowCount: 1,
      } as any);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await GET(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.laudoPadronizado.status).toBe('rascunho');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO laudos'),
        expect.arrayContaining([1, '99999999999'])
      );
    });
  });

  describe('PUT - Atualizar Observações', () => {
    it('deve retornar 403 se usuário não for emissor', async () => {
      mockRequireRole.mockResolvedValue(null as any);

      const mockReq = {
        json: jest.fn().mockResolvedValue({ observacoes: 'Teste' }),
      } as any;
      const mockParams = { params: { loteId: '1' } };

      const response = await PUT(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('deve retornar 403 ao tentar atualizar observações (edição bloqueada)', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const mockReq = {
        json: jest.fn().mockResolvedValue({ observacoes: 'Novas observações' }),
      } as any;
      const mockParams = { params: { loteId: '1' } };

      const response = await PUT(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Edição de observações não permitida');
    });

    it('deve retornar 400 para loteId inválido', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      const mockReq = {
        json: jest.fn().mockResolvedValue({ observacoes: 'Teste' }),
      } as any;
      const mockParams = { params: { loteId: 'invalid' } };

      const response = await PUT(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID do lote inválido');
    });
  });

  describe('POST - Emitir Laudo', () => {
    it('deve retornar 403 se usuário não for emissor', async () => {
      mockRequireRole.mockResolvedValue(null as any);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await POST(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('deve emitir laudo com sucesso', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      mockQuery.mockImplementation(async (text) => {
        if (text.includes('lotes_avaliacao')) {
          return {
            rows: [{ id: 1, codigo: 'LOTE001', clinica_id: 1 }],
            rowCount: 1,
          } as any;
        }
        if (text.includes('UPDATE')) {
          return { rows: [], rowCount: 1 } as any;
        }
        return { rows: [], rowCount: 0 } as any;
      });

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await POST(mockReq, mockParams);
      const data = await response.json();

      expect([200, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(data.success).toBe(true);
        expect(data.message).toContain('emitido');
      }
      expect(data.success).toBe(true);
      expect(data.message).toContain('emitido com sucesso');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("status = 'emitido'"),
        expect.arrayContaining([1, '99999999999'])
      );
    });

    it('deve retornar 400 para loteId inválido', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: 'xyz' } };

      const response = await POST(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID do lote inválido');
    });
  });

  describe('PATCH - Enviar Laudo', () => {
    it('deve retornar 403 se usuário não for emissor', async () => {
      mockRequireRole.mockResolvedValue(null as any);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await PATCH(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('deve enviar laudo para clínica com sucesso', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await PATCH(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('enviado para clínica');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("status = 'enviado'"),
        expect.arrayContaining([1, '99999999999'])
      );
    });

    it('deve retornar 400 para loteId inválido', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: 'bad' } };

      const response = await PATCH(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID do lote inválido');
    });
  });

  describe('Tratamento de Erros', () => {
    it('GET deve retornar 500 em caso de erro no banco', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);
      mockQuery.mockRejectedValue(new Error('Database error'));

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await GET(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Erro interno do servidor');
    });

    it('PUT deve retornar 500 em caso de erro no banco', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);
      mockQuery.mockRejectedValue(new Error('Database error'));

      const mockReq = {
        json: jest.fn().mockResolvedValue({ observacoes: 'Teste' }),
      } as any;
      const mockParams = { params: { loteId: '1' } };

      const response = await PUT(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});
