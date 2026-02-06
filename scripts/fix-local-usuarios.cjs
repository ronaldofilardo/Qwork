/* fix-local-usuarios.cjs
   Aplica coluna senha_hash (e outras) na DB apontada por LOCAL_DATABASE_URL
*/
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

(async () => {
  const conn = process.env.LOCAL_DATABASE_URL;
  if (!conn) {
    console.error('LOCAL_DATABASE_URL not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    console.log('Conectado em LOCAL_DATABASE_URL');
    await client.query(
      'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email character varying'
    );
    await client.query(
      'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash text'
    );
    await client.query(
      'ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS atualizado_em timestamp without time zone DEFAULT now()'
    );

    // Renomear coluna 'role' para 'tipo_usuario' somente se necessário
    const cols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='usuarios' AND column_name IN ('role','tipo_usuario')"
    );
    const hasRole = cols.rows.some((r) => r.column_name === 'role');
    const hasTipo = cols.rows.some((r) => r.column_name === 'tipo_usuario');
    if (hasRole && !hasTipo) {
      await client.query(
        'ALTER TABLE usuarios RENAME COLUMN role TO tipo_usuario'
      );
      console.log("Renomeada coluna 'role' para 'tipo_usuario'");
    }

    console.log('Colunas aplicadas/confirmadas em LOCAL_DATABASE_URL');
  } catch (e) {
    console.error('Erro:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
