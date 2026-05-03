/**
 * Script: Gerar hash SHA-256 para laudos emitidos sem hash
 *
 * Contexto: Laudos foram emitidos antes de correções e não têm hash_pdf
 * Objetivo: Localizar PDFs, gerar hash SHA-256 e atualizar banco
 *
 * IMPORTANTE: Gerar hash após emissão NÃO quebra imutabilidade
 * (hash é posterior à emissão do laudo)
 */

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco (Neon)
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false,
  },
});

/**
 * Gera hash SHA-256 de um arquivo
 */
function gerarHashArquivo(caminhoArquivo) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(caminhoArquivo);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

/**
 * Busca laudos sem hash no banco
 */
async function buscarLaudosSemHash() {
  const query = `
    SELECT 
      l.id,
      l.lote_id,
      
      l.status,
      l.emitido_em
    FROM laudos l
    LEFT JOIN lotes_avaliacao la ON la.id = l.lote_id
    WHERE l.status IN ('emitido', 'enviado')
      AND l.hash_pdf IS NULL
    ORDER BY l.id
  `;

  const result = await pool.query(query);
  return result.rows;
}

/**
 * Atualiza hash do laudo no banco
 */
async function atualizarHashLaudo(laudoId, hash) {
  const query = `
    UPDATE laudos 
    SET hash_pdf = $1,
        atualizado_em = NOW()
    WHERE id = $2
  `;

  await pool.query(query, [hash, laudoId]);
}

/**
 * Processa um laudo: localiza PDF, gera hash, atualiza banco
 */
async function processarLaudo(laudo) {
  const { id, lote_id, status, emitido_em } = laudo;

  // Tentar localizar o PDF
  const pastaLaudos = path.join(__dirname, '..', 'storage', 'laudos');
  const possiveisNomes = [
    `laudo-${id}.pdf`,
    `laudo-${lote_id}.pdf`,
    `${codigo}.pdf`,
    `laudo_${id}.pdf`,
    `laudo_${lote_id}.pdf`,
  ];

  let arquivoEncontrado = null;

  for (const nomeArquivo of possiveisNomes) {
    const caminhoCompleto = path.join(pastaLaudos, nomeArquivo);
    if (fs.existsSync(caminhoCompleto)) {
      arquivoEncontrado = caminhoCompleto;
      break;
    }
  }

  if (!arquivoEncontrado) {
    console.log(`❌ Laudo ID ${id} (${codigo}): PDF não encontrado`);
    return {
      id,
      codigo,
      sucesso: false,
      motivo: 'PDF não encontrado',
    };
  }

  try {
    // Gerar hash do arquivo
    const hash = await gerarHashArquivo(arquivoEncontrado);

    // Atualizar banco
    await atualizarHashLaudo(id, hash);

    console.log(`✅ Laudo ID ${id} (${codigo}): Hash gerado e salvo`);
    console.log(`   Arquivo: ${path.basename(arquivoEncontrado)}`);
    console.log(`   Hash: ${hash.substring(0, 16)}...${hash.substring(48)}`);

    return {
      id,
      codigo,
      sucesso: true,
      hash,
      arquivo: path.basename(arquivoEncontrado),
    };
  } catch (erro) {
    console.error(`❌ Laudo ID ${id} (${codigo}): Erro ao processar`);
    console.error(`   ${erro.message}`);

    return {
      id,
      codigo,
      sucesso: false,
      motivo: erro.message,
    };
  }
}

/**
 * Execução principal
 */
async function main() {
  console.log('========================================');
  console.log('GERAÇÃO DE HASH PARA LAUDOS EMITIDOS');
  console.log('========================================\n');

  try {
    // Buscar laudos sem hash
    console.log('🔍 Buscando laudos sem hash...\n');
    const laudos = await buscarLaudosSemHash();

    if (laudos.length === 0) {
      console.log('✅ Todos os laudos emitidos já têm hash!\n');
      return;
    }

    console.log(`📋 Encontrados ${laudos.length} laudos sem hash\n`);

    // Processar cada laudo
    const resultados = [];
    for (const laudo of laudos) {
      const resultado = await processarLaudo(laudo);
      resultados.push(resultado);
      console.log(''); // linha em branco
    }

    // Relatório final
    console.log('========================================');
    console.log('RELATÓRIO FINAL');
    console.log('========================================\n');

    const sucessos = resultados.filter((r) => r.sucesso);
    const falhas = resultados.filter((r) => !r.sucesso);

    console.log(`✅ Hashes gerados: ${sucessos.length}`);
    console.log(`❌ Falhas: ${falhas.length}`);

    if (falhas.length > 0) {
      console.log('\n⚠️ Laudos que falharam:');
      falhas.forEach((f) => {
        console.log(`   - Laudo ${f.id} (${f.codigo}): ${f.motivo}`);
      });
    }

    console.log('\n✅ Script concluído!\n');
  } catch (erro) {
    console.error('❌ Erro fatal:', erro);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
main();
