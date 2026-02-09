const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function finalMigration() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== MIGRAÇÃO FINAL ===');

    // 1. Dropar views dependentes
    console.log('1. Dropando views dependentes...');
    await client.query(`DROP VIEW IF EXISTS vw_recibos_completos;`);

    // 2. Migrar coluna planos.tipo
    console.log('2. Migrando coluna planos.tipo para usar enum...');
    await client.query(`
      ALTER TABLE planos
      ALTER COLUMN tipo TYPE tipo_plano USING tipo::tipo_plano
    `);

    // 3. Remover enum duplicado
    console.log('3. Removendo enum tipo_plano_enum...');
    await client.query(`DROP TYPE tipo_plano_enum;`);

    // 4. Recriar views
    console.log('4. Recriando views...');
    await client.query(`
      CREATE OR REPLACE VIEW vw_recibos_completos AS
      SELECT
        r.id,
        r.numero_recibo,
        r.vigencia_inicio,
        r.vigencia_fim,
        r.numero_funcionarios_cobertos,
        r.valor_total_anual,
        r.valor_por_funcionario,
        r.forma_pagamento,
        r.numero_parcelas,
        r.descricao_pagamento,
        r.criado_em,
        c.id AS contrato_id,
        c.conteudo_gerado AS contrato_conteudo,
        c.data_aceite AS contrato_data_aceite,
        ct.nome AS contratante_nome,
        ct.cnpj AS contratante_cnpj,
        ct.email AS contratante_email,
        ct.tipo AS contratante_tipo,
        p.nome AS plano_nome,
        p.tipo AS plano_tipo,
        pg.metodo AS pagamento_metodo,
        pg.data_pagamento,
        pg.status AS pagamento_status
      FROM recibos r
      JOIN contratos c ON r.contrato_id = c.id
      JOIN tomadores ct ON r.contratante_id = ct.id
      JOIN pagamentos pg ON r.pagamento_id = pg.id
      JOIN planos p ON c.plano_id = p.id
      WHERE r.ativo = true
      ORDER BY r.criado_em DESC;
    `);

    console.log('=== MIGRAÇÃO FINAL CONCLUÍDA ===');

    await client.end();
  } catch (error) {
    console.error('Erro durante migração final:', error.message);
    await client.end();
  }
}

finalMigration();
