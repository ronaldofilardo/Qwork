require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

(async () => {
  try {
    const cnpj = '28863755000139';
    const cpf = '17840664008';
    const senhaHash =
      '$2a$10$//mSTsd7DDS51mpKU3qvS.f6dzGKkP4.G6SfcJy.a5c3qO2HqMuym';

    // Procurar em entidades
    const entRes = await pool.query(
      'SELECT id, nome, cnpj, responsavel_cpf, tipo FROM entidades WHERE cnpj = $1',
      [cnpj]
    );

    if (entRes.rows.length > 0) {
      const row = entRes.rows[0];
      console.log('Encontrado em ENTIDADES:', {
        id: row.id,
        nome: row.nome,
        cnpj: row.cnpj,
        responsavel_cpf: row.responsavel_cpf,
        tipo: row.tipo,
      });

      // Atualizar entidades_senhas
      const updateSenhaRes = await pool.query(
        `INSERT INTO entidades_senhas (entidade_id, cpf, senha_hash, criado_em, atualizado_em)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (cpf) DO UPDATE
         SET senha_hash = $3, atualizado_em = CURRENT_TIMESTAMP
         RETURNING entidade_id, cpf`,
        [row.id, cpf, senhaHash]
      );

      console.log(
        '✅ Senha atualizada em entidades_senhas:',
        updateSenhaRes.rows[0]
      );

      // Atualizar também em usuarios para consistência
      const updateUsuarioRes = await pool.query(
        `UPDATE usuarios 
         SET senha_hash = $1, ativo = true, primeira_senha_alterada = false, atualizado_em = CURRENT_TIMESTAMP
         WHERE cpf = $2
         RETURNING cpf, ativo, tipo_usuario`,
        [senhaHash, cpf]
      );

      if (updateUsuarioRes.rows.length > 0) {
        console.log(
          '✅ Senha atualizada em usuarios:',
          updateUsuarioRes.rows[0]
        );
      } else {
        // Se não existir em usuarios, criar
        const insertUsuarioRes = await pool.query(
          `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, entidade_id, ativo, primeira_senha_alterada)
           VALUES ($1, $2, $3, $4, $5, $6, true, false)
           ON CONFLICT (cpf) DO UPDATE
           SET senha_hash = $4, ativo = true, atualizado_em = CURRENT_TIMESTAMP
           RETURNING cpf, tipo_usuario, ativo`,
          [
            cpf,
            row.responsavel_nome || row.nome,
            row.responsavel_email || row.email,
            senhaHash,
            'gestor',
            row.id,
          ]
        );
        console.log(
          '✅ Usuário criado/atualizado em usuarios:',
          insertUsuarioRes.rows[0]
        );
      }
    } else {
      // Procurar em clínicas
      const clinRes = await pool.query(
        'SELECT id, nome, cnpj, responsavel_cpf, tipo FROM clinicas WHERE cnpj = $1',
        [cnpj]
      );

      if (clinRes.rows.length > 0) {
        const row = clinRes.rows[0];
        console.log('Encontrado em CLÍNICAS:', {
          id: row.id,
          nome: row.nome,
          cnpj: row.cnpj,
          responsavel_cpf: row.responsavel_cpf,
          tipo: row.tipo,
        });

        // Atualizar clinicas_senhas
        const updateSenhaRes = await pool.query(
          `INSERT INTO clinicas_senhas (clinica_id, cpf, senha_hash, criado_em, atualizado_em)
           VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (cpf) DO UPDATE
           SET senha_hash = $3, atualizado_em = CURRENT_TIMESTAMP
           RETURNING clinica_id, cpf`,
          [row.id, cpf, senhaHash]
        );

        console.log(
          '✅ Senha atualizada em clinicas_senhas:',
          updateSenhaRes.rows[0]
        );

        // Atualizar também em usuarios
        const updateUsuarioRes = await pool.query(
          `UPDATE usuarios 
           SET senha_hash = $1, ativo = true, primeira_senha_alterada = false, atualizado_em = CURRENT_TIMESTAMP
           WHERE cpf = $2
           RETURNING cpf, ativo, tipo_usuario`,
          [senhaHash, cpf]
        );

        if (updateUsuarioRes.rows.length > 0) {
          console.log(
            '✅ Senha atualizada em usuarios:',
            updateUsuarioRes.rows[0]
          );
        } else {
          // Se não existir em usuarios, criar
          const insertUsuarioRes = await pool.query(
            `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, clinica_id, ativo, primeira_senha_alterada)
             VALUES ($1, $2, $3, $4, $5, $6, true, false)
             ON CONFLICT (cpf) DO UPDATE
             SET senha_hash = $4, ativo = true, atualizado_em = CURRENT_TIMESTAMP
             RETURNING cpf, tipo_usuario, ativo`,
            [
              cpf,
              row.responsavel_nome || row.nome,
              row.responsavel_email || row.email,
              senhaHash,
              'rh',
              row.id,
            ]
          );
          console.log(
            '✅ Usuário criado/atualizado em usuarios:',
            insertUsuarioRes.rows[0]
          );
        }
      } else {
        console.log('❌ CNPJ não encontrado em entidades ou clínicas');
      }
    }

    console.log('\n📋 CREDENCIAIS PARA PRIMEIRO ACESSO:');
    console.log('   CPF: 17840664008');
    console.log('   Senha: 000139');
    console.log('\n✅ Após login, o sistema pedirá para criar uma nova senha.');

    await pool.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
})();
