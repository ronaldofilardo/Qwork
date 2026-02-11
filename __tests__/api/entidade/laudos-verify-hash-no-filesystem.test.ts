/**
 * @jest-environment node
 * @group integration
 *
 * Testes para /api/entidade/laudos/[laudoId]/verify-hash
 *
 * CORREÇÃO: Rota não deve mais ler arquivos locais nem calcular hash
 * Deve retornar APENAS o hash_pdf armazenado no banco de dados
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/entidade/laudos/[laudoId]/verify-hash/route';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;

describe('GET /api/entidade/laudos/[laudoId]/verify-hash - No Filesystem Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireEntity.mockResolvedValue({
      user: {
        id: 1,
        tipo: 'entidade',
        entidade_id: 42,
        email: 'entidade@test.com',
      },
      entidade_id: 42,
    } as any);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Verificação de Hash sem Operações de Sistema de Arquivos', () => {
    it('deve retornar 200 com hash_pdf do banco de dados', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            status: 'emitido',
            hash_pdf: 'abc123hash456def789mock',
            entidade_id: 42,
            clinica_id: 1,
            emitido_em: new Date(),
          },
        ],
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/laudos/1005/verify-hash'
      );

      const response = await GET(request, { params: { laudoId: '1005' } });

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.hash_armazenado).toBe('abc123hash456def789mock');
      expect(json.success).toBe(true);
    });

    it('deve retornar 404 quando laudo não existe', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/laudos/999999/verify-hash'
      );

      const response = await GET(request, { params: { laudoId: '999999' } });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toContain('Laudo não encontrado');
    });

    it('NÃO deve tentar ler arquivo do sistema de arquivos local', async () => {
      // Mockar fs para verificar que não é chamado
      const fsMock = {
        readFileSync: jest.fn(),
        existsSync: jest.fn(),
        promises: {
          readFile: jest.fn(),
          access: jest.fn(),
        },
      };

      // Se o código tentar importar 'fs', vai pegar nosso mock
      jest.mock('fs', () => fsMock);
      jest.mock('fs/promises', () => fsMock.promises);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            status: 'emitido',
            hash_pdf: 'abc123hash456def789mock',
            entidade_id: 42,
            clinica_id: 1,
            emitido_em: new Date(),
          },
        ],
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/laudos/1005/verify-hash'
      );

      await GET(request, { params: { laudoId: '1005' } });

      // Verificar que fs nunca foi chamado
      expect(fsMock.readFileSync).not.toHaveBeenCalled();
      expect(fsMock.existsSync).not.toHaveBeenCalled();
      expect(fsMock.promises.readFile).not.toHaveBeenCalled();
      expect(fsMock.promises.access).not.toHaveBeenCalled();
    });

    it('NÃO deve calcular hash com crypto.createHash', async () => {
      // Mockar crypto para verificar que createHash não é chamado
      const cryptoMock = {
        createHash: jest.fn(() => ({
          update: jest.fn().mockReturnThis(),
          digest: jest.fn(() => 'mockHash'),
        })),
      };

      jest.mock('crypto', () => cryptoMock);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1005,
            lote_id: 1005,
            status: 'emitido',
            hash_pdf: 'abc123hash456def789mock',
            entidade_id: 42,
            clinica_id: 1,
            emitido_em: new Date(),
          },
        ],
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/laudos/1005/verify-hash'
      );

      const response = await GET(request, { params: { laudoId: '1005' } });

      expect(response.status).toBe(200);
      // Verificar que createHash nunca foi chamado
      expect(cryptoMock.createHash).not.toHaveBeenCalled();
    });

    it('deve retornar 404 quando hash_pdf não está no banco', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1006,
            lote_id: 1006,
            status: 'emitido',
            hash_pdf: null, // SEM HASH
            entidade_id: 42,
            clinica_id: 1,
            emitido_em: new Date(),
          },
        ],
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/laudos/1006/verify-hash'
      );

      const response = await GET(request, { params: { laudoId: '1006' } });

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.error).toContain('Hash do laudo não disponível');
    });
  });
});
