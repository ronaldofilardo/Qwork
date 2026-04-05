#!/usr/bin/env node

/**
 * Aplica Migration 1004 em PRODUÇÃO
 *
 * Atualiza fn_reservar_id_laudo_on_lote_insert para usar status='rascunho'
 *
 * Uso:
 *   node scripts/apply-migration-1004-prod.cjs "postgresql://..."
 */

const { Client } = require('pg');

async function applyMigration1004() {
  const dbUrl = process.argv[2] || process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL não fornecido\n');
    console.error('Uso:');
    console.error(
      '  node scripts/apply-migration-1004-prod.cjs "postgresql://..."'
    );
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });

  console.log('\n' + '='.repeat(80));
  console.log('🚀 APLICANDO MIGRATION 1004 EM PRODUÇÃO');
  console.log('='.repeat(80));
  console.log(
    '\n⚠️  ATENÇÃO: Esta operação irá alterar a função do trigger em produção!'
  );
  console.log('Aguarde 3 segundos antes de prosseguir...\n');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  try {
    await client.connect();
    console.log('✓ Conectado ao banco de dados\n');

    // Iniciar transação
    await client.query('BEGIN');
    console.log('✓ Transação iniciada\n');

    // Aplicar migration
    console.log(
      '📝 Criando/Atualizando função fn_reservar_id_laudo_on_lote_insert...'
    );

    const migrationSQL = `
      CREATE OR REPLACE FUNCTION fn_reservar_id_laudo_on_lote_insert()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Reservar o ID do laudo (id = lote_id) em status 'rascunho'
        -- Status 'rascunho' permite criar laudo sem hash_pdf/emissor_cpf/emitido_em
        -- Isso evita disparar a trigger de validação fn_validar_laudo_emitido
        INSERT INTO laudos (id, lote_id, status)
        VALUES (NEW.id, NEW.id, 'rascunho')
        ON CONFLICT (id) DO NOTHING;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await client.query(migrationSQL);
    console.log('✅ Função criada/atualizada com sucesso\n');

    // Adicionar comentário
    console.log('📝 Adicionando comentário...');
    const commentSQL = `
      COMMENT ON FUNCTION fn_reservar_id_laudo_on_lote_insert() IS 
        'Reserva ID do laudo (igual ao lote) em status rascunho ao criar lote. Status rascunho permite criar sem hash_pdf, evitando erro de validação.'
    `;

    await client.query(commentSQL);
    console.log('✅ Comentário adicionado\n');

    // Commit
    await client.query('COMMIT');
    console.log('✅ Transação commitada com sucesso!\n');

    // Verificar se foi aplicada corretamente
    console.log('🔍 Verificando função atualizada...\n');

    const verification = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc
      WHERE proname = 'fn_reservar_id_laudo_on_lote_insert'
    `);

    if (verification.rows.length > 0) {
      const def = verification.rows[0].definition;
      const hasRascunho = def.includes("'rascunho'");

      if (hasRascunho) {
        console.log("✅ SUCESSO: Função contém status='rascunho'");
        console.log('✅ Migration 1004 aplicada com sucesso!\n');

        // Mostrar trecho relevante
        const lines = def.split('\n');
        const insertLine = lines.findIndex((l) =>
          l.toLowerCase().includes('insert into laudos')
        );
        if (insertLine !== -1) {
          console.log('📄 Trecho da INSERT:');
          for (
            let i = insertLine;
            i < Math.min(insertLine + 5, lines.length);
            i++
          ) {
            console.log(`   ${lines[i]}`);
          }
        }
      } else {
        console.log("⚠️  ATENÇÃO: Função NÃO contém status='rascunho'");
        console.log('Verifique se a migration foi aplicada corretamente.');
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 MIGRATION 1004 APLICADA COM SUCESSO EM PRODUÇÃO');
    console.log('='.repeat(80));
    console.log('\n📊 PRÓXIMOS PASSOS:');
    console.log('1. Testar criação de lote em PROD');
    console.log("2. Verificar que laudo é criado com status='rascunho'");
    console.log('3. Monitorar logs por 24h para garantir estabilidade\n');
  } catch (error) {
    // Rollback em caso de erro
    try {
      await client.query('ROLLBACK');
      console.log('\n❌ ROLLBACK executado devido ao erro\n');
    } catch (rollbackError) {
      console.log('\n⚠️  Não foi possível executar ROLLBACK\n');
    }

    console.error('❌ Erro ao aplicar migration:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration1004().catch((err) => {
  console.error('\n💥 Erro fatal:', err);
  process.exit(1);
});
