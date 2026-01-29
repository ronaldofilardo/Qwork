/**
 * Script para calcular e atualizar hash SHA-256 de laudos existentes
 *
 * Este script:
 * 1. Busca todos os laudos sem hash_pdf no banco
 * 2. Verifica se o arquivo PDF existe no storage
 * 3. Calcula o hash SHA-256 do arquivo
 * 4. Atualiza o registro no banco de dados
 *
 * Uso:
 * tsx scripts/backfill-laudos-hash.ts
 */

import { query } from '@/lib/db';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

interface LaudoSemHash {
  id: number;
  lote_id: number;
  status: string;
  emitido_em: string | null;
  enviado_em: string | null;
}

async function calcularHashDoArquivo(laudoId: number): Promise<string | null> {
  try {
    const filePath = path.join(
      process.cwd(),
      'storage',
      'laudos',
      `laudo-${laudoId}.pdf`
    );

    // Verificar se arquivo existe
    await fs.access(filePath);

    // Ler arquivo e calcular hash
    const buffer = await fs.readFile(filePath);
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    console.log(
      `  ✓ Hash calculado para laudo ${laudoId}: ${hash.substring(0, 16)}...`
    );
    return hash;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.log(`  ✗ Arquivo não encontrado para laudo ${laudoId}`);
    } else {
      console.error(`  ✗ Erro ao processar laudo ${laudoId}:`, err);
    }
    return null;
  }
}

async function atualizarHashNoBanco(
  laudoId: number,
  hash: string
): Promise<boolean> {
  try {
    // O trigger foi modificado para permitir atualização apenas do hash_pdf quando NULL
    // Ver: database/migrations/allow-hash-backfill.sql
    await query(
      `UPDATE laudos 
       SET hash_pdf = $1 
       WHERE id = $2 AND (hash_pdf IS NULL OR hash_pdf = '')`,
      [hash, laudoId]
    );
    return true;
  } catch (err) {
    console.error(`  ✗ Erro ao atualizar hash do laudo ${laudoId}:`, err);
    return false;
  }
}

async function backfillLaudosHash() {
  console.log('🔄 Iniciando backfill de hashes de laudos...\n');

  try {
    // Buscar laudos sem hash
    const resultado = await query(
      `SELECT id, lote_id, status, emitido_em, enviado_em
       FROM laudos
       WHERE hash_pdf IS NULL OR hash_pdf = ''
       ORDER BY id ASC`,
      []
    );

    const laudosSemHash = resultado.rows as LaudoSemHash[];

    if (laudosSemHash.length === 0) {
      console.log('✅ Todos os laudos já possuem hash! Nada a fazer.\n');
      return;
    }

    console.log(`📊 Encontrados ${laudosSemHash.length} laudos sem hash\n`);

    let processados = 0;
    let atualizados = 0;
    let erros = 0;
    let arquivosNaoEncontrados = 0;

    // Processar cada laudo
    for (const laudo of laudosSemHash) {
      processados++;
      console.log(
        `[${processados}/${laudosSemHash.length}] Processando laudo ${laudo.id}...`
      );

      // Calcular hash do arquivo
      const hash = await calcularHashDoArquivo(laudo.id);

      if (hash) {
        // Atualizar no banco
        const sucesso = await atualizarHashNoBanco(laudo.id, hash);
        if (sucesso) {
          atualizados++;
          console.log(`  ✓ Hash atualizado com sucesso\n`);
        } else {
          erros++;
          console.log(`  ✗ Erro ao atualizar banco\n`);
        }
      } else {
        arquivosNaoEncontrados++;
        console.log(`  ✗ Arquivo não encontrado\n`);
      }

      // Pequena pausa para não sobrecarregar
      if (processados % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Estatísticas finais
    console.log('\n' + '='.repeat(60));
    console.log('📊 ESTATÍSTICAS FINAIS');
    console.log('='.repeat(60));
    console.log(`Total de laudos processados: ${processados}`);
    console.log(`✅ Hashes calculados e atualizados: ${atualizados}`);
    console.log(`📁 Arquivos não encontrados: ${arquivosNaoEncontrados}`);
    console.log(`❌ Erros ao atualizar: ${erros}`);
    console.log('='.repeat(60));

    if (atualizados > 0) {
      console.log('\n✅ Backfill concluído com sucesso!');
      console.log(
        '💡 As UIs agora exibirão os hashes dos laudos atualizados.\n'
      );
    }
  } catch (err) {
    console.error('\n❌ Erro fatal ao executar backfill:', err);
    process.exit(1);
  }
}

// Executar script
backfillLaudosHash()
  .then(() => {
    console.log('✅ Script finalizado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erro ao executar script:', err);
    process.exit(1);
  });
