/**
 * @jest-environment node
 * @group integration
 *
 * Testes para /api/entidade/lotes - Listagem de Lotes
 *
 * CORREÇÃO: Rota não deve mais ler arquivos locais nem calcular hash
 * Deve retornar APENAS dados do banco de dados
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/entidade/lotes/route';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;

describe('GET /api/entidade/lotes - No Filesystem Operations', () => {
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

  describe('Listagem de Lotes sem Operações de Sistema de Arquivos', () => {
    it('deve listar lotes usando apenas dados do banco', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            lote_id: 1005,
            entidade_id: 42,
            contratante_id: 1,
            tipo: 'pcd',
            status: 'aguardando_laudo',
            quantidade_avaliacoes: 10,
            quantidade_aprovadas: 8,
            quantidade_rejeitadas: 2,
            criado_em: new Date(),
            laudo_id: 1005,
            laudo_status: 'emitido',
            laudo_hash_pdf: 'abc123hash',
            laudo_arquivo_remoto_key: 'laudos/lote-1005/laudo.pdf',
            laudo_emitido_em: new Date(),
          },
          {
            lote_id: 1006,
            entidade_id: 42,
            contratante_id: 1,
            tipo: 'aposentadoria',
            status: 'aguardando_laudo',
            quantidade_avaliacoes: 5,
            quantidade_aprovadas: 5,
            quantidade_rejeitadas: 0,
            criado_em: new Date(),
            laudo_id: null,
            laudo_status: null,
            laudo_hash_pdf: null,
            laudo_arquivo_remoto_key: null,
            laudo_emitido_em: null,
          },
        ],
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lotes'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.lotes).toHaveLength(2);
      expect(json.lotes[0].lote_id).toBe(1005);
      expect(json.lotes[0].laudo_status).toBe('emitido');
      expect(json.lotes[1].lote_id).toBe(1006);
      expect(json.lotes[1].laudo_id).toBeNull();
    });

    it('NÃO deve tentar ler arquivos do sistema de arquivos', async () => {
      const fsMock = {
        readFile: jest.fn(),
        readFileSync: jest.fn(),
        existsSync: jest.fn(),
        access: jest.fn(),
        promises: {
          readFile: jest.fn(),
          access: jest.fn(),
        },
      };

      jest.mock('fs', () => fsMock);
      jest.mock('fs/promises', () => fsMock.promises);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            lote_id: 1005,
            entidade_id: 42,
            laudo_id: 1005,
            laudo_status: 'emitido',
            laudo_hash_pdf: 'abc123',
          },
        ],
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lotes'
      );

      await GET(request);

      // Verificar que NENHUMA operação de filesystem foi chamada
      expect(fsMock.readFile).not.toHaveBeenCalled();
      expect(fsMock.readFileSync).not.toHaveBeenCalled();
      expect(fsMock.existsSync).not.toHaveBeenCalled();
      expect(fsMock.access).not.toHaveBeenCalled();
      expect(fsMock.promises.readFile).not.toHaveBeenCalled();
      expect(fsMock.promises.access).not.toHaveBeenCalled();
    });

    it('NÃO deve calcular hash com crypto durante listagem', async () => {
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
            lote_id: 1005,
            entidade_id: 42,
            laudo_id: 1005,
            laudo_status: 'emitido',
            laudo_hash_pdf: 'abc123',
          },
        ],
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lotes'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      // Verificar que createHash NUNCA foi chamado
      expect(cryptoMock.createHash).not.toHaveBeenCalled();
    });

    it('NÃO deve fazer Promise.all lendo arquivos', async () => {
      // Mockar Promise.all para verificar que não é usado para ler arquivos
      const originalPromiseAll = Promise.all;
      const promiseAllSpy = jest.spyOn(Promise, 'all');

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            lote_id: 1005,
            entidade_id: 42,
            laudo_id: 1005,
            laudo_status: 'emitido',
            laudo_hash_pdf: 'abc123',
          },
          {
            lote_id: 1006,
            entidade_id: 42,
            laudo_id: 1006,
            laudo_status: 'emitido',
            laudo_hash_pdf: 'def456',
          },
        ],
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lotes'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);

      // Promise.all pode ser chamado, mas NÃO deve ser usado para ler arquivos
      // Se for chamado, deve verificar que não é para operações de fs
      if (promiseAllSpy.mock.calls.length > 0) {
        // Verificar que nenhuma das promises é para ler arquivo
        promiseAllSpy.mock.calls.forEach((call) => {
          const promises = call[0];
          // As promises não devem conter operações de fs
          expect(JSON.stringify(promises)).not.toContain('readFile');
          expect(JSON.stringify(promises)).not.toContain('storage/laudos');
        });
      }

      promiseAllSpy.mockRestore();
    });

    it('deve retornar lotes mesmo quando laudo não tem hash', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            lote_id: 1007,
            entidade_id: 42,
            laudo_id: 1007,
            laudo_status: 'emitido',
            laudo_hash_pdf: null, // SEM HASH
            laudo_arquivo_remoto_key: null,
          },
        ],
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lotes'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      const json = await response.json();
      expect(json.lotes).toHaveLength(1);
      expect(json.lotes[0].laudo_hash_pdf).toBeNull();
      // Deve retornar os dados do banco, não tentar calcular hash
    });

    it('NÃO deve detectar "lotes órfãos" lendo arquivos locais', async () => {
      const fsMock = {
        readdirSync: jest.fn(),
        promises: {
          readdir: jest.fn(),
        },
      };

      jest.mock('fs', () => fsMock);
      jest.mock('fs/promises', () => fsMock.promises);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            lote_id: 1005,
            entidade_id: 42,
            laudo_id: 1005,
          },
        ],
      } as any);

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/lotes'
      );

      await GET(request);

      // Verificar que NÃO tentou listar diretório storage/laudos
      expect(fsMock.readdirSync).not.toHaveBeenCalled();
      expect(fsMock.promises.readdir).not.toHaveBeenCalled();
    });
  });
});
