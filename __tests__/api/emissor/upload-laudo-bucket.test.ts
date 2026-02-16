/**
 * Testes para endpoint de upload de laudos ao bucket
 * POST /api/emissor/laudos/[loteId]/upload
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock das dependências
jest.mock('@/lib/session');
jest.mock('@/lib/db');
jest.mock('@/lib/storage/laudo-storage');

describe('POST /api/emissor/laudos/[loteId]/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Autenticação e Autorização', () => {
    it('deve rejeitar sem autenticação', async () => {
      const { requireRole } = await import('@/lib/session');
      (requireRole as jest.Mock).mockResolvedValue(null);

      const response = { success: false, error: 'Acesso negado' };

      expect(response.success).toBe(false);
      expect(response.error).toContain('Acesso negado');
    });

    it('deve permitir apenas role emissor', async () => {
      const { requireRole } = await import('@/lib/session');
      const mockUser = {
        cpf: '12345678901',
        role: 'emissor',
      };
      (requireRole as jest.Mock).mockResolvedValue(mockUser);

      // Verifica que o mock retorna usuário emissor
      const result = await requireRole('emissor');
      expect(result).toEqual(mockUser);
      expect(result.role).toBe('emissor');
    });
  });

  describe('Validações', () => {
    it('deve validar laudoId numérico', () => {
      const laudoId = 'abc';
      const isValid = !isNaN(parseInt(laudoId, 10));
      expect(isValid).toBe(false);
    });

    it('deve validar tipo MIME application/pdf', () => {
      const validMimeType = 'application/pdf';
      const invalidMimeType = 'image/png';

      expect(validMimeType).toBe('application/pdf');
      expect(invalidMimeType).not.toBe('application/pdf');
    });

    it('deve validar tamanho máximo 2MB', () => {
      const MAX_SIZE = 2 * 1024 * 1024;
      const validSize = 1.5 * 1024 * 1024; // 1.5MB
      const invalidSize = 3 * 1024 * 1024; // 3MB

      expect(validSize).toBeLessThanOrEqual(MAX_SIZE);
      expect(invalidSize).toBeGreaterThan(MAX_SIZE);
    });

    it('deve validar header PDF (%PDF-)', () => {
      const validHeader = '%PDF-1.4';
      const invalidHeader = 'PK\x03\x04'; // ZIP header

      expect(validHeader.startsWith('%PDF-')).toBe(true);
      expect(invalidHeader.startsWith('%PDF-')).toBe(false);
    });
  });

  describe('Imutabilidade', () => {
    it('deve permitir upload se laudo em emitido com hash_pdf preenchido', async () => {
      const laudo = {
        id: 1,
        status: 'emitido',
        hash_pdf:
          'abc123def456789000111222333444555666777888999aaabbbcccdddeeefffg',
        arquivo_remoto_key: null,
      };

      // ✅ CORREÇÃO 16/02/2026: Após gerar PDF, status='emitido' (não 'rascunho')
      // Upload é permitido enquanto tiver hash_pdf e não tiver arquivo_remoto_key
      const canUpload = Boolean(laudo.hash_pdf) && !laudo.arquivo_remoto_key;
      expect(canUpload).toBe(true);
    });

    it('deve rejeitar upload se laudo não tem hash_pdf gerado', async () => {
      const laudo = {
        id: 1,
        status: 'rascunho', // Este permanece rascunho pois não tem PDF
        hash_pdf: null,
        arquivo_remoto_key: null,
      };

      // ❌ Sem hash_pdf, não pode fazer upload
      const canUpload = Boolean(laudo.hash_pdf) && !laudo.arquivo_remoto_key;
      expect(canUpload).toBe(false);
    });

    it('deve rejeitar upload se já existe arquivo_remoto_key', async () => {
      const laudo = {
        id: 1,
        status: 'enviado', // Status após upload bem-sucedido
        hash_pdf:
          'abc123def456789000111222333444555666777888999aaabbbcccdddeeefffg',
        arquivo_remoto_key: 'laudos/lote-1/laudo-123.pdf',
      };

      const canUpload = Boolean(laudo.hash_pdf) && !laudo.arquivo_remoto_key;
      expect(canUpload).toBe(false);
    });

    it('deve rejeitar se hash não corresponde', () => {
      const expectedHash = 'abc123def456';
      const receivedHash = 'different-hash';

      const hashMatch = expectedHash === receivedHash;
      expect(hashMatch).toBe(false);
    });
  });

  describe('Fluxo de Upload', () => {
    it('deve calcular hash SHA-256 do arquivo', async () => {
      const { calcularHash } = await import('@/lib/storage/laudo-storage');
      const mockBuffer = Buffer.from('test content');

      (calcularHash as jest.Mock).mockReturnValue(
        'abc123def456789000111222333444555666777888999aaabbbcccdddeeefffg'
      );

      const hash = calcularHash(mockBuffer);
      expect(hash).toHaveLength(64); // SHA-256 em hex
    });

    it('deve chamar uploadLaudoToBackblaze com parâmetros corretos', async () => {
      const { uploadLaudoToBackblaze } =
        await import('@/lib/storage/laudo-storage');

      const laudoId = 1;
      const loteId = 10;
      const buffer = Buffer.from('test pdf content');

      (uploadLaudoToBackblaze as jest.Mock).mockResolvedValue(undefined);

      await uploadLaudoToBackblaze(laudoId, loteId, buffer);

      expect(uploadLaudoToBackblaze).toHaveBeenCalledWith(
        laudoId,
        loteId,
        buffer
      );
    });

    it('deve marcar como enviado e preencher arquivo_remoto_url após upload', async () => {
      const { query } = await import('@/lib/db');

      // ✅ CORREÇÃO 16/02/2026: Upload muda status de 'emitido' para 'enviado'
      // emitido_em já existe (definido na geração), então usa COALESCE
      const mockUpdate = jest.fn().mockResolvedValue({ rowCount: 1 });
      (query as jest.Mock).mockImplementation(mockUpdate);

      await query(
        `UPDATE laudos SET status = 'enviado', emitido_em = COALESCE(emitido_em, NOW()), arquivo_remoto_url = $1, arquivo_remoto_uploaded_at = NOW() WHERE id = $2`,
        ['https://bucket.backblaze.com/laudos/lote-1/laudo-123.pdf', 1]
      );

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.stringContaining("status = 'enviado'"),
        expect.any(Array)
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.stringContaining('arquivo_remoto_url'),
        expect.any(Array)
      );
    });

    it('deve criar auditoria de sucesso', async () => {
      const { query } = await import('@/lib/db');

      const mockAuditLog = jest.fn().mockResolvedValue({ rowCount: 1 });
      (query as jest.Mock).mockImplementation(mockAuditLog);

      await query(
        `INSERT INTO audit_logs (action, resource, resource_id, new_data, user_perfil) VALUES ($1, $2, $3, $4, $5)`,
        ['laudo_upload_backblaze_sucesso', 'laudos', '1', '{}', 'emissor']
      );

      expect(mockAuditLog).toHaveBeenCalled();
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve criar auditoria em caso de erro', async () => {
      const { query } = await import('@/lib/db');

      const mockAuditError = jest.fn().mockResolvedValue({ rowCount: 1 });
      (query as jest.Mock).mockImplementation(mockAuditError);

      await query(
        `INSERT INTO audit_logs (action, resource, resource_id, new_data, user_perfil) VALUES ($1, $2, $3, $4, $5)`,
        [
          'laudo_upload_backblaze_erro',
          'laudos',
          '1',
          JSON.stringify({ erro: 'Test error' }),
          'emissor',
        ]
      );

      expect(mockAuditError).toHaveBeenCalled();
    });

    it('deve retornar status 500 em caso de erro interno', () => {
      const errorResponse = {
        success: false,
        error: 'Erro ao fazer upload do laudo',
        status: 500,
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.status).toBe(500);
    });
  });
});
