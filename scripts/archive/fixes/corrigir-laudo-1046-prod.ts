/**
 * Script de correção pontual — Lote 1046 em PROD
 *
 * Contexto:
 *   - O laudo do lote 1046 foi gerado localmente e enviado ao bucket Backblaze com sucesso.
 *   - O upload (rodado localmente com ALLOW_PROD_DB_LOCAL=true) gravou status='enviado' no Neon PROD.
 *   - O código em PROD (Vercel) ainda filtra laudos por status='emitido' somente.
 *   - Resultado: dashboard RH mostra "Pendente" mesmo com laudo no bucket.
 *
 * O que este script faz:
 *   1. Verifica o estado atual do laudo no banco PROD.
 *   2. Confirma que arquivo_remoto_url está preenchido (laudo realmente no bucket).
 *   3. Reverte laudos.status → 'emitido' para que o código PROD atual consiga encontrá-lo.
 *   4. Atualiza lotes_avaliacao.status → 'finalizado'.
 *
 * Quando o código for deployado (com IN ('emitido','enviado')), ambos os valores continuam válidos.
 *
 * Uso:
 *   pnpm tsx scripts/corrigir-laudo-1046-prod.ts
 *
 * Requer:
 *   - DATABASE_URL apontando para Neon PROD (vem de .env)
 *   - ALLOW_PROD_DB_LOCAL=true em .env.local
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';

// Carregar variáveis de ambiente na mesma ordem do Next.js
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const LOTE_ID = 1046;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const allowProd = process.env.ALLOW_PROD_DB_LOCAL;

  if (!databaseUrl) {
    console.error(
      '❌ DATABASE_URL não encontrado. Verifique .env e .env.local.'
    );
    process.exit(1);
  }

  if (allowProd !== 'true') {
    console.error(
      '❌ ALLOW_PROD_DB_LOCAL não está definido como "true" em .env.local.'
    );
    console.error(
      '   Este script só deve rodar com acesso explícito ao banco PROD.'
    );
    process.exit(1);
  }

  // Confirmar que é Neon (não banco local)
  if (!databaseUrl.includes('neon') && !databaseUrl.includes('neondb')) {
    console.error(
      '❌ DATABASE_URL não parece ser Neon. Abortando por segurança.'
    );
    console.error('   URL:', databaseUrl.substring(0, 50) + '...');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log(
      `\n🔍 Verificando estado do laudo para lote ${LOTE_ID} no banco PROD...\n`
    );

    // 1. Verificar estado atual
    const check = await pool.query<{
      id: number;
      lote_id: number;
      status: string;
      arquivo_remoto_url: string | null;
      arquivo_remoto_key: string | null;
      enviado_em: string | null;
      emitido_em: string | null;
    }>(
      `SELECT id, lote_id, status, arquivo_remoto_url, arquivo_remoto_key, enviado_em, emitido_em
       FROM laudos
       WHERE lote_id = $1
       LIMIT 1`,
      [LOTE_ID]
    );

    if (check.rows.length === 0) {
      console.error(`❌ Nenhum laudo encontrado para lote ${LOTE_ID}!`);
      console.error(
        '   Verifique se o laudo foi gerado antes de fazer o upload.'
      );
      process.exit(1);
    }

    const laudo = check.rows[0];
    console.log('📋 Estado atual do laudo:');
    console.log(`   id:                ${laudo.id}`);
    console.log(`   lote_id:           ${laudo.lote_id}`);
    console.log(`   status:            ${laudo.status}`);
    console.log(`   emitido_em:        ${laudo.emitido_em ?? 'null'}`);
    console.log(`   enviado_em:        ${laudo.enviado_em ?? 'null'}`);
    console.log(
      `   arquivo_remoto_url:${laudo.arquivo_remoto_url ? ' ✅ ' + laudo.arquivo_remoto_url.substring(0, 60) + '...' : ' ❌ null'}`
    );
    console.log(
      `   arquivo_remoto_key:${laudo.arquivo_remoto_key ? ' ✅ ' + laudo.arquivo_remoto_key : ' ❌ null'}`
    );

    if (!laudo.arquivo_remoto_url || !laudo.arquivo_remoto_key) {
      console.error(
        '\n❌ Laudo não tem arquivo_remoto_url/key — o upload ao bucket pode não ter sido registrado no banco!'
      );
      console.error(
        '   Refaça o upload pelo painel do emissor antes de rodar este script.'
      );
      process.exit(1);
    }

    if (laudo.status === 'emitido') {
      console.log(
        '\n✅ Laudo já está com status="emitido". Nenhuma alteração necessária no laudo.'
      );
    } else {
      // 2. Reverter para 'emitido' para compatibilidade com código PROD atual
      await pool.query(
        `UPDATE laudos
         SET status = 'emitido',
             emitido_em = COALESCE(emitido_em, enviado_em, NOW()),
             atualizado_em = NOW()
         WHERE id = $1`,
        [laudo.id]
      );
      console.log(
        `\n✅ laudos.status atualizado: '${laudo.status}' → 'emitido'`
      );
      console.log(
        '   (Código PROD atual filtra por status="emitido" — temporário até deploy das correções)'
      );
    }

    // 3. Verificar e atualizar lotes_avaliacao
    const loteCheck = await pool.query<{ id: number; status: string }>(
      'SELECT id, status FROM lotes_avaliacao WHERE id = $1',
      [LOTE_ID]
    );

    if (loteCheck.rows.length === 0) {
      console.warn(`⚠️  lotes_avaliacao id=${LOTE_ID} não encontrado.`);
    } else {
      const lote = loteCheck.rows[0];
      console.log(`\n📋 Estado atual do lote: status = '${lote.status}'`);

      if (lote.status === 'finalizado') {
        console.log(
          '✅ Lote já está com status="finalizado". Nenhuma alteração necessária.'
        );
      } else {
        await pool.query(
          `UPDATE lotes_avaliacao SET status = 'finalizado', atualizado_em = NOW() WHERE id = $1`,
          [LOTE_ID]
        );
        console.log(
          `✅ lotes_avaliacao.status atualizado: '${lote.status}' → 'finalizado'`
        );
      }
    }

    console.log('\n🎉 Correção aplicada com sucesso!');
    console.log(
      '   Recarregue a página do dashboard RH em PROD para ver o laudo no card.'
    );
    console.log(
      '\n⚠️  Próximo passo: deploy do feature/v2 para que status="enviado" também seja reconhecido.'
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
