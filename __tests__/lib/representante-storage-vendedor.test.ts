/**
 * Testes unitários: uploadDocumentoVendedor
 *
 * Cobre:
 * - DEV: salva localmente com path correto (rep/vendedores/vendId/subpasta)
 * - PROD: chama uploadToBackblaze com bucket 'rep-qwork' e key no formato correto
 * - Key PROD: {PF|PJ}/{repId}/vendedores/{vendId}/{cad|nf|rpa}/{tipo}_{ts}-{rand}.{ext}
 * - repTipoPessoa 'pj' → subDir 'PJ'
 * - repTipoPessoa 'pf' → subDir 'PF'
 * - Erro de upload é propagado como Error
 */

jest.mock('@/lib/storage/backblaze-client', () => ({
  uploadToBackblaze: jest.fn(),
}));

jest.mock('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

import { uploadDocumentoVendedor } from '@/lib/storage/representante-storage';
import { uploadToBackblaze } from '@/lib/storage/backblaze-client';
import * as fsPromises from 'fs/promises';

const mockUpload = uploadToBackblaze as jest.MockedFunction<
  typeof uploadToBackblaze
>;
const mockMkdir = fsPromises.mkdir as jest.MockedFunction<
  typeof fsPromises.mkdir
>;
const mockWriteFile = fsPromises.writeFile as jest.MockedFunction<
  typeof fsPromises.writeFile
>;

const PDF_BUFFER = Buffer.from('%PDF-1.4 test');
const REP_CPF = '12345678901';
const REP_CNPJ = '12345678000100';
const VND_CPF = '98765432100';
const VND_CNPJ = '98765432000111';

describe('uploadDocumentoVendedor', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
    delete process.env.VERCEL;
    process.env.NODE_ENV = 'test';
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  // ─── PROD (Backblaze) ────────────────────────────────────────────────────

  describe('PROD (VERCEL=1)', () => {
    beforeEach(() => {
      process.env.VERCEL = '1';
      mockUpload.mockResolvedValue({
        provider: 'backblaze',
        bucket: 'rep-qwork',
        key: `PF/${REP_CPF}/vendedores/${VND_CPF}/cad/cpf_1700000000000-abc123.pdf`,
        url: `https://s3.test/rep-qwork/PF/${REP_CPF}/vendedores/${VND_CPF}/cad/cpf_1700000000000-abc123.pdf`,
      });
    });

    it('deve chamar uploadToBackblaze com bucket rep-qwork', async () => {
      await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cpf',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'CAD',
        contentType: 'application/pdf',
      });

      expect(mockUpload).toHaveBeenCalledTimes(1);
      const [, , , bucketArg] = mockUpload.mock.calls[0];
      expect(bucketArg).toBe('rep-qwork');
    });

    it('key PF deve seguir padrão PF/{repId}/vendedores/{vendId}/cad/cpf_{ts}-{rnd}.pdf', async () => {
      await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cpf',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'CAD',
        contentType: 'application/pdf',
      });

      const [, keyArg] = mockUpload.mock.calls[0];
      expect(keyArg).toMatch(
        new RegExp(
          `^PF/${REP_CPF}/vendedores/${VND_CPF}/cad/cpf_\\d+-[a-z0-9]+\\.pdf$`
        )
      );
    });

    it('key PJ deve usar subDir PJ com CNPJ do representante', async () => {
      mockUpload.mockResolvedValueOnce({
        provider: 'backblaze',
        bucket: 'rep-qwork',
        key: `PJ/${REP_CNPJ}/vendedores/${VND_CNPJ}/nf/cnpj_100-xyz.pdf`,
        url: `https://s3.test/rep-qwork/PJ/${REP_CNPJ}/vendedores/${VND_CNPJ}/nf/cnpj_100-xyz.pdf`,
      });

      await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cnpj',
        repIdentificador: REP_CNPJ,
        repTipoPessoa: 'pj',
        vendedorIdentificador: VND_CNPJ,
        subpasta: 'NF',
        contentType: 'application/pdf',
      });

      const [, keyArg] = mockUpload.mock.calls[0];
      expect(keyArg).toMatch(new RegExp(`^PJ/${REP_CNPJ}/vendedores/`));
    });

    it('deve retornar arquivo_remoto com provider, bucket e key', async () => {
      const expectedKey = `PF/${REP_CPF}/vendedores/${VND_CPF}/cad/cpf_1700000000000-abc123.pdf`;
      mockUpload.mockResolvedValueOnce({
        provider: 'backblaze',
        bucket: 'rep-qwork',
        key: expectedKey,
        url: `https://s3.test/rep-qwork/${expectedKey}`,
      });

      const result = await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cpf',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'CAD',
        contentType: 'application/pdf',
      });

      expect(result.arquivo_remoto).toBeDefined();
      expect(result.arquivo_remoto?.provider).toBe('backblaze');
      expect(result.arquivo_remoto?.bucket).toBe('rep-qwork');
    });

    it('subpasta RPA deve aparecer como "rpa" na key (lowercase)', async () => {
      mockUpload.mockResolvedValueOnce({
        provider: 'backblaze',
        bucket: 'rep-qwork',
        key: `PF/${REP_CPF}/vendedores/${VND_CPF}/rpa/rpa_100-abc.pdf`,
        url: 'https://s3.test/url',
      });

      await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'rpa',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'RPA',
        contentType: 'application/pdf',
      });

      const [, keyArg] = mockUpload.mock.calls[0];
      expect(keyArg).toContain('/rpa/');
    });

    it('deve propagar erro do Backblaze como Error', async () => {
      mockUpload.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(
        uploadDocumentoVendedor({
          buffer: PDF_BUFFER,
          tipo: 'cpf',
          repIdentificador: REP_CPF,
          repTipoPessoa: 'pf',
          vendedorIdentificador: VND_CPF,
          subpasta: 'CAD',
          contentType: 'application/pdf',
        })
      ).rejects.toThrow('Falha ao salvar documento de vendedor');
    });
  });

  // ─── DEV (local) ─────────────────────────────────────────────────────────

  describe('DEV (local)', () => {
    it('deve chamar fs.mkdir e fs.writeFile uma vez cada', async () => {
      await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cpf',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'CAD',
        contentType: 'application/pdf',
      });

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('path retornado deve conter "vendedores" entre repId e vendId', async () => {
      const result = await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cpf',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'CAD',
        contentType: 'application/pdf',
      });

      expect(result.path).toContain(`${REP_CPF}/vendedores/${VND_CPF}`);
    });

    it('path PJ deve conter subDir "PJ"', async () => {
      const result = await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cnpj',
        repIdentificador: REP_CNPJ,
        repTipoPessoa: 'pj',
        vendedorIdentificador: VND_CNPJ,
        subpasta: 'CAD',
        contentType: 'application/pdf',
      });

      expect(result.path).toContain('representantes/PJ/');
    });

    it('path PF deve conter subDir "PF"', async () => {
      const result = await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cpf',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'RPA',
        contentType: 'application/pdf',
      });

      expect(result.path).toContain('representantes/PF/');
    });

    it('path deve incluir a subpasta correta (CAD)', async () => {
      const result = await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cpf',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'CAD',
        contentType: 'application/pdf',
      });

      expect(result.path).toContain('/CAD/');
    });

    it('path deve incluir a subpasta correta (NF)', async () => {
      const result = await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cnpj',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'NF',
        contentType: 'application/pdf',
      });

      expect(result.path).toContain('/NF/');
    });

    it('deve escrever o buffer correto no arquivo', async () => {
      await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cpf',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'CAD',
        contentType: 'application/pdf',
      });

      const [, bufferArg] = mockWriteFile.mock.calls[0];
      expect(bufferArg).toEqual(PDF_BUFFER);
    });

    it('JPEG deve resultar em extensão .jpg', async () => {
      const result = await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cpf',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'CAD',
        contentType: 'image/jpeg',
      });

      expect(result.path).toMatch(/\.jpg$/);
    });

    it('PNG deve resultar em extensão .png', async () => {
      const result = await uploadDocumentoVendedor({
        buffer: PDF_BUFFER,
        tipo: 'cpf',
        repIdentificador: REP_CPF,
        repTipoPessoa: 'pf',
        vendedorIdentificador: VND_CPF,
        subpasta: 'CAD',
        contentType: 'image/png',
      });

      expect(result.path).toMatch(/\.png$/);
    });
  });
});
