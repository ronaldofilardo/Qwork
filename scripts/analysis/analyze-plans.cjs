const { Client } = require('pg');
require('dotenv').config({ path: '.env.development' });

async function analyzePlansStructure() {
  const client = new Client(process.env.LOCAL_DATABASE_URL);
  try {
    await client.connect();

    console.log('=== ANÁLISE DETALHADA DOS PLANOS ===');
    const planos = await client.query(`
      SELECT id, nome, tipo, valor_base, valor_por_funcionario,
             qtd_min_funcionarios, qtd_max_funcionarios
      FROM planos
      ORDER BY id
    `);

    planos.rows.forEach((p) => {
      console.log(`ID ${p.id}: ${p.nome}`);
      console.log(`  Tipo: ${p.tipo}`);
      console.log(`  Valor base: R$ ${p.valor_base}`);
      console.log(
        `  Valor/funcionário: R$ ${p.valor_por_funcionario || 'N/A'}`
      );
      console.log(
        `  Mín/Máx funcionários: ${p.qtd_min_funcionarios || 0} - ${p.qtd_max_funcionarios || 'ilimitado'}`
      );
      console.log('');
    });

    console.log('=== CAMPOS RELACIONADOS NAS TABELAS ===');

    // Verificar estrutura da tabela contratantes
    const contratantesCols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'contratantes'
      AND column_name LIKE '%plano%'
      ORDER BY column_name
    `);

    console.log('Tabela CONTRATANTES - campos plano:');
    contratantesCols.rows.forEach((col) => {
      console.log(
        `  ${col.column_name}: ${col.data_type} (${col.is_nullable})`
      );
    });

    // Verificar se há dados existentes
    console.log('\n=== DADOS EXISTENTES ===');
    const contratantesComPlano = await client.query(`
      SELECT COUNT(*) as total_contratantes,
             COUNT(plano_id) as com_plano_id,
             COUNT(plano_tipo) as com_plano_tipo
      FROM contratantes
    `);

    console.log('Contratantes:', contratantesComPlano.rows[0]);

    await client.end();
  } catch (error) {
    console.error('Erro:', error.message);
    await client.end();
  }
}

analyzePlansStructure();
