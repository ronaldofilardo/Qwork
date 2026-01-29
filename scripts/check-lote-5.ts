import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    console.log('\n=== LOTE 5 ===');
    const lote = await client.query(
      'SELECT id, status, processamento_em FROM lotes_avaliacao WHERE id = 5'
    );
    console.log('Lote 5:', JSON.stringify(lote.rows[0], null, 2));

    console.log('\n=== AVALIAÇÕES LOTE 5 ===');
    const avaliacoes = await client.query(
      'SELECT id, status, funcionario_cpf FROM avaliacoes WHERE lote_id = 5'
    );
    console.log('Avaliações:', JSON.stringify(avaliacoes.rows, null, 2));

    console.log('\n=== LAUDO LOTE 5 ===');
    const laudo = await client.query(
      'SELECT id, lote_id, status, emissor_cpf, emitido_em, enviado_em FROM laudos WHERE lote_id = 5'
    );
    console.log('Laudo:', JSON.stringify(laudo.rows, null, 2));

    console.log('\n=== FILA EMISSÃO ===');
    const fila = await client.query(
      'SELECT * FROM fila_emissao WHERE lote_id = 5'
    );
    console.log('Fila emissão:', JSON.stringify(fila.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error('Erro:', err);
    await client.end();
    process.exit(1);
  }
})();
