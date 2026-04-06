/**
 * Testes unitários: uploadArquivoCadastro
 *
 * Cobre:
 * - Bucket correto: 'cad-qwork' (separado do bucket de laudos)
 * - Segregação por tipo: entidades/{cnpj}/ ou clinicas/{cnpj}/
 * - Caminho correto no bucket: {entidades|clinicas}/{cnpj}/{tipo}-{ts}-{rand}.pdf
 * - PROD → chama uploadToBackblaze com bucketOverride='cad-qwork'
 * - DEV  → salva localmente em storage/tomadores/{entidades|clinicas}/{cnpj}/
 * - Retorno de arquivo_remoto em PROD
 * - Fallback: sem tipoTomador → pasta 'entidades'
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

/** Helper para construir mock de retorno do Backblaze */
function mockB2Result(pasta: string, tipo: string) {
  return {
    provider: 'backblaze' as const,
    bucket: 'cad-qwork',
    key: `${pasta}/${CNPJ}/${tipo}-1708000000000-abc123.pdf`,
    url: `https://s3.test/cad-qwork/${pasta}/${CNPJ}/${tipo}-1708000000000-abc123.pdf`,
  };
}

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
    });

    // ── Segregação entidade ─────────────────────────────────────────────────

    describe('tipoTomador=entidade', () => {
      beforeEach(() => {
        mockUploadToBackblaze.mockResolvedValue(
          mockB2Result('entidades', 'cartao_cnpj')
        );
      });

      it('deve usar prefixo "entidades/" na key do Backblaze', async () => {
        await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ, 'entidade');

        const [, keyArg, , bucketArg] = mockUploadToBackblaze.mock.calls[0];
        expect(keyArg).toMatch(new RegExp(`^entidades/${CNPJ}/`));
        expect(bucketArg).toBe('cad-qwork');
      });

      it('key deve seguir o padrão entidades/{cnpj}/{tipo}-{ts}-{rand}.pdf', async () => {
        mockUploadToBackblaze.mockResolvedValue(
          mockB2Result('entidades', 'contrato_social')
        );
        await uploadArquivoCadastro(
          BUFFER,
          'contrato_social',
          CNPJ,
          'entidade'
        );

        const [, keyArg] = mockUploadToBackblaze.mock.calls[0];
        expect(keyArg).toMatch(
          new RegExp(
            `^entidades/${CNPJ}/contrato_social-\\d+-[a-z0-9]+\\.pdf$`
          )
        );
      });
    });

    // ── Segregação clínica ──────────────────────────────────────────────────

    describe('tipoTomador=clinica', () => {
      beforeEach(() => {
        mockUploadToBackblaze.mockResolvedValue(
          mockB2Result('clinicas', 'cartao_cnpj')
        );
      });

      it('deve usar prefixo "clinicas/" na key do Backblaze', async () => {
        await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ, 'clinica');

        const [, keyArg, , bucketArg] = mockUploadToBackblaze.mock.calls[0];
        expect(keyArg).toMatch(new RegExp(`^clinicas/${CNPJ}/`));
        expect(bucketArg).toBe('cad-qwork');
      });

      it('key deve seguir o padrão clinicas/{cnpj}/{tipo}-{ts}-{rand}.pdf', async () => {
        mockUploadToBackblaze.mockResolvedValue(
          mockB2Result('clinicas', 'doc_identificacao')
        );
        await uploadArquivoCadastro(
          BUFFER,
          'doc_identificacao',
          CNPJ,
          'clinica'
        );

        const [, keyArg] = mockUploadToBackblaze.mock.calls[0];
        expect(keyArg).toMatch(
          new RegExp(
            `^clinicas/${CNPJ}/doc_identificacao-\\d+-[a-z0-9]+\\.pdf$`
          )
        );
      });
    });

    // ── Fallback (sem tipoTomador) ──────────────────────────────────────────

    describe('sem tipoTomador (fallback → "entidades")', () => {
      beforeEach(() => {
        mockUploadToBackblaze.mockResolvedValue(
          mockB2Result('entidades', 'cartao_cnpj')
        );
      });

      it('deve usar prefixo "entidades/" quando tipoTomador não fornecido', async () => {
        await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ);

        const [, keyArg] = mockUploadToBackblaze.mock.calls[0];
        expect(keyArg).toMatch(new RegExp(`^entidades/${CNPJ}/`));
      });
    });

    // ── Comportamento geral ─────────────────────────────────────────────────

    it('key NÃO deve conter o prefixo "laudos/" nem "cad-qwork/"', async () => {
      mockUploadToBackblaze.mockResolvedValue(
        mockB2Result('entidades', 'cartao_cnpj')
      );
      await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ, 'entidade');

      const [, keyArg] = mockUploadToBackblaze.mock.calls[0];
      expect(keyArg).not.toMatch(/^laudos\//);
      expect(keyArg).not.toMatch(/^cad-qwork\//);
    });

    it('deve enviar o buffer correto para o Backblaze', async () => {
      mockUploadToBackblaze.mockResolvedValue(
        mockB2Result('entidades', 'doc_identificacao')
      );
      await uploadArquivoCadastro(BUFFER, 'doc_identificacao', CNPJ, 'entidade');

      const [bufferArg] = mockUploadToBackblaze.mock.calls[0];
      expect(bufferArg).toEqual(BUFFER);
    });

    it('deve retornar arquivo_remoto com provider, bucket, key e url', async () => {
      mockUploadToBackblaze.mockResolvedValue(
        mockB2Result('entidades', 'cartao_cnpj')
      );
      const result = await uploadArquivoCadastro(
        BUFFER,
        'cartao_cnpj',
        CNPJ,
        'entidade'
      );

      expect(result.arquivo_remoto).toBeDefined();
      expect(result.arquivo_remoto!.provider).toBe('backblaze');
      expect(result.arquivo_remoto!.bucket).toBe('cad-qwork');
      expect(result.arquivo_remoto!.key).toMatch(
        new RegExp(`^entidades/${CNPJ}/`)
      );
      expect(result.arquivo_remoto!.url).toContain('cad-qwork/');
      expect(result.path).toBeTruthy();
    });

    it('deve funcionar para todos os tipos de arquivo (entidade)', async () => {
      const tipos = [
        'cartao_cnpj',
        'contrato_social',
        'doc_identificacao',
      ] as const;

      for (const tipo of tipos) {
        mockUploadToBackblaze.mockResolvedValueOnce(
          mockB2Result('entidades', tipo)
        );

        const result = await uploadArquivoCadastro(
          BUFFER,
          tipo,
          CNPJ,
          'entidade'
        );
        const [, keyArg, , bucketArg] =
          mockUploadToBackblaze.mock.calls[
            mockUploadToBackblaze.mock.calls.length - 1
          ];

        expect(keyArg).toMatch(new RegExp(`^entidades/${CNPJ}/${tipo}-`));
        expect(bucketArg).toBe('cad-qwork');
        expect(result.arquivo_remoto).toBeDefined();
      }
    });

    it('deve funcionar para todos os tipos de arquivo (clinica)', async () => {
      const tipos = [
        'cartao_cnpj',
        'contrato_social',
        'doc_identificacao',
      ] as const;

      for (const tipo of tipos) {
        mockUploadToBackblaze.mockResolvedValueOnce(
          mockB2Result('clinicas', tipo)
        );

        const result = await uploadArquivoCadastro(
          BUFFER,
          tipo,
          CNPJ,
          'clinica'
        );
        const [, keyArg, , bucketArg] =
          mockUploadToBackblaze.mock.calls[
            mockUploadToBackblaze.mock.calls.length - 1
          ];

        expect(keyArg).toMatch(new RegExp(`^clinicas/${CNPJ}/${tipo}-`));
        expect(bucketArg).toBe('cad-qwork');
        expect(result.arquivo_remoto).toBeDefined();
      }
    });

    it('deve propagar erro do Backblaze', async () => {
      mockUploadToBackblaze.mockRejectedValue(new Error('B2 unavailable'));

      await expect(
        uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ, 'entidade')
      ).rejects.toThrow('Falha ao salvar arquivo de cadastro');
    });
  });

  // ─── DEV ───────────────────────────────────────────────────────────────────

  describe('DEV (NODE_ENV=test, sem VERCEL)', () => {
    it('deve salvar localmente sem chamar Backblaze', async () => {
      await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ, 'entidade');

      expect(mockUploadToBackblaze).not.toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });

    it('deve criar diretório storage/tomadores/entidades/{cnpj} para entidade', async () => {
      await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ, 'entidade');

      const mkdirArg = mockMkdir.mock.calls[0][0] as string;
      expect(mkdirArg).toContain('tomadores');
      expect(mkdirArg).toContain('entidades');
      expect(mkdirArg).toContain(CNPJ);
    });

    it('deve criar diretório storage/tomadores/clinicas/{cnpj} para clinica', async () => {
      await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ, 'clinica');

      const mkdirArg = mockMkdir.mock.calls[0][0] as string;
      expect(mkdirArg).toContain('tomadores');
      expect(mkdirArg).toContain('clinicas');
      expect(mkdirArg).toContain(CNPJ);
    });

    it('deve retornar path local com storage/tomadores/entidades/{cnpj}/', async () => {
      const result = await uploadArquivoCadastro(
        BUFFER,
        'cartao_cnpj',
        CNPJ,
        'entidade'
      );

      expect(result.path).toMatch(
        new RegExp(
          `storage/tomadores/entidades/${CNPJ}/cartao_cnpj_\\d+\\.pdf`
        )
      );
      expect(result.arquivo_remoto).toBeUndefined();
    });

    it('deve retornar path local com storage/tomadores/clinicas/{cnpj}/', async () => {
      const result = await uploadArquivoCadastro(
        BUFFER,
        'cartao_cnpj',
        CNPJ,
        'clinica'
      );

      expect(result.path).toMatch(
        new RegExp(`storage/tomadores/clinicas/${CNPJ}/cartao_cnpj_\\d+\\.pdf`)
      );
      expect(result.arquivo_remoto).toBeUndefined();
    });

    it('deve usar pasta "entidades" como fallback sem tipoTomador', async () => {
      const result = await uploadArquivoCadastro(BUFFER, 'cartao_cnpj', CNPJ);

      expect(result.path).toMatch(/storage\/tomadores\/entidades\//);
    });

    it('não deve gerar caminho com "uploads/cadastros" (legado)', async () => {
      const result = await uploadArquivoCadastro(
        BUFFER,
        'cartao_cnpj',
        CNPJ,
        'entidade'
      );
      expect(result.path).not.toContain('uploads/cadastros');
    });
  });
});
