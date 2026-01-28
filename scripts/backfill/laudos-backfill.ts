#!/usr/bin/env node

/**
 * Script de backfill: exporta laudos (pdf + hash) do banco para storage/local
 * Usage:
 *   pnpm ts-node scripts/backfill/laudos-backfill.ts --apply
 *   pnpm ts-node scripts/backfill/laudos-backfill.ts --dry-run
 *
 * Observações:
 * - Por padrão executa em modo dry-run, apenas relata ações.
 * - Com `--apply` escreve arquivos em `storage/laudos` e (opcional) limpa as colunas binárias no DB.
 */

import { query } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');

  console.log('[BACKFILL] Iniciando backfill de laudos (apply=%s)', apply);

  // Buscar laudos com binários no DB
  const res = await query(`
    SELECT id, lote_id, arquivo_pdf, hash_pdf
    FROM laudos
    WHERE arquivo_pdf IS NOT NULL OR hash_pdf IS NOT NULL
    ORDER BY id ASC
  `);

  if (!res.rows || res.rows.length === 0) {
    console.log(
      '[BACKFILL] Nenhum laudo com binário encontrado no DB. Nada a exportar.'
    );
    return;
  }

  const laudosDir = path.join(process.cwd(), 'storage', 'laudos');
  await fs.mkdir(laudosDir, { recursive: true });

  for (const row of res.rows) {
    const id = row.id;
    const fileName = `laudo-${id}.pdf`;
    const filePath = path.join(laudosDir, fileName);
    const metaPath = path.join(laudosDir, `laudo-${id}.json`);

    console.log(`[BACKFILL] Processando laudo id=${id}`);

    // arquivo_pdf no DB pode ser Buffer (em node) ou base64/string dependendo do client
    let buffer: Buffer | null = null;

    if (row.arquivo_pdf) {
      if (Buffer.isBuffer(row.arquivo_pdf)) {
        buffer = row.arquivo_pdf as Buffer;
      } else if (row.arquivo_pdf.buffer) {
        buffer = Buffer.from(row.arquivo_pdf.buffer);
      } else if (typeof row.arquivo_pdf === 'string') {
        buffer = Buffer.from(row.arquivo_pdf, 'base64');
      }
    }

    let hash = row.hash_pdf || null;

    if (!buffer && !hash) {
      console.warn(`[BACKFILL] Laudo ${id} sem binário e sem hash — pular`);
      continue;
    }

    if (!buffer) {
      console.log(
        `[BACKFILL] Laudo ${id} sem binário, apenas hash presente — criando placeholder.json`
      );
      // Nothing to write besides meta; write meta file if apply
    }

    if (buffer && !apply) {
      console.log(
        `[BACKFILL] DRY RUN: laudo ${id} teria sido escrito em ${filePath} (tamanho ${buffer.length} bytes)`
      );
    } else if (buffer && apply) {
      await fs.writeFile(filePath, buffer);
      console.log(`[BACKFILL] Laudo ${id} escrito em ${filePath}`);
    }

    if (!hash && buffer) {
      hash = crypto.createHash('sha256').update(buffer).digest('hex');
    }

    const meta = {
      arquivo: fileName,
      hash,
      criadoEm: new Date().toISOString(),
    };
    if (!apply) {
      console.log(`[BACKFILL] DRY RUN: metadados para laudo ${id}:`, meta);
    } else {
      await fs.writeFile(metaPath, JSON.stringify(meta));
      console.log(`[BACKFILL] Metadados escritos: ${metaPath}`);
    }

    if (apply) {
      // Opcional: limpar colunas binárias no DB
      await query(
        `UPDATE laudos SET arquivo_pdf = NULL, hash_pdf = NULL WHERE id = $1`,
        [id]
      );
      console.log(
        `[BACKFILL] Limpeza de colunas binárias realizada para laudo ${id}`
      );
    }
  }

  console.log('[BACKFILL] Finalizado');
}

main().catch((err) => {
  console.error('[BACKFILL] Erro:', err);
  process.exit(1);
});
