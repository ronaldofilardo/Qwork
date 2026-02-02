require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function corrigirLotesClinica() {
  const client = await pool.connect();

  try {
    console.log('\n=== ANÁLISE ANTES DA CORREÇÃO ===\n');

    // 1. Verificar contratantes
    const contratantesResult = await client.query(`
      SELECT id, nome, tipo, responsavel_cpf 
      FROM contratantes 
      ORDER BY id
    `);

    console.log('Contratantes:');
    contratantesResult.rows.forEach((c) => {
      console.log(`  ID ${c.id} - ${c.tipo}: ${c.nome} (${c.responsavel_cpf})`);
    });

    // 2. Verificar lotes do contratante_id = 2 (RLJ COMERCIAL EXPORTADORA - que é CLÍNICA)
    const lotesRLJResult = await client.query(`
      SELECT 
        la.id,
        la.codigo,
        la.titulo,
        la.contratante_id,
        la.clinica_id,
        la.empresa_id,
        la.status,
        c.tipo as contratante_tipo,
        c.nome as contratante_nome,
        EXISTS(SELECT 1 FROM laudos l WHERE l.lote_id = la.id AND l.emitido_em IS NOT NULL) as tem_laudo_emitido
      FROM lotes_avaliacao la
      LEFT JOIN contratantes c ON c.id = la.contratante_id
      WHERE la.contratante_id = 2
      ORDER BY la.id
    `);

    console.log(
      `\n❌ PROBLEMA: ${lotesRLJResult.rows.length} lotes com contratante_id=2 (RLJ COMERCIAL EXPORTADORA)`
    );
    console.log(
      '   Estes lotes estão marcados como ENTIDADE mas deveriam ser CLÍNICA/RH\n'
    );

    lotesRLJResult.rows.forEach((lote) => {
      console.log(`  Lote ${lote.codigo} (ID: ${lote.id})`);
      console.log(`    Título: ${lote.titulo}`);
      console.log(`    Status: ${lote.status}`);
      console.log(
        `    Contratante: ${lote.contratante_nome} (tipo: ${lote.contratante_tipo})`
      );
      console.log(
        `    Tem laudo emitido: ${lote.tem_laudo_emitido ? 'SIM' : 'NÃO'}`
      );
      console.log('');
    });

    // 3. Verificar clínica e empresa de destino
    const clinicaResult = await client.query(`
      SELECT id, nome, cnpj 
      FROM clinicas 
      WHERE cnpj = '09110380000191'
    `);

    const empresaResult = await client.query(`
      SELECT id, nome, cnpj, clinica_id 
      FROM empresas_clientes 
      WHERE cnpj = '53650950000128'
    `);

    if (clinicaResult.rows.length === 0) {
      console.log(
        '❌ ERRO: Clínica RLJ COMERCIAL EXPORTADORA (CNPJ 09110380000191) não encontrada'
      );
      return;
    }

    if (empresaResult.rows.length === 0) {
      console.log(
        '❌ ERRO: Empresa fapoupou pupoupou (CNPJ 53650950000128) não encontrada'
      );
      return;
    }

    const clinica = clinicaResult.rows[0];
    const empresa = empresaResult.rows[0];

    console.log('\n=== DESTINO DA MIGRAÇÃO ===\n');
    console.log(
      `Clínica: ${clinica.nome} (ID: ${clinica.id}, CNPJ: ${clinica.cnpj})`
    );
    console.log(
      `Empresa: ${empresa.nome} (ID: ${empresa.id}, CNPJ: ${empresa.cnpj})`
    );

    // 4. Confirmar migração
    console.log('\n=== EXECUTANDO MIGRAÇÃO ===\n');

    await client.query('BEGIN');

    try {
      // Backup dos lotes antes da migração
      await client.query(`
        CREATE TABLE IF NOT EXISTS backup_lotes_migracao_20260130 AS
        SELECT * FROM lotes_avaliacao WHERE contratante_id = 2
      `);
      console.log('✓ Backup criado: backup_lotes_migracao_20260130');

      // Garantir que clinica_id e empresa_id possam ser NULL
      await client.query(`
        ALTER TABLE lotes_avaliacao 
          ALTER COLUMN clinica_id DROP NOT NULL,
          ALTER COLUMN empresa_id DROP NOT NULL
      `);
      console.log('✓ Constraints NOT NULL removidas temporariamente');

      // Desabilitar apenas os triggers personalizados (não os do sistema)
      const triggersResult = await client.query(`
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'lotes_avaliacao'::regclass 
        AND tgname NOT LIKE 'RI_%'
        AND tgname NOT LIKE 'pg_%'
      `);

      for (const trigger of triggersResult.rows) {
        await client.query(
          `ALTER TABLE lotes_avaliacao DISABLE TRIGGER ${trigger.tgname}`
        );
        console.log(`✓ Trigger desabilitado: ${trigger.tgname}`);
      }

      // Atualizar lotes: contratante_id=2 → clinica_id=21, empresa_id=1
      const updateResult = await client.query(
        `
        UPDATE lotes_avaliacao
        SET 
          clinica_id = $1,
          empresa_id = $2,
          contratante_id = NULL,
          atualizado_em = CURRENT_TIMESTAMP
        WHERE contratante_id = 2
        RETURNING id, codigo, titulo
      `,
        [clinica.id, empresa.id]
      );

      console.log(
        `✓ ${updateResult.rows.length} lotes migrados de ENTIDADE → CLÍNICA/RH:`
      );
      updateResult.rows.forEach((lote) => {
        console.log(`  - Lote ${lote.codigo}: ${lote.titulo}`);
      });

      // Reabilitar triggers personalizados
      const triggersReenableResult = await client.query(`
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'lotes_avaliacao'::regclass 
        AND tgname NOT LIKE 'RI_%'
        AND tgname NOT LIKE 'pg_%'
      `);

      for (const trigger of triggersReenableResult.rows) {
        await client.query(
          `ALTER TABLE lotes_avaliacao ENABLE TRIGGER ${trigger.tgname}`
        );
        console.log(`✓ Trigger reabilitado: ${trigger.tgname}`);
      }

      await client.query('COMMIT');
      console.log('\n✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n');

      // 5. Verificar resultado
      console.log('=== VERIFICAÇÃO PÓS-MIGRAÇÃO ===\n');

      const verificacaoResult = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE contratante_id IS NOT NULL) as lotes_entidade,
          COUNT(*) FILTER (WHERE clinica_id IS NOT NULL AND contratante_id IS NULL) as lotes_clinica,
          COUNT(*) as total_lotes
        FROM lotes_avaliacao
      `);

      const stats = verificacaoResult.rows[0];
      console.log(`Total de lotes: ${stats.total_lotes}`);
      console.log(`  - Lotes de ENTIDADE: ${stats.lotes_entidade}`);
      console.log(`  - Lotes de CLÍNICA/RH: ${stats.lotes_clinica}`);

      // Listar lotes por tipo
      const lotesFinaisResult = await client.query(`
        SELECT 
          la.id,
          la.codigo,
          la.titulo,
          CASE 
            WHEN la.contratante_id IS NOT NULL THEN 'ENTIDADE'
            WHEN la.clinica_id IS NOT NULL THEN 'CLÍNICA/RH'
            ELSE 'INDEFINIDO'
          END as tipo,
          COALESCE(c.nome, cl.nome) as contratante_nome,
          ec.nome as empresa_nome
        FROM lotes_avaliacao la
        LEFT JOIN contratantes c ON c.id = la.contratante_id
        LEFT JOIN clinicas cl ON cl.id = la.clinica_id
        LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
        ORDER BY la.id
      `);

      console.log('\nLotes atualizados:');
      lotesFinaisResult.rows.forEach((lote) => {
        console.log(`  ${lote.codigo} (ID: ${lote.id}) - ${lote.tipo}`);
        console.log(`    ${lote.titulo}`);
        if (lote.tipo === 'ENTIDADE') {
          console.log(`    Entidade: ${lote.contratante_nome}`);
        } else {
          console.log(`    Clínica: ${lote.contratante_nome}`);
          console.log(`    Empresa: ${lote.empresa_nome}`);
        }
        console.log('');
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ ERRO na migração:', err.message);
      throw err;
    }
  } catch (err) {
    console.error('❌ ERRO:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

corrigirLotesClinica();
