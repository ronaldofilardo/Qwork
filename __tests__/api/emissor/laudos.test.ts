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
jest.mock('@/lib/laudo-auto', () => ({
  gerarLaudoCompletoEmitirPDF: jest.fn().mockResolvedValue(42),
}));
jest.mock('@/lib/laudo-calculos', () => ({
  gerarDadosGeraisEmpresa: jest.fn().mockResolvedValue({
    empresaAvaliada: { nome: 'Empresa A', cnpj: '12345678000195' },
  }),
  calcularScoresPorGrupo: jest.fn().mockResolvedValue([
    { grupo: 1, valor: 75 },
    { grupo: 2, valor: 80 },
  ]),
  gerarInterpretacaoRecomendacoes: jest.fn().mockReturnValue({}),
  gerarObservacoesConclusao: jest.fn().mockReturnValue({}),
}));

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('/api/emissor/laudos/[loteId]', () => {
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
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // loteCheck
        .mockResolvedValueOnce({} as any) // BEGIN
        .mockResolvedValueOnce({} as any); // ROLLBACK

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '999' } };

      const response = await GET(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Lote não encontrado');
    });

    it('deve retornar 400 se lote não estiver pronto', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              status: 'ativo',
              numero_ordem: 5,
              empresa_nome: 'Empresa A',
              clinica_nome: 'Clínica A',
              total_liberadas: 5,
              concluidas: 3,
              inativadas: 0,
            },
          ],
          rowCount: 1,
        } as any) // loteCheck
        .mockResolvedValueOnce({} as any) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // laudoQuery (no laudo)
        .mockResolvedValueOnce({} as any); // ROLLBACK

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await GET(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('não está pronto');
    });

    it('deve retornar laudo existente se já criado', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      // Mock lote pronto (concluido)
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'ativo',
            numero_ordem: 3,
            empresa_nome: 'Empresa A',
            clinica_nome: 'Clínica A',
            total_liberadas: 4,
            concluidas: 4,
            inativadas: 0,
          },
        ],
        rowCount: 1,
      } as any);

      // BEGIN transaction
      mockQuery.mockResolvedValueOnce({} as any);

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
            hash_pdf: null,
          },
        ],
        rowCount: 1,
      } as any);

      // COMMIT transaction
      mockQuery.mockResolvedValueOnce({} as any);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await GET(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.lote.numero_ordem).toBe(3);
      expect(data.lote.total_avaliacoes).toBe(4);
      expect(data.laudoPadronizado.observacoesEmissor).toBe(
        'Observações existentes'
      );
      expect(data.laudoPadronizado.status).toBe('rascunho');
      expect(data.lote.empresa_nome).toBe('Empresa A');
    });

    it('deve retornar preview quando lote concluído mas sem laudo', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      // Mock lote pronto
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'ativo',
            numero_ordem: 2,
            empresa_nome: 'Empresa A',
            clinica_nome: 'Clínica A',
            total_liberadas: 4,
            concluidas: 4,
            inativadas: 0,
          },
        ],
        rowCount: 1,
      } as any);

      // BEGIN
      mockQuery.mockResolvedValueOnce({} as any);

      // laudoQuery - no existing laudo
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // COMMIT
      mockQuery.mockResolvedValueOnce({} as any);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await GET(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.previa).toBe(true);
      expect(data.lote.numero_ordem).toBe(2);
      expect(data.lote.total_avaliacoes).toBe(4);
      expect(data.mensagem).toBe(
        'Preview do laudo - clique em "Gerar Laudo" para emitir'
      );
      expect(data.laudoPadronizado).toBeDefined();
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

      const mockReq = {
        json: jest.fn().mockResolvedValue({ observacoes: 'Novas observações' }),
      } as any;
      const mockParams = { params: { loteId: '1' } };

      const response = await PUT(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Edição de observações não permitida');
    });

    it('deve retornar 403 para loteId inválido (edição sempre bloqueada)', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      const mockReq = {
        json: jest.fn().mockResolvedValue({ observacoes: 'Teste' }),
      } as any;
      const mockParams = { params: { loteId: 'invalid' } };

      const response = await PUT(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Edição de observações não permitida');
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

      // loteCheck - lote concluído
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'concluido',
            numero_ordem: 1,
            status_pagamento: 'pago',
            pago_em: '2025-01-01',
            empresa_nome: 'Empresa A',
            total_liberadas: 4,
            concluidas: 4,
            inativadas: 0,
          },
        ],
        rowCount: 1,
      } as any);

      // laudoExistente - nenhum laudo
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // filaEntry - lote em fila de emissão
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      } as any);

      const mockReq = {} as Request;
      const mockParams = { params: { loteId: '1' } };

      const response = await POST(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Laudo gerado com sucesso');
      expect(data.laudo_id).toBe(42);
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

      const mockReq = {
        json: jest.fn().mockResolvedValue({ status: 'enviado' }),
      } as any;
      const mockParams = { params: { loteId: '1' } };

      const response = await PATCH(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('deve enviar laudo para clínica com sucesso', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 100, status: 'enviado' }],
        rowCount: 1,
      } as any);

      const mockReq = {
        json: jest.fn().mockResolvedValue({ status: 'enviado' }),
      } as any;
      const mockParams = { params: { loteId: '1' } };

      const response = await PATCH(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Laudo enviado para clínica');
      // Verificar que query foi chamada com os parâmetros corretos para UPDATE
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE laudos'),
        expect.arrayContaining([1, '99999999999']),
        mockEmissor
      );
    });

    it('deve retornar 400 para loteId inválido', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      const mockReq = {
        json: jest.fn().mockResolvedValue({ status: 'enviado' }),
      } as any;
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

    it('PUT deve retornar 403 (edição sempre bloqueada)', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      const mockReq = {
        json: jest.fn().mockResolvedValue({ observacoes: 'Teste' }),
      } as any;
      const mockParams = { params: { loteId: '1' } };

      const response = await PUT(mockReq, mockParams);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Edição de observações não permitida');
    });
  });
});
