require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');
(async () => {
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  try {
    await client.connect();

    // Criar clinica mínima e contratante mínima para vínculo
    await client.query(
      "INSERT INTO clinicas (nome, cnpj, email, ativa) VALUES ('Clinica Teste Gestor', '00000000000000', 'clinica-gestor@test', true) ON CONFLICT DO NOTHING"
    );
    const clinicaRow = (
      await client.query(
        "SELECT id FROM clinicas WHERE nome='Clinica Teste Gestor' LIMIT 1"
      )
    ).rows[0];
    const clinicaId = clinicaRow ? clinicaRow.id : null;

    await client.query(
      "INSERT INTO tomadores (tipo, nome, cnpj, email, ativa) VALUES ('entidade', 'Contratante Teste Gestor', '00000000000000', 'contratante-gestor@test', true) ON CONFLICT DO NOTHING"
    );
    const contratanteRow = (
      await client.query(
        "SELECT id FROM tomadores WHERE nome='Contratante Teste Gestor' LIMIT 1"
      )
    ).rows[0];
    const contratanteId = contratanteRow ? contratanteRow.id : null;

    // Inserir gestor RH
    await client.query(
      `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, clinica_id, ativo, criado_em, atualizado_em) VALUES ('00000000001', 'Gestor RH Teste', 'gestor.rh@test', 'hash', 'rh', $1, true, NOW(), NOW()) ON CONFLICT (cpf) DO NOTHING`,
      [clinicaId]
    );

    // Inserir gestor Entidade (usa coluna entidade_id presente no schema)
    await client.query(
      `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, entidade_id, ativo, criado_em, atualizado_em) VALUES ('00000000002', 'Gestor Entidade Teste', 'gestor.entidade@test', 'hash', 'gestor', $1, true, NOW(), NOW()) ON CONFLICT (cpf) DO NOTHING`,
      [contratanteId]
    );

    console.log('Sample gestores inserted or already present');

    await client.end();
  } catch (err) {
    console.error('Error inserting sample gestores:', err.message || err);
    process.exit(1);
  }
})();
