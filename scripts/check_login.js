import pg from 'pg';

const { Client } = pg;

const CPF = process.argv[2] || '04703084945';
const tomador_ID = process.argv[3] || '20';

const client = new Client({
  connectionString:
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

(async () => {
  try {
    await client.connect();
    console.log('Connected to DB');

    const tomadorRes = await client.query(
      'SELECT id, cnpj, responsavel_cpf, responsavel_nome, ativa, pagamento_confirmado, status FROM tomadors WHERE id = $1',
      [tomador_ID]
    );
    console.log('tomador:', tomadorRes.rows[0]);

    const cs = await client.query(
      'SELECT * FROM entidades_senhas WHERE cpf = $1',
      [CPF]
    );
    console.log('entidades_senhas rows:', cs.rows);

    const func = await client.query(
      'SELECT * FROM funcionarios WHERE cpf = $1',
      [CPF]
    );
    console.log('funcionarios rows:', func.rows);

    // Verificar existência da coluna `cancelado` e usar condição somente se existir
    let recibo;
    try {
      const cols = await client.query(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'recibos' AND column_name = 'cancelado'"
      );
      if (cols.rows.length > 0) {
        recibo = await client.query(
          'SELECT id FROM recibos WHERE tomador_id = $1 AND cancelado = false LIMIT 5',
          [tomador_ID]
        );
      } else {
        recibo = await client.query(
          'SELECT id FROM recibos WHERE tomador_id = $1 LIMIT 5',
          [tomador_ID]
        );
      }
    } catch (e) {
      console.warn(
        'Aviso: falha ao checar coluna cancelado em recibos - usando fallback',
        e.message
      );
      recibo = await client.query(
        'SELECT id FROM recibos WHERE tomador_id = $1 LIMIT 5',
        [tomador_ID]
      );
    }

    console.log(
      'recibos for tomador (count):',
      recibo.rowCount,
      recibo.rows.map((r) => r.id)
    );

    await client.end();
  } catch (err) {
    console.error('Error', err);
    try {
      await client.end();
    } catch {}
    process.exit(1);
  }
})();
