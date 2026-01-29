#!/usr/bin/env node

const { query } = require('../lib/db');

async function run() {
  try {
    console.log('\n1) Buscar item da fila id=16');
    const fila = await query('SELECT * FROM fila_emissao WHERE id = $1', [16]);
    console.log('fila rows:', fila.rows);

    console.log(
      '\n2) Verificar existência de unique constraint em lote_id (information_schema)'
    );
    const uniq = await query(
      `SELECT tc.constraint_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
       WHERE tc.table_name = 'fila_emissao' AND tc.constraint_type = 'UNIQUE'`
    );
    console.log('unique constraints:', uniq.rows);

    console.log('\n3) Verificar índices na tabela fila_emissao (pg_indexes)');
    const idx = await query(
      "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'fila_emissao'"
    );
    console.log('indexes:', idx.rows);

    console.log(
      '\n4) Audits relacionados à fila_emissao (tentando diferentes colunas)'
    );
    // Tentar versão english resource/action
    try {
      const audits = await query(
        "SELECT id, action, resource, resource_id, new_data, criado_em FROM audit_logs WHERE resource = 'fila_emissao' OR resource_id = $1 ORDER BY criado_em DESC LIMIT 20",
        [4]
      );
      console.log('audits (english):', audits.rows);
    } catch (e) {
      console.warn('audits (english) failed:', e.message);
    }

    // Tentar versão portugues acao/entidade
    try {
      const audits2 = await query(
        "SELECT id, acao, entidade, entidade_id, dados, criado_em FROM audit_logs WHERE entidade = 'fila_emissao' OR entidade_id = $1 ORDER BY criado_em DESC LIMIT 20",
        [4]
      );
      console.log('audits (portuguese):', audits2.rows);
    } catch (e) {
      console.warn('audits (portuguese) failed:', e.message);
    }

    // Mostrar se existe laudo para o lote 4
    const laudo = await query(
      'SELECT id, status FROM laudos WHERE lote_id = $1',
      [4]
    );
    console.log('\nLaudos para lote 4:', laudo.rows);

    process.exit(0);
  } catch (err) {
    console.error('Erro no inspect-fila:', err);
    process.exit(1);
  }
}

run();
