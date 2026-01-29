import { config } from 'dotenv';
config({ path: '.env.local' });

import { Client } from 'pg';

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();

    console.log('\n=== FUNÇÃO upsert_laudo ===');
    const r1 = await client.query(
      `SELECT pg_get_functiondef(oid) as def FROM pg_proc WHERE proname = 'upsert_laudo'`
    );
    console.log(r1.rows[0]?.def || 'NÃO ENCONTRADA');

    console.log('\n\n=== LAUDOS COM EMISSOR PLACEHOLDER ===');
    const r2 = await client.query(
      `SELECT id, lote_id, status, emissor_cpf, emitido_em FROM laudos WHERE emissor_cpf = '00000000000' ORDER BY id`
    );
    console.log(`Total: ${r2.rows.length} laudos`);
    r2.rows.forEach((l) => {
      console.log(
        `  Laudo ${l.id} (lote ${l.lote_id}): status=${l.status}, emitido=${l.emitido_em ? 'SIM' : 'NÃO'}`
      );
    });

    console.log('\n\n=== EMISSORES ATIVOS NO SISTEMA ===');
    const r3 = await client.query(
      `SELECT cpf, nome, perfil, ativo FROM funcionarios WHERE perfil = 'emissor' ORDER BY ativo DESC, cpf`
    );
    console.log(`Total: ${r3.rows.length} emissores`);
    r3.rows.forEach((e) => {
      console.log(`  ${e.cpf} - ${e.nome} (ativo: ${e.ativo})`);
    });

    await client.end();
  } catch (err) {
    console.error('Erro:', err);
    await client.end();
    process.exit(1);
  }
})();
