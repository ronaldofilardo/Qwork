const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

(async () => {
  const client = new Client({
    connectionString:
      process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    // Dados do gestor RH via argumentos
    const cpf = process.argv[2];
    const nome = process.argv[3] || 'Gestor RH';
    const email = process.argv[4] || null;
    const clinicaId = parseInt(process.argv[5], 10);

    if (!cpf || cpf.length !== 11 || !clinicaId) {
      console.error(
        'Uso: node createGestorRH.cjs <CPF> <Nome> <Email> <ClinicaID>'
      );
      process.exit(1);
    }

    // Senha padrão: '123456'
    const defaultPassword = '123456';
    const hash = await bcrypt.hash(defaultPassword, 10);

    console.log('Criando/atualizando gestor RH:', cpf, nome);

    // Verificar se o usuário já existe
    const existingUser = await client.query(
      'SELECT id FROM funcionarios WHERE cpf = $1',
      [cpf]
    );

    if (existingUser.rows.length > 0) {
      // Atualizar usuário existente
      await client.query(
        `UPDATE funcionarios SET 
           nome = $1, 
           email = $2, 
           perfil = 'rh', 
           clinica_id = $3, 
           ativo = true, 
           senha_hash = $4, 
           atualizado_em = CURRENT_TIMESTAMP 
         WHERE cpf = $5`,
        [nome, email, clinicaId, hash, cpf]
      );
      console.log('Usuário existente atualizado');
    } else {
      // Inserir novo usuário
      await client.query(
        `INSERT INTO funcionarios (
          cpf, nome, email, perfil, clinica_id, ativo, 
          empresa_id, setor, funcao, nivel_cargo, senha_hash, 
          criado_em, atualizado_em
        ) VALUES ($1, $2, $3, 'rh', $4, true, NULL, 'RH', 'Gestor RH', 'gestao', $5, NOW(), NOW())`,
        [cpf, nome, email, clinicaId, hash]
      );
      console.log('Novo usuário inserido');
    }

    await client.query('COMMIT');
    console.log('Gestor RH criado/atualizado com sucesso');
    console.log('Senha padrão:', defaultPassword);
  } catch (err) {
    console.error('Erro:', err);
    try {
      await client.query('ROLLBACK');
    } catch (_) {}
    process.exit(1);
  } finally {
    await client.end();
  }
})();
