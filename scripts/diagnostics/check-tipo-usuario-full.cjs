'use strict';
const { Client } = require('pg');

(async () => {
  const c = new Client({
    connectionString: (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db'),
  });
  await c.connect();

  // tipo_usuario como VARCHAR?
  const col = await c.query(
    "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name='usuarios' AND column_name='tipo_usuario'"
  );
  console.log('tipo_usuario column def:', col.rows[0]);

  // Valores distintos em uso
  const vals = await c.query(
    'SELECT DISTINCT tipo_usuario FROM usuarios ORDER BY tipo_usuario'
  );
  console.log(
    'tipo_usuario values in use:',
    vals.rows.map((r) => r.tipo_usuario)
  );

  // Verificar hierarquia_comercial para usuario_id=55 (comercial)
  const hc = await c
    .query('SELECT * FROM hierarquia_comercial WHERE vendedor_id = 55')
    .catch(() => ({ rows: [] }));
  console.log('hierarquia_comercial for id=55:', hc.rows);

  // Verificar vendedores_perfil para suporte (54) e comercial (55)
  const vp = await c
    .query('SELECT * FROM vendedores_perfil WHERE usuario_id IN (54, 55)')
    .catch(() => ({ rows: [] }));
  console.log('vendedores_perfil for 54,55:', vp.rows);

  // Verificar aceites_termos_usuario
  const at = await c
    .query('SELECT * FROM aceites_termos_usuario WHERE usuario_id IN (54, 55)')
    .catch(() => ({ rows: [] }));
  console.log('aceites_termos for 54,55:', at.rows);

  // Columns of hierarquia_comercial
  const hcCols = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='hierarquia_comercial' ORDER BY ordinal_position"
  );
  console.log(
    'hierarquia_comercial cols:',
    hcCols.rows.map((r) => r.column_name)
  );

  // Columns of vendedores_perfil
  const vpCols = await c.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='vendedores_perfil' ORDER BY ordinal_position"
  );
  console.log(
    'vendedores_perfil cols:',
    vpCols.rows.map((r) => r.column_name)
  );

  await c.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
