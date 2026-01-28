import pg from 'pg';
const client = new pg.Client({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});
(async () => {
  await client.connect();
  const hash = '$2a$10$3wtDQ7U.gB4LAmNkBCnNVuITtJnnaRo3the5eE8H7r/y1yHIraaxO';
  await client.query(
    'UPDATE contratantes_senhas SET senha_hash = $1 WHERE contratante_id = $2 AND cpf = $3',
    [hash, 2, '04703084945']
  );
  await client.query('UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2', [
    hash,
    '04703084945',
  ]);
  console.log('Hash atualizado');
  await client.end();
})();
