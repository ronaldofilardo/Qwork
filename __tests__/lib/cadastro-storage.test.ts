/**
 * Testes unitários: uploadArquivoCadastro
 *
 * Cobre:
 * - Bucket correto: 'cad-qwork' (separado do bucket de laudos)
 * - Caminho correto no bucket: {cnpj}/{tipo}-{ts}-{rand}.pdf
 * - PROD → chama uploadToBackblaze com bucketOverride='cad-qwork'
 * - DEV  → salva localmente em public/uploads/cadastros/{cnpj}/
 * - Retorno de arquivo_remoto em PROD
 * - Erro é propagado corretamente
 */

// jest.mock é hoistado — as fns precisam ser criadas dentro da factory
jest.mock('@/lib/storage/backblaze-client', () => ({
  uploadToBackblaze: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

import { uploadArquivoCadastro } from '@/lib/storage/cadastro-storage';
import { uploadToBackblaze } from '@/lib/storage/backblaze-client';
import * as fsPromises from 'fs/promises';

const mockUploadToBackblaze = uploadToBackblaze as jest.MockedFunction<
  typeof uploadToBackblaze
>;
const mockMkdir = fsPromises.mkdir as jest.MockedFunction<
  typeof fsPromises.mkdir
>;
const mockWriteFile = fsPromises.writeFile as jest.MockedFunction<
  typeof fsPromises.writeFile
>;

const CNPJ = '12345678000100';
const BUFFER = Buffer.from('%PDF-1.4 test content');

describe('uploadArquivoCadastro', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
    // Garantir ambiente DEV por padrão
    delete process.env.VERCEL;
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  // ─── PROD ──────────────────────────────────────────────────────────────────

  describe('PROD (VERCEL=1)', () => {
    beforeEach(() => {
      process.env.VERCEL = '1';
      mockUploadToBackblaze.mockResolvedValue({
        provider: 'backblaze',
        bucket: 'cad-qwork',
        key: `${CNPJ}/cartao_cnpj-1708000000000-abc123.pdf`,
        url: `https://s3.test/cad-qwork/${CNPJ}/cartao_cnpj-1708000000000-abc123.pdf`,
      });
    });

    it('deve chamar uploadToBackblaze com bucketOverride="cad-qwork" e key iniciando no cnpj', async () => {
      await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ);

      expect(mockUploadToBackblaze).toHaveBeenCalledTimes(1);
      const [, keyArg, , bucketArg] = mockUploadToBackblaze.mock.calls[0];
      // Key deve começar diretamente com o CNPJ (sem prefixo de pasta)
      expect(keyArg).toMatch(new RegExp(`^${CNPJ}/`));
      // Bucket override deve ser 'cad-qwork'
      expect(bucketArg).toBe('cad-qwork');
    });

    it('key NÃO deve conter o prefixo "laudos/" nem "cad-qwork/"', async () => {
      await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ);

      const [, keyArg] = mockUploadToBackblaze.mock.calls[0];
      expect(keyArg).not.toMatch(/^laudos\//);
      expect(keyArg).not.toMatch(/^cad-qwork\//);
    });

    it('key deve seguir o padrão {cnpj}/{tipo}-{ts}-{rand}.pdf', async () => {
      await uploadArquivoCadastro(BUFFER, 'contrato_social', CNPJ);

      const [, keyArg] = mockUploadToBackblaze.mock.calls[0];
      expect(keyArg).toMatch(
        new RegExp(`^${CNPJ}/contrato_social-\\d+-[a-z0-9]+\\.pdf$`)
      );
    });

    it('deve enviar o buffer correto para o Backblaze', async () => {
      await uploadArquivoCadastro(BUFFER, 'doc_identificacao', CNPJ);

      const [bufferArg] = mockUploadToBackblaze.mock.calls[0];
      expect(bufferArg).toEqual(BUFFER);
    });

    it('deve retornar arquivo_remoto com provider, bucket, key e url', async () => {
      const result = await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ);

      expect(result.arquivo_remoto).toBeDefined();
      expect(result.arquivo_remoto.provider).toBe('backblaze');
      expect(result.arquivo_remoto.bucket).toBe('cad-qwork');
      expect(result.arquivo_remoto.key).toMatch(new RegExp(`^${CNPJ}/`));
      expect(result.arquivo_remoto.url).toContain('cad-qwork/');
      expect(result.path).toBeTruthy();
    });

    it('deve funcionar para todos os tipos de arquivo', async () => {
      const tipos = [
        'cartao_cnpj',
        'contrato_social',
        'doc_identificacao',
      ] as const;

      for (const tipo of tipos) {
        mockUploadToBackblaze.mockResolvedValueOnce({
          provider: 'backblaze',
          bucket: 'cad-qwork',
          key: `${CNPJ}/${tipo}-123-abc.pdf`,
          url: `https://s3.test/cad-qwork/${CNPJ}/${tipo}-123-abc.pdf`,
        });

        const result = await uploadArquivoCadastro(BUFFER, tipo, CNPJ);
        const [, keyArg, , bucketArg] =
          mockUploadToBackblaze.mock.calls[
            mockUploadToBackblaze.mock.calls.length - 1
          ];

        expect(keyArg).toMatch(new RegExp(`^${CNPJ}/${tipo}-`));
        expect(bucketArg).toBe('cad-qwork');
        expect(result.arquivo_remoto).toBeDefined();
      }
    });

    it('deve propagar erro do Backblaze', async () => {
      mockUploadToBackblaze.mockRejectedValue(new Error('B2 unavailable'));

      await expect(
        uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ)
      ).rejects.toThrow('Falha ao salvar arquivo de cadastro');
    });
  });

  // ─── DEV ───────────────────────────────────────────────────────────────────

  describe('DEV (NODE_ENV=test, sem VERCEL)', () => {
    it('deve salvar localmente sem chamar Backblaze', async () => {
      await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ);

      expect(mockUploadToBackblaze).not.toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });

    it('deve criar diretório correto em uploads/cadastros/{cnpj}', async () => {
      await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ);

      const mkdirArg = mockMkdir.mock.calls[0][0];
      expect(mkdirArg).toContain('cadastros');
      expect(mkdirArg).toContain(CNPJ);
    });

    it('deve retornar path local com /uploads/cadastros/{cnpj}/', async () => {
      const result = await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ);

      expect(result.path).toMatch(
        new RegExp(`/uploads/cadastros/${CNPJ}/cartao_cnpj_\\d+\\.pdf`)
      );
      expect(result.arquivo_remoto).toBeUndefined();
    });
  });
});
