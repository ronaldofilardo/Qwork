const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

require('./load-env.cjs').loadEnv();

(async () => {
  const client = new Client({
    connectionString:
      process.env.LOCAL_DATABASE_URL || process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    await client.query('BEGIN');

    const cpf = process.argv[2];
    if (!cpf || cpf.length !== 11) {
      console.error('Uso: node createGestorAccount.cjs <CPF>');
      process.exit(1);
    }

    // Buscar contratante pelo responsavel
    const contratanteRes = await client.query(
      'SELECT id, cnpj, responsavel_nome, responsavel_email, responsavel_celular, tipo FROM tomadores WHERE responsavel_cpf = $1 LIMIT 1',
      [cpf]
    );

    if (contratanteRes.rows.length === 0) {
      console.error('Nenhum contratante encontrado para o CPF', cpf);
      await client.query('ROLLBACK');
      process.exit(1);
    }

    const contratante = contratanteRes.rows[0];
    const cleanCnpj = contratante.cnpj.replace(/[^0-9]/g, '');
    const defaultPassword = cleanCnpj.slice(-6);
    const hash = await bcrypt.hash(defaultPassword, 10);

    console.log('Contratante:', contratante.id, 'CNPJ:', contratante.cnpj);
    console.log('Senha padrão:', defaultPassword);

    // Upsert em entidades_senhas (compatível com esquemas sem UNIQUE)
    const csExists = await client.query(
      'SELECT id FROM entidades_senhas WHERE contratante_id = $1 AND cpf = $2',
      [contratante.id, cpf]
    );

    if (csExists.rows.length > 0) {
      await client.query(
        'UPDATE entidades_senhas SET senha_hash = $1, atualizado_em = CURRENT_TIMESTAMP WHERE contratante_id = $2 AND cpf = $3',
        [hash, contratante.id, cpf]
      );
      console.log('Atualizado em entidades_senhas');
    } else {
      await client.query(
        'INSERT INTO entidades_senhas (contratante_id, cpf, senha_hash) VALUES ($1, $2, $3)',
        [contratante.id, cpf, hash]
      );
      console.log('Inserido em entidades_senhas');
    }

    // Verificar funcionario
    const fRes = await client.query(
      'SELECT id FROM funcionarios WHERE cpf = $1',
      [cpf]
    );
    if (fRes.rows.length > 0) {
      const fid = fRes.rows[0].id;
      await client.query(
        `UPDATE funcionarios SET nome = $1, email = $2, perfil = 'gestor', contratante_id = $3, ativo = true, senha_hash = $4, atualizado_em = CURRENT_TIMESTAMP WHERE id = $5`,
        [
          contratante.responsavel_nome || 'Gestor',
          contratante.responsavel_email || null,
          contratante.id,
          hash,
          fid,
        ]
      );
      console.log('Atualizado registro em funcionarios id=', fid);

      // Upsert vinculo
      const vinc = await client.query(
        'SELECT * FROM tomadores_funcionarios WHERE funcionario_id = $1 AND contratante_id = $2',
        [fid, contratante.id]
      );
      if (vinc.rows.length > 0) {
        await client.query(
          'UPDATE tomadores_funcionarios SET vinculo_ativo = true, atualizado_em = CURRENT_TIMESTAMP WHERE funcionario_id = $1 AND contratante_id = $2',
          [fid, contratante.id]
        );
        console.log('Ativado vínculo existente');
      } else {
        await client.query(
          'INSERT INTO tomadores_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo) VALUES ($1, $2, $3, true)',
          [fid, contratante.id, contratante.tipo || 'entidade']
        );
        console.log('Criado vínculo funcionario -> contratante');
      }
    } else {
      const ins = await client.query(
        `INSERT INTO funcionarios (cpf, nome, email, perfil, contratante_id, ativo, empresa_id, setor, funcao, nivel_cargo, senha_hash, criado_em, atualizado_em)
         VALUES ($1,$2,$3,'gestor',$4,true,NULL,'Gestão','Gestor da Entidade','gestao',$5,NOW(),NOW()) RETURNING id`,
        [
          cpf,
          contratante.responsavel_nome || 'Gestor',
          contratante.responsavel_email || null,
          contratante.id,
          hash,
        ]
      );
      const newId = ins.rows[0].id;
      console.log('Inserido novo funcionario id=', newId);

      await client.query(
        'INSERT INTO tomadores_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo) VALUES ($1, $2, $3, true)',
        [newId, contratante.id, contratante.tipo || 'entidade']
      );
      console.log('Criado vínculo para novo funcionario');
    }

    await client.query('COMMIT');
    console.log(
      'Conta de gestor garantida com sucesso. Login com senha padrão:',
      defaultPassword
    );
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
