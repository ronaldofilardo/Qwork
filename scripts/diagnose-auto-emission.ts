import { loadEnv } from './load-env';
loadEnv();

import { query } from '../lib/db';

async function diagnoseAutoEmission() {
  console.log('='.repeat(60));
  console.log('DIAGNÓSTICO: Emissão Automática Indesejada');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. Verificar se trigger existe
    console.log(
      '1️⃣  Verificando trigger trg_reservar_id_laudo_on_lote_insert...'
    );
    const triggerCheck = await query(`
      SELECT tgname, tgrelid::regclass AS table_name, pg_get_triggerdef(oid) AS definition
      FROM pg_trigger
      WHERE tgname = 'trg_reservar_id_laudo_on_lote_insert'
    `);

    if (triggerCheck.rowCount > 0) {
      console.log('   ❌ TRIGGER EXISTE (PROBLEMA CONFIRMADO)');
      console.table(triggerCheck.rows);
    } else {
      console.log('   ✅ Trigger não existe (migration 151 foi aplicada)');
    }
    console.log('');

    // 2. Verificar função
    console.log(
      '2️⃣  Verificando função fn_reservar_id_laudo_on_lote_insert...'
    );
    const funcCheck = await query(`
      SELECT proname, pg_get_functiondef(oid) AS definition
      FROM pg_proc
      WHERE proname = 'fn_reservar_id_laudo_on_lote_insert'
    `);

    if (funcCheck.rowCount > 0) {
      console.log('   ❌ FUNÇÃO EXISTE (trigger ainda pode disparar)');
    } else {
      console.log('   ✅ Função não existe');
    }
    console.log('');

    // 3. Verificar laudos órfãos em rascunho
    console.log('3️⃣  Verificando laudos em rascunho sem emissor...');
    const orphanLaudos = await query(`
      SELECT id, lote_id, status, emissor_cpf, hash_pdf, emitido_em, criado_em
      FROM laudos
      WHERE status = 'rascunho'
        AND emissor_cpf IS NULL
        AND hash_pdf IS NULL
      ORDER BY id DESC
      LIMIT 10
    `);

    console.log(`   Encontrados: ${orphanLaudos.rowCount} laudos órfãos`);
    if (orphanLaudos.rowCount > 0) {
      console.table(orphanLaudos.rows);
    }
    console.log('');

    // 4. Verificar se há hash_pdf na tabela lotes_avaliacao sem laudo
    console.log('4️⃣  Verificando lotes com hash_pdf mas sem laudo válido...');
    const hashWithoutLaudo = await query(`
      SELECT la.id,  la.hash_pdf, la.emitido_em, l.status AS laudo_status
      FROM lotes_avaliacao la
      LEFT JOIN laudos l ON l.lote_id = la.id AND l.status != 'rascunho'
      WHERE la.hash_pdf IS NOT NULL
        AND l.id IS NULL
      LIMIT 10
    `);

    console.log(
      `   Encontrados: ${hashWithoutLaudo.rowCount} lotes com hash mas sem laudo`
    );
    if (hashWithoutLaudo.rowCount > 0) {
      console.table(hashWithoutLaudo.rows);
    }
    console.log('');

    // 5. Verificar trigger de recálculo (migration 150)
    console.log(
      '5️⃣  Verificando função de recálculo (deve estar sem fila_emissao)...'
    );
    const funcRecalc = await query(`
      SELECT pg_get_functiondef(oid) AS definition
      FROM pg_proc
      WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update'
    `);

    if (funcRecalc.rowCount > 0) {
      const def = funcRecalc.rows[0].definition;
      if (def.includes('fila_emissao')) {
        console.log(
          '   ❌ FUNÇÃO AINDA INSERE EM fila_emissao (migration 150 NÃO aplicada)'
        );
      } else {
        console.log(
          '   ✅ Função não insere em fila_emissao (migration 150 aplicada)'
        );
      }
    }
    console.log('');

    // 6. Resumo
    console.log('='.repeat(60));
    console.log('RESUMO DO DIAGNÓSTICO:');
    console.log('='.repeat(60));

    const hasTrigger = triggerCheck.rowCount > 0;
    const hasOrphans = orphanLaudos.rowCount > 0;
    const hasHashWithoutLaudo = hashWithoutLaudo.rowCount > 0;

    if (hasTrigger || hasOrphans || hasHashWithoutLaudo) {
      console.log('');
      console.log('⚠️  PROBLEMAS IDENTIFICADOS:');
      if (hasTrigger) {
        console.log(
          '   - Trigger automático AINDA EXISTE (migration 151 não aplicada)'
        );
      }
      if (hasOrphans) {
        console.log(`   - ${orphanLaudos.rowCount} laudos órfãos em rascunho`);
      }
      if (hasHashWithoutLaudo) {
        console.log(
          `   - ${hashWithoutLaudo.rowCount} lotes com hash sem laudo válido`
        );
      }
      console.log('');
      console.log('✅ SOLUÇÃO:');
      console.log('   Executar migrations em ordem:');
      console.log('   1. pnpm tsx scripts/apply-migration-150.ts');
      console.log('   2. pnpm tsx scripts/apply-migration-151.ts');
      console.log('   3. pnpm tsx scripts/apply-migration-152.ts');
      console.log('   4. pnpm tsx scripts/apply-migration-153.ts');
    } else {
      console.log('');
      console.log('✅ Todas migrations 15x foram aplicadas corretamente!');
    }
    console.log('');
  } catch (error: any) {
    console.error('');
    console.error('❌ Erro ao executar diagnóstico:', error.message);
    process.exit(1);
  }
}

diagnoseAutoEmission().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
