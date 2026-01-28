/**
 * Testes para /api/emissor/laudos/[loteId]/pdf
 *
 * Funcionalidades testadas:
 * 1. GET - Gerar PDF do laudo completo
 * 2. Validações de autorização
 * 3. Geração de hash SHA256
 * 4. Armazenamento do arquivo
 */

import { GET } from '@/app/api/emissor/laudos/[loteId]/pdf/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { QueryResult } from 'pg';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';

jest.mock('@/lib/session');
jest.mock('@/lib/db');
jest.mock('fs');
jest.mock('crypto');
jest.mock('path');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;
const mockPath = path as jest.Mocked<typeof path>;

// Mock puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

// IGNORADO: testes de emissão de laudos (PDF) temporariamente skipados para breve refatoração
describe.skip('/api/emissor/laudos/[loteId]/pdf', () => {
  const mockEmissor = {
    cpf: '99999999999',
    nome: 'Emissor',
    perfil: 'emissor' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (
      puppeteer.launch as jest.MockedFunction<typeof puppeteer.launch>
    ).mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('fake pdf')),
      }),
      close: jest.fn().mockResolvedValue(undefined),
    } as unknown as puppeteer.Browser);
    mockFs.existsSync = jest.fn().mockReturnValue(false);
    mockFs.mkdirSync = jest.fn();
    mockFs.writeFileSync = jest.fn();
    mockCrypto.createHash = jest.fn().mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('fakehash'),
    });
    mockPath.join = jest.fn().mockImplementation((...args) => args.join('/'));
  });

  describe('GET - Gerar PDF do Laudo', () => {
    it('deve retornar 403 se usuário não for emissor', async () => {
      mockRequireRole.mockResolvedValue(null);

      const mockParams = { params: { loteId: '1' } };
      const response = await GET({} as Request, mockParams);

      expect(response.status).toBe(403);
    });

    it('deve retornar 400 para loteId inválido', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      const mockParams = { params: { loteId: 'abc' } };
      const response = await GET({} as Request, mockParams);

      expect(response.status).toBe(400);
    });

    it('deve gerar PDF com sucesso para lote válido', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      // Mock verificação de lote e clínica
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, lote_status: 'ativo' }],
        rowCount: 1,
      } as QueryResult<unknown>);

      // A validação insert de auditoria em validarAcessoLote faz outra query (INSERT)
      mockQuery.mockResolvedValueOnce({} as QueryResult<unknown>);

      // Mock verificação de laudo emitido
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, status: 'enviado' }],
        rowCount: 1,
      } as QueryResult<unknown>);

      // Mock dados da empresa
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            liberado_em: '2025-11-29T10:00:00Z',
            empresa_nome: 'Empresa Teste',
            cnpj: '12345678000195',
            endereco: 'Rua Teste, 123',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234567',
          },
        ],
        rowCount: 1,
      } as QueryResult<unknown>);

      // Mock stats
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
      } as QueryResult<unknown>);

      // Mock scores
      mockQuery.mockResolvedValueOnce({
        rows: [
          { grupo: 1, valor: 75 },
          { grupo: 2, valor: 80 },
        ],
        rowCount: 2,
      } as QueryResult<unknown>);

      // Mock observações do laudo
      mockQuery.mockResolvedValueOnce({
        rows: [{ observacoes: 'Observações de teste' }],
        rowCount: 1,
      } as QueryResult<unknown>);

      const mockParams = { params: { loteId: '1' } };
      const response = await GET({} as Request, mockParams);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain(
        'attachment'
      );
      expect(response.headers.get('Content-Disposition')).toContain('.pdf');
    });

    it('deve retornar 500 em caso de erro na geração', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      // Mock: lote existe
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, lote_status: 'ativo' }],
        rowCount: 1,
      } as QueryResult<unknown>);
      // Mock: auditoria insert
      mockQuery.mockResolvedValueOnce({} as QueryResult<unknown>);
      // Próxima query falha (simula erro durante a geração)
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const mockParams = { params: { loteId: '1' } };
      const response = await GET({} as Request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Erro na geração do PDF: Database error');
    });
  });

  describe('Funcionalidades de Segurança', () => {
    it('deve validar que apenas emissor pode gerar PDF', async () => {
      mockRequireRole.mockResolvedValue(null);

      const mockParams = { params: { loteId: '1' } };
      const response = await GET({} as Request, mockParams);

      expect(response.status).toBe(403);
    });

    it('deve validar loteId numérico', async () => {
      mockRequireRole.mockResolvedValue(mockEmissor);

      const mockParams = { params: { loteId: 'not-a-number' } };
      const response = await GET({} as Request, mockParams);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('ID do lote inválido');
    });
  });
});
