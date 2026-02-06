import { Pool } from 'pg';

const devPool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

const prodPool = new Pool({
  connectionString:
    'postgresql://neondb_owner:REDACTED@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function createContratantesView() {
  const sql = `-- ================================================================
-- CRIAR VIEW contratantes PARA COMPATIBILIDADE
-- Data: ${new Date().toISOString()}
-- ================================================================
-- OBJETIVO: Manter compatibilidade com código legacy que usa
-- tabela "contratantes" - agora é uma VIEW que une entidades e clínicas
-- ================================================================

BEGIN;

-- Drop view antiga se existir
DROP VIEW IF EXISTS contratantes CASCADE;

-- Criar VIEW que une entidades e clínicas
CREATE OR REPLACE VIEW contratantes AS
SELECT 
  id,
  'entidade' as tipo,
  nome,
  cnpj,
  inscricao_estadual,
  email,
  telefone,
  endereco,
  cidade,
  estado,
  cep,
  responsavel_nome,
  responsavel_cpf,
  responsavel_cargo,
  responsavel_email,
  responsavel_celular,
  cartao_cnpj_path,
  contrato_social_path,
  doc_identificacao_path,
  status,
  motivo_rejeicao,
  observacoes_reanalise,
  ativa,
  criado_em,
  atualizado_em,
  aprovado_em,
  aprovado_por_cpf,
  pagamento_confirmado,
  numero_funcionarios_estimado,
  plano_id
FROM entidades
UNION ALL
SELECT 
  id,
  'clinica' as tipo,
  nome,
  cnpj::varchar as cnpj,
  inscricao_estadual,
  email::varchar as email,
  telefone::varchar as telefone,
  endereco,
  cidade::varchar as cidade,
  estado::varchar as estado,
  NULL as cep,
  NULL as responsavel_nome,
  NULL as responsavel_cpf,
  NULL as responsavel_cargo,
  NULL as responsavel_email,
  NULL as responsavel_celular,
  NULL as cartao_cnpj_path,
  NULL as contrato_social_path,
  NULL as doc_identificacao_path,
  NULL::status_aprovacao_enum as status,
  NULL as motivo_rejeicao,
  NULL as observacoes_reanalise,
  ativa,
  criado_em,
  atualizado_em,
  NULL as aprovado_em,
  NULL as aprovado_por_cpf,
  NULL as pagamento_confirmado,
  NULL as numero_funcionarios_estimado,
  NULL as plano_id
FROM clinicas;

COMMENT ON VIEW contratantes IS 'VIEW de compatibilidade: Une entidades e clínicas (ambas são contratantes independentes). Use tabelas específicas para novas queries.';

COMMIT;

-- ================================================================
-- VALIDAÇÃO
-- ================================================================
SELECT 
  tipo,
  COUNT(*) as total
FROM contratantes
GROUP BY tipo
ORDER BY tipo;
`;

  return sql;
}

async function executeMigration(sql: string, pool: Pool, env: string) {
  console.log(`🚀 Criando VIEW contratantes no ${env}...\n`);

  try {
    await pool.query(sql);
    console.log(`✅ VIEW criada no ${env}\n`);
  } catch (error: any) {
    console.error(`❌ Erro no ${env}:`, error.message);
    throw error;
  }
}

async function validateView(pool: Pool, env: string) {
  console.log(`🔍 Validando VIEW no ${env}...\n`);

  const result = await pool.query(`
    SELECT 
      tipo,
      COUNT(*) as total
    FROM contratantes
    GROUP BY tipo
    ORDER BY tipo;
  `);

  console.log(`   Registros na VIEW contratantes:`);
  result.rows.forEach((row) => {
    console.log(`      ${row.tipo}: ${row.total}`);
  });

  console.log(`\n✅ VIEW operacional no ${env}\n`);
}

async function main() {
  try {
    console.log('='.repeat(70));
    console.log('CRIAÇÃO DE VIEW contratantes PARA COMPATIBILIDADE');
    console.log('='.repeat(70) + '\n');

    const sql = await createContratantesView();

    // Salvar SQL
    const fs = await import('fs/promises');
    await fs.writeFile('sql-files/create-view-contratantes-compat.sql', sql);
    console.log(
      '📄 SQL salvo em: sql-files/create-view-contratantes-compat.sql\n'
    );

    // Executar no DEV
    await executeMigration(sql, devPool, 'DEV');
    await validateView(devPool, 'DEV');

    // Executar no PROD
    await executeMigration(sql, prodPool, 'PROD');
    await validateView(prodPool, 'PROD');

    console.log('='.repeat(70));
    console.log('✅ VIEW contratantes CRIADA - Código Legacy Compatível');
    console.log('='.repeat(70));
    console.log('\n💡 VIEW criada para compatibilidade com código existente');
    console.log('   Novas queries devem usar entidades/clinicas diretamente\n');
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
