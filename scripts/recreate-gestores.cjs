require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');
(async () => {
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  try {
    await client.connect();
    const sql = `DROP VIEW IF EXISTS gestores CASCADE;
CREATE VIEW gestores AS
SELECT id, cpf, nome, email, tipo_usuario AS usuario_tipo,
  CASE WHEN tipo_usuario::text = 'rh' THEN 'Gestor RH/Clínica' WHEN tipo_usuario::text IN ('gestor','gestor') THEN 'Gestor Entidade' ELSE 'Outro' END AS tipo_gestor_descricao,
  clinica_id, entidade_id, entidade_id AS contratante_id, ativo, criado_em, atualizado_em
FROM usuarios
WHERE tipo_usuario::text IN ('rh','gestor','gestor');`;
    await client.query(sql);
    console.log('View gestores recriada');
    await client.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
