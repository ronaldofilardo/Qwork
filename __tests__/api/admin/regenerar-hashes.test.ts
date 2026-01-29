/**
 * Testes para API de Regeneração de Hashes (Admin)
 *
 * Valida:
 * 1. Endpoint requer autenticação de admin
 * 2. Endpoint processa laudos sem hash
 * 3. Endpoint calcula e persiste hashes corretamente
 * 4. Endpoint retorna estatísticas corretas
 * 5. Endpoint respeita limite de processamento
 */

import { POST } from '@/app/api/admin/laudos/regenerar-hashes/route';
import { query } from '@/lib/db';
import { NextRequest } from 'next/server';

// Mock das dependências
jest.mock('@/lib/auth-require', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(
      () => 'mockedhash123456789012345678901234567890123456789012345678'
    ),
  })),
}));

const mockRequireRole = require('@/lib/auth-require').requireRole;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockExistsSync = require('fs').existsSync;
const mockReadFileSync = require('fs').readFileSync;

describe.skip('API Admin - Regenerar Hashes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Autenticação e Autorização', () => {
    it('deve exigir role admin', async () => {
      mockRequireRole.mockRejectedValueOnce(new Error('Acesso negado'));

      const request = new NextRequest(
        'http://localhost/api/admin/laudos/regenerar-hashes',
        {
          method: 'POST',
        }
      );

      await expect(POST(request)).rejects.toThrow('Acesso negado');
      expect(mockRequireRole).toHaveBeenCalledWith('admin');
    });

    it('deve permitir acesso para usuário admin', async () => {
      mockRequireRole.mockResolvedValueOnce({
        user: { cpf: '12345678901', role: 'admin' },
      });

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const request = new NextRequest(
        'http://localhost/api/admin/laudos/regenerar-hashes',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Processamento de Laudos', () => {
    it('deve identificar laudos sem hash', async () => {
      mockRequireRole.mockResolvedValueOnce({
        user: { cpf: '12345678901', role: 'admin' },
      });

      const mockLaudos = [
        { id: 1, lote_id: 10 },
        { id: 2, lote_id: 11 },
        { id: 3, lote_id: 12 },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockLaudos,
        rowCount: mockLaudos.length,
      });

      // Simular que nenhum arquivo existe
      mockExistsSync.mockReturnValue(false);

      const request = new NextRequest(
        'http://localhost/api/admin/laudos/regenerar-hashes',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.processados).toBe(3);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE hash_pdf IS NULL'),
        expect.any(Array)
      );
    });

    it('deve calcular e persistir hash quando arquivo existe', async () => {
      mockRequireRole.mockResolvedValueOnce({
        user: { cpf: '12345678901', role: 'admin' },
      });

      const mockLaudos = [{ id: 5, lote_id: 15 }];

      mockQuery
        .mockResolvedValueOnce({ rows: mockLaudos, rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('fake pdf content'));

      const request = new NextRequest(
        'http://localhost/api/admin/laudos/regenerar-hashes',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.atualizados).toBe(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE laudos SET hash_pdf'),
        expect.arrayContaining([expect.stringMatching(/^[a-f0-9]{64}$/), 5])
      );
    });

    it('deve contabilizar arquivos não encontrados', async () => {
      mockRequireRole.mockResolvedValueOnce({
        user: { cpf: '12345678901', role: 'admin' },
      });

      const mockLaudos = [
        { id: 1, lote_id: 10 },
        { id: 2, lote_id: 11 },
      ];

      mockQuery.mockResolvedValueOnce({
        rows: mockLaudos,
        rowCount: 2,
      });

      mockExistsSync.mockReturnValue(false);

      const request = new NextRequest(
        'http://localhost/api/admin/laudos/regenerar-hashes',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.arquivosNaoEncontrados).toBe(2);
      expect(data.atualizados).toBe(0);
    });

    it('deve respeitar limite de 100 laudos por execução', async () => {
      mockRequireRole.mockResolvedValueOnce({
        user: { cpf: '12345678901', role: 'admin' },
      });

      // Simular mais de 100 laudos
      const mockLaudos = Array.from({ length: 150 }, (_, i) => ({
        id: i + 1,
        lote_id: 100 + i,
      }));

      mockQuery.mockResolvedValueOnce({
        rows: mockLaudos.slice(0, 100), // API deve limitar a 100
        rowCount: 100,
      });

      mockExistsSync.mockReturnValue(false);

      const request = new NextRequest(
        'http://localhost/api/admin/laudos/regenerar-hashes',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.processados).toBe(100);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 100'),
        expect.any(Array)
      );
    });
  });

  describe('Retorno de Estatísticas', () => {
    it('deve retornar estatísticas completas', async () => {
      mockRequireRole.mockResolvedValueOnce({
        user: { cpf: '12345678901', role: 'admin' },
      });

      const mockLaudos = [
        { id: 1, lote_id: 10 },
        { id: 2, lote_id: 11 },
        { id: 3, lote_id: 12 },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: mockLaudos, rowCount: 3 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE 1
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE 2

      mockExistsSync
        .mockReturnValueOnce(true) // Laudo 1 tem arquivo
        .mockReturnValueOnce(true) // Laudo 2 tem arquivo
        .mockReturnValueOnce(false); // Laudo 3 não tem arquivo

      mockReadFileSync.mockReturnValue(Buffer.from('pdf content'));

      const request = new NextRequest(
        'http://localhost/api/admin/laudos/regenerar-hashes',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data).toMatchObject({
        success: true,
        processados: 3,
        atualizados: 2,
        arquivosNaoEncontrados: 1,
        erros: 0,
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro no banco de dados', async () => {
      mockRequireRole.mockResolvedValueOnce({
        user: { cpf: '12345678901', role: 'admin' },
      });

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const request = new NextRequest(
        'http://localhost/api/admin/laudos/regenerar-hashes',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeTruthy();
    });

    it('deve continuar processamento mesmo com erro em laudo específico', async () => {
      mockRequireRole.mockResolvedValueOnce({
        user: { cpf: '12345678901', role: 'admin' },
      });

      const mockLaudos = [
        { id: 1, lote_id: 10 },
        { id: 2, lote_id: 11 },
      ];

      mockQuery
        .mockResolvedValueOnce({ rows: mockLaudos, rowCount: 2 })
        .mockRejectedValueOnce(new Error('Update failed')) // Erro no laudo 1
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // Sucesso no laudo 2

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(Buffer.from('pdf'));

      const request = new NextRequest(
        'http://localhost/api/admin/laudos/regenerar-hashes',
        {
          method: 'POST',
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.processados).toBe(2);
      expect(data.erros).toBe(1);
      expect(data.atualizados).toBe(1);
    });
  });
});
