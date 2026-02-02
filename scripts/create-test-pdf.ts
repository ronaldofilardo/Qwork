import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

/**
 * Utilitário para criar PDF de teste válido
 * Usado para testes automatizados do fluxo de upload
 */

export function createTestPDF(outputPath?: string): Buffer {
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 150
>>
stream
BT
/F1 16 Tf
50 700 Td
(LAUDO DE TESTE) Tj
0 -30 Td
/F1 12 Tf
(Criado em: ${new Date().toISOString()}) Tj
0 -20 Td
(Hash: ${crypto.randomBytes(8).toString('hex')}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000317 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
516
%%EOF
`;

  const buffer = Buffer.from(pdfContent, 'utf-8');

  if (outputPath) {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, buffer);
    console.log(`✓ PDF de teste criado: ${outputPath}`);
  }

  return buffer;
}

export function calculateSHA256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export function validatePDFHeader(buffer: Buffer): boolean {
  const header = buffer.slice(0, 5).toString('ascii');
  return header.startsWith('%PDF-');
}

// Se executado diretamente
if (require.main === module) {
  const outputPath = path.join(process.cwd(), 'scripts', 'test-laudo.pdf');
  const buffer = createTestPDF(outputPath);
  const hash = calculateSHA256(buffer);
  const isValid = validatePDFHeader(buffer);

  console.log(
    `Tamanho: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(2)} KB)`
  );
  console.log(`SHA-256: ${hash}`);
  console.log(`Válido: ${isValid ? '✓' : '✗'}`);
}
