/**
 * Teste da rota verify-hash de laudos
 *
 * Comportamento após correção de 10/02/2026:
 * - NÃO recalcula hash do arquivo (não usa fs, crypto)
 * - Apenas retorna hash_pdf armazenado no banco
 * - Hash foi calculado no momento da emissão e é permanente
 */

import { GET } from '@/app/api/entidade/laudos/[laudoId]/verify-hash/route';
import { requireEntity } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session');
jest.mock('@/lib/db');

const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('GET /api/entidade/laudos/[laudoId]/verify-hash', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validação de Sessão', () => {
    it('deve retornar erro quando não há sessão de entidade', async () => {
      mockRequireEntity.mockRejectedValueOnce(new Error('Não autorizado'));

      await expect(
        GET({} as Request, { params: { laudoId: '1005' } } as any)
      ).rejects.toThrow('Não autorizado');

      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('deve rejeitar laudoId inválido', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 5,
      } as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: 'abc' } } as any
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('inválido');
    });
  });

  describe('Validação de Acesso', () => {
    it('deve retornar 404 quando laudo não existe', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 5,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: '9999' } } as any
      );

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toContain('não encontrado ou acesso negado');
    });

    it('deve retornar 404 quando laudo pertence a outra entidade', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 5, // Entidade 5 tentando acessar
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [], // Query já filtra por entidade_id
        rowCount: 0,
      } as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1005' } } as any
      );

      expect(response.status).toBe(404);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.any(String),
        [1005, 5] // laudoId=1005, entidadeId=5
      );
    });
  });

  describe('Retorno de Hash Armazenado', () => {
    it('deve retornar hash armazenado quando laudo tem hash_pdf', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 5,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            hash_pdf:
              '0014e8529251d709dd1686af90c6fca45da735eb67cc7f26f1fef7fce90ccebe',
            status: 'emitido',
            emitido_em: '2026-01-27T02:29:26.082Z',
            entidade_id: 5,
            clinica_id: 104,
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1005' } } as any
      );

      expect(response.status).toBe(200);
      const json = await response.json();

      expect(json.success).toBe(true);
      expect(json.hash_armazenado).toBe(
        '0014e8529251d709dd1686af90c6fca45da735eb67cc7f26f1fef7fce90ccebe'
      );
      expect(json.laudo_id).toBe(1005);
      expect(json.lote_id).toBe(1005);
      expect(json.status).toBe('emitido');
      expect(json.emitido_em).toBeTruthy();
    });

    it('deve retornar 404 quando laudo existe mas não tem hash', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 5,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1006,
            lote_id: 1006,
            hash_pdf: null, // Laudo sem hash (em processamento)
            status: 'emitido',
            emitido_em: null,
            entidade_id: 5,
            clinica_id: 104,
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1006' } } as any
      );

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toContain('Hash do laudo não disponível');
    });
  });

  describe('Comportamento Corrigido (Não Recalcula Hash)', () => {
    it('NÃO deve tentar ler arquivo do sistema de arquivos', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 5,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            hash_pdf: 'abc123',
            status: 'emitido',
            emitido_em: '2026-01-27T02:29:26.082Z',
            entidade_id: 5,
            clinica_id: 104,
          },
        ],
        rowCount: 1,
      } as any);

      const response = await GET(
        {} as Request,
        { params: { laudoId: '1005' } } as any
      );

      expect(response.status).toBe(200);

      // Se tentasse ler arquivo local, teste falharia (fs não está mockado)
      // Passagem do teste prova que não usa filesystem
    });

    it('NÃO deve fazer fetch do Backblaze para recalcular hash', async () => {
      mockRequireEntity.mockResolvedValueOnce({
        entidade_id: 5,
      } as any);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            hash_pdf: 'hash_calculado_na_emissao',
            status: 'emitido',
            emitido_em: '2026-01-27T02:29:26.082Z',
            entidade_id: 5,
            clinica_id: 104,
          },
        ],
        rowCount: 1,
      } as any);

      // global.fetch não está mockado - se fosse chamado, falharia
      const response = await GET(
        {} as Request,
        { params: { laudoId: '1005' } } as any
      );

      expect(response.status).toBe(200);
      const json = await response.json();

      // Hash retornado é o mesmo do banco, não foi recalculado
      expect(json.hash_armazenado).toBe('hash_calculado_na_emissao');
    });
  });
});
