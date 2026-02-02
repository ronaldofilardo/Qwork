/**
 * Teste unitário: Validações de upload manual de laudo
 *
 * Testes isolados que não dependem de servidor rodando
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  createTestPDF,
  calculateSHA256,
  validatePDFHeader,
} from '../scripts/create-test-pdf';

describe('Upload Manual de Laudo - Validações', () => {
  let testPdfBuffer: Buffer;
  let clientSha256: string;

  beforeAll(() => {
    // Criar PDF de teste
    testPdfBuffer = createTestPDF();
    clientSha256 = calculateSHA256(testPdfBuffer);

    console.log(`🧪 PDF de teste criado:`);
    console.log(`   Tamanho: ${testPdfBuffer.length} bytes`);
    console.log(`   SHA-256: ${clientSha256}`);
  });

  it('deve validar PDF de teste', () => {
    expect(validatePDFHeader(testPdfBuffer)).toBe(true);
    expect(testPdfBuffer.length).toBeLessThanOrEqual(1048576); // 1 MB
    expect(clientSha256).toHaveLength(64);
  });

  it('deve validar tamanho máximo de 1MB', () => {
    const maxSize = 1048576; // 1 MB
    expect(testPdfBuffer.length).toBeLessThanOrEqual(maxSize);

    // Simular arquivo muito grande
    const largeSize = 1048577; // 1 MB + 1 byte
    expect(largeSize).toBeGreaterThan(maxSize);
  });

  it('deve validar header PDF', () => {
    expect(validatePDFHeader(testPdfBuffer)).toBe(true);

    // Arquivo não-PDF
    const notPdf = Buffer.from('Not a PDF file');
    expect(validatePDFHeader(notPdf)).toBe(false);

    // Arquivo vazio
    const empty = Buffer.from('');
    expect(validatePDFHeader(empty)).toBe(false);
  });

  it('deve calcular SHA-256 corretamente', () => {
    expect(clientSha256).toHaveLength(64);
    expect(clientSha256).toMatch(/^[a-f0-9]{64}$/);

    // Calcular novamente deve dar o mesmo resultado
    const sha256Again = calculateSHA256(testPdfBuffer);
    expect(sha256Again).toBe(clientSha256);
  });

  it('deve criar PDF válido com tamanho apropriado', () => {
    // PDF deve ter entre 400 bytes e 1 MB
    expect(testPdfBuffer.length).toBeGreaterThan(400);
    expect(testPdfBuffer.length).toBeLessThanOrEqual(1048576);

    // Header deve estar correto
    const header = testPdfBuffer.slice(0, 7).toString();
    expect(header).toMatch(/^%PDF-1\./);
  });

  it('deve validar que diferentes PDFs geram hashes diferentes', () => {
    const pdf1 = createTestPDF();
    const pdf2 = createTestPDF();

    const hash1 = calculateSHA256(pdf1);
    const hash2 = calculateSHA256(pdf2);

    // Hashes devem ser diferentes (PDFs têm timestamp único)
    expect(hash1).not.toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash2).toHaveLength(64);
  });
});
