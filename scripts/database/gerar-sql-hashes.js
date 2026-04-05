/**
 * Gera hashes SHA-256 dos PDFs existentes e exibe SQL para atualização
 */

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function gerarHashArquivo(caminhoArquivo) {
  const conteudo = fs.readFileSync(caminhoArquivo);
  return crypto.createHash('sha256').update(conteudo).digest('hex');
}

async function main() {
  console.log('========================================');
  console.log('GERAÇÃO DE HASHES - PDFs EXISTENTES');
  console.log('========================================\n');

  const pastaLaudos = path.join(__dirname, '..', 'storage', 'laudos');
  const arquivos = fs
    .readdirSync(pastaLaudos)
    .filter((f) => f.endsWith('.pdf'));

  console.log(`📁 Pasta: ${pastaLaudos}`);
  console.log(`📄 PDFs encontrados: ${arquivos.length}\n`);

  const resultados = [];

  for (const arquivo of arquivos) {
    const caminhoCompleto = path.join(pastaLaudos, arquivo);
    const hash = gerarHashArquivo(caminhoCompleto);
    const laudoId = arquivo.match(/laudo-(\d+)\.pdf/)?.[1];

    if (laudoId) {
      resultados.push({ laudoId, arquivo, hash });
      console.log(`✅ ${arquivo}`);
      console.log(`   Hash: ${hash}`);
      console.log(`   ID: ${laudoId}\n`);
    }
  }

  console.log('========================================');
  console.log('COMANDOS SQL PARA ATUALIZAÇÃO');
  console.log('========================================\n');

  resultados.forEach(({ laudoId, hash }) => {
    console.log(`-- Laudo ${laudoId}`);
    console.log(`UPDATE laudos`);
    console.log(`SET hash_pdf = '${hash}',`);
    console.log(`    atualizado_em = NOW()`);
    console.log(`WHERE id = ${laudoId} AND hash_pdf IS NULL;\n`);
  });

  console.log('========================================');
  console.log(`✅ ${resultados.length} hashes gerados com sucesso!`);
  console.log('========================================');
}

main();
