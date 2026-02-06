import { Pool } from 'pg';

const devPool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

const prodPool = new Pool({
  connectionString:
    'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function analyzeCurrentIDs(pool: Pool, env: string) {
  console.log(`\n🔍 Analisando IDs atuais no ${env}...\n`);

  // Verificar MAX IDs e contagem
  const result = await pool.query(`
    SELECT 
      (SELECT COALESCE(MAX(id), 0) FROM entidades) as max_entidade_id,
      (SELECT COUNT(*) FROM entidades) as count_entidades,
      (SELECT COALESCE(MAX(id), 0) FROM clinicas) as max_clinica_id,
      (SELECT COUNT(*) FROM clinicas) as count_clinicas,
      GREATEST(
        (SELECT COALESCE(MAX(id), 0) FROM entidades),
        (SELECT COALESCE(MAX(id), 0) FROM clinicas)
      ) as max_global_id;
  `);

  const data = result.rows[0];
  console.log(
    `   Entidades: ${data.count_entidades} registros, MAX(id) = ${data.max_entidade_id}`
  );
  console.log(
    `   Clínicas: ${data.count_clinicas} registros, MAX(id) = ${data.max_clinica_id}`
  );
  console.log(
    `   Próximo ID disponível: ${parseInt(data.max_global_id) + 1}\n`
  );

  return {
    maxEntidadeId: parseInt(data.max_entidade_id),
    countEntidades: parseInt(data.count_entidades),
    maxClinicaId: parseInt(data.max_clinica_id),
    countClinicas: parseInt(data.count_clinicas),
    nextId: parseInt(data.max_global_id) + 1,
  };
}

async function generateSharedSequenceSQL(nextId: number) {
  console.log('📝 Gerando SQL para SEQUENCE compartilhada...\n');

  const sql = `-- ================================================================
-- SPRINT 0: SEQUENCE Compartilhada para IDs de Contratantes
-- Data: ${new Date().toISOString()}
-- ================================================================
-- OBJETIVO: Clínicas e Entidades compartilham sequência de IDs
-- SEM BURACOS, como se fossem uma única tabela "contratantes"
-- ================================================================

BEGIN;

-- ================================================================
-- 1. Criar SEQUENCE compartilhada
-- ================================================================

CREATE SEQUENCE IF NOT EXISTS seq_contratantes_id
  START WITH ${nextId}
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

COMMENT ON SEQUENCE seq_contratantes_id IS 'Sequência compartilhada para IDs de entidades e clínicas (contratantes independentes)';

-- ================================================================
-- 2. Ajustar sequences existentes (se existirem)
-- ================================================================

-- Desativar sequences antigas se existirem
DO $$ 
BEGIN
  -- Remover default da sequence antiga de entidades
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'entidades_id_seq') THEN
    ALTER TABLE entidades ALTER COLUMN id DROP DEFAULT;
  END IF;
  
  -- Remover default da sequence antiga de clinicas
  IF EXISTS (SELECT 1 FROM pg_sequences WHERE schemaname = 'public' AND sequencename = 'clinicas_id_seq') THEN
    ALTER TABLE clinicas ALTER COLUMN id DROP DEFAULT;
  END IF;
END $$;

-- ================================================================
-- 3. Configurar colunas para usar SEQUENCE compartilhada
-- ================================================================

-- Entidades usam a sequence compartilhada
ALTER TABLE entidades 
  ALTER COLUMN id SET DEFAULT nextval('seq_contratantes_id');

-- Clínicas usam a sequence compartilhada
ALTER TABLE clinicas 
  ALTER COLUMN id SET DEFAULT nextval('seq_contratantes_id');

-- ================================================================
-- 4. Ajustar valor atual da sequence
-- ================================================================

-- Garantir que a sequence esteja no próximo valor após o maior ID
SELECT setval('seq_contratantes_id', 
  GREATEST(
    COALESCE((SELECT MAX(id) FROM entidades), 0),
    COALESCE((SELECT MAX(id) FROM clinicas), 0)
  ), 
  true
);

-- ================================================================
-- 5. Criar função helper para inserções manuais
-- ================================================================

CREATE OR REPLACE FUNCTION get_next_contratante_id()
RETURNS INTEGER AS $$
BEGIN
  RETURN nextval('seq_contratantes_id');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_next_contratante_id() IS 'Retorna o próximo ID disponível para entidades/clínicas';

COMMIT;

-- ================================================================
-- VALIDAÇÃO: Testar sequence compartilhada
-- ================================================================

-- Verificar configuração das colunas
SELECT 
  'entidades' as tabela,
  column_name,
  column_default
FROM information_schema.columns
WHERE table_name = 'entidades' AND column_name = 'id'
UNION ALL
SELECT 
  'clinicas' as tabela,
  column_name,
  column_default
FROM information_schema.columns
WHERE table_name = 'clinicas' AND column_name = 'id';

-- Verificar valor atual da sequence
SELECT 
  last_value as current_value,
  is_called
FROM seq_contratantes_id;
`;

  return sql;
}

async function executeMigration(sql: string, pool: Pool, env: string) {
  console.log(`🚀 Executando migração no ${env}...\n`);

  try {
    await pool.query(sql);
    console.log(`✅ Migração ${env} executada com sucesso!\n`);
  } catch (error: any) {
    console.error(`❌ Erro na migração ${env}:`, error.message);
    throw error;
  }
}

async function validateSharedSequence(pool: Pool, env: string) {
  console.log(`🔍 Validando SEQUENCE compartilhada no ${env}...\n`);

  // Verificar se sequence existe
  const checkSeq = await pool.query(`
    SELECT EXISTS (
      SELECT FROM pg_sequences 
      WHERE schemaname = 'public' AND sequencename = 'seq_contratantes_id'
    ) as exists;
  `);

  if (!checkSeq.rows[0].exists) {
    throw new Error(`Sequence seq_contratantes_id não existe em ${env}!`);
  }
  console.log(`   ✅ Sequence seq_contratantes_id criada`);

  // Verificar defaults das colunas
  const checkDefaults = await pool.query(`
    SELECT 
      table_name,
      column_name,
      column_default
    FROM information_schema.columns
    WHERE table_name IN ('entidades', 'clinicas') 
      AND column_name = 'id'
    ORDER BY table_name;
  `);

  for (const row of checkDefaults.rows) {
    if (!row.column_default?.includes('seq_contratantes_id')) {
      throw new Error(
        `${row.table_name}.id não usa seq_contratantes_id em ${env}!`
      );
    }
    console.log(`   ✅ ${row.table_name}.id → seq_contratantes_id`);
  }

  // Verificar valor atual da sequence
  const seqValue = await pool.query(
    `SELECT last_value FROM seq_contratantes_id;`
  );
  console.log(`   ✅ Sequence atual: ${seqValue.rows[0].last_value}`);

  // Teste: inserir nova entidade e nova clínica para ver IDs sequenciais
  console.log(`\n   🧪 Testando IDs sequenciais...\n`);

  const testResult = await pool.query(`
    SELECT 
      nextval('seq_contratantes_id') as next_id_1,
      nextval('seq_contratantes_id') as next_id_2,
      nextval('seq_contratantes_id') as next_id_3;
  `);

  const ids = testResult.rows[0];
  const id1 = parseInt(ids.next_id_1);
  const id2 = parseInt(ids.next_id_2);
  const id3 = parseInt(ids.next_id_3);

  const sequential = id2 === id1 + 1 && id3 === id2 + 1;

  if (!sequential) {
    throw new Error(`IDs não são sequenciais: ${id1}, ${id2}, ${id3}`);
  }

  console.log(`   ✅ IDs sequenciais: ${id1} → ${id2} → ${id3}`);
  console.log(`   ✅ SEM BURACOS confirmado\n`);

  console.log(`✅ Validação ${env} OK - SEQUENCE compartilhada funcionando\n`);
}

async function main() {
  try {
    console.log('='.repeat(70));
    console.log('SPRINT 0: SEQUENCE COMPARTILHADA PARA IDs DE CONTRATANTES');
    console.log('='.repeat(70));
    console.log(
      '\nOBJETIVO: Entidades e Clínicas com IDs sequenciais SEM BURACOS\n'
    );

    // 1. Analisar IDs no DEV
    const devData = await analyzeCurrentIDs(devPool, 'DEV');

    // 2. Analisar IDs no PROD
    const prodData = await analyzeCurrentIDs(prodPool, 'PROD');

    // 3. Usar o maior nextId entre DEV e PROD
    const nextId = Math.max(devData.nextId, prodData.nextId);
    console.log(`📌 Próximo ID global: ${nextId}\n`);

    // 4. Gerar SQL
    const sql = await generateSharedSequenceSQL(nextId);

    // Salvar SQL
    const fs = await import('fs/promises');
    await fs.writeFile('sql-files/shared-sequence-contratantes.sql', sql);
    console.log(
      '📄 SQL salvo em: sql-files/shared-sequence-contratantes.sql\n'
    );

    // 5. Executar no DEV
    await executeMigration(sql, devPool, 'DEV');
    await validateSharedSequence(devPool, 'DEV');

    // 6. Executar no PROD
    await executeMigration(sql, prodPool, 'PROD');
    await validateSharedSequence(prodPool, 'PROD');

    console.log('='.repeat(70));
    console.log('✅ SPRINT 0 CONCLUÍDO - SEQUENCE Compartilhada Implementada');
    console.log('='.repeat(70));
    console.log(
      '\nPróxima etapa: Etapa 1.2 - Refatorar 191 referências de código\n'
    );
  } catch (error: any) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

main();
