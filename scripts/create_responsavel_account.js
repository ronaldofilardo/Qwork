import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Client } = pg;
const contratanteId = process.argv[2] || '20';

const client = new Client({
  connectionString:
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

(async () => {
  try {
    await client.connect();
    console.log('Connected to DB');

    const r = await client.query(
      'SELECT id, cnpj, responsavel_cpf, responsavel_nome, responsavel_email, tipo FROM contratantes WHERE id = $1',
      [contratanteId]
    );
    if (r.rows.length === 0) {
      console.error('Contratante not found', contratanteId);
      process.exit(1);
    }
    const c = r.rows[0];
    const cleanCnpj = (c.cnpj || '').replace(/[.\/-]/g, '');
    const defaultPassword = (cleanCnpj || '').slice(-6) || 'changeme';
    const hashed = await bcrypt.hash(defaultPassword, 10);
    const cpfParaUsar = c.responsavel_cpf || cleanCnpj;

    console.log(
      'Will create/update account for CPF:',
      cpfParaUsar,
      'defaultPassword:',
      defaultPassword
    );

    // Upsert contratantes_senhas
    const exists = await client.query(
      'SELECT id FROM contratantes_senhas WHERE contratante_id = $1 AND cpf = $2',
      [c.id, cpfParaUsar]
    );
    if (exists.rows.length > 0) {
      await client.query(
        'UPDATE contratantes_senhas SET senha_hash = $1, atualizado_em = CURRENT_TIMESTAMP WHERE contratante_id = $2 AND cpf = $3',
        [hashed, c.id, cpfParaUsar]
      );
      console.log('Updated contratantes_senhas');
    } else {
      await client.query(
        'INSERT INTO contratantes_senhas (contratante_id, cpf, senha_hash) VALUES ($1, $2, $3)',
        [c.id, cpfParaUsar, hashed]
      );
      console.log('Inserted contratantes_senhas');
    }

    // Upsert funcionarios
    const f = await client.query('SELECT id FROM funcionarios WHERE cpf = $1', [
      cpfParaUsar,
    ]);
    const perfil = c.tipo === 'entidade' ? 'gestor_entidade' : 'rh';
    if (f.rows.length > 0) {
      const fid = f.rows[0].id;
      await client.query(
        'UPDATE funcionarios SET nome = $1, email = $2, perfil = $3, contratante_id = $4, ativo = true, senha_hash = $5, atualizado_em = CURRENT_TIMESTAMP WHERE id = $6',
        [
          c.responsavel_nome || 'Gestor',
          c.responsavel_email || null,
          perfil,
          c.id,
          hashed,
          fid,
        ]
      );
      console.log('Updated funcionario id', fid);
      const vinc = await client.query(
        'SELECT * FROM contratantes_funcionarios WHERE funcionario_id = $1 AND contratante_id = $2',
        [fid, c.id]
      );
      if (vinc.rows.length > 0) {
        await client.query(
          'UPDATE contratantes_funcionarios SET vinculo_ativo = true, atualizado_em = CURRENT_TIMESTAMP WHERE funcionario_id = $1 AND contratante_id = $2',
          [fid, c.id]
        );
      } else {
        await client.query(
          'INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo) VALUES ($1, $2, $3, true)',
          [fid, c.id, c.tipo || 'entidade']
        );
      }
    } else {
      const ins = await client.query(
        `INSERT INTO funcionarios (cpf, nome, email, perfil, contratante_id, ativo, empresa_id, setor, funcao, nivel_cargo, senha_hash, criado_em, atualizado_em)
        VALUES ($1,$2,$3,$4,$5,true,NULL,'Gestão','Gestor da Entidade','gestao',$6,NOW(),NOW()) RETURNING id`,
        [
          cpfParaUsar,
          c.responsavel_nome || 'Gestor',
          c.responsavel_email || null,
          perfil,
          c.id,
          hashed,
        ]
      );
      const newId = ins.rows[0].id;
      await client.query(
        'INSERT INTO contratantes_funcionarios (funcionario_id, contratante_id, tipo_contratante, vinculo_ativo) VALUES ($1, $2, $3, true)',
        [newId, c.id, c.tipo || 'entidade']
      );
      console.log('Inserted new funcionario id', newId);
    }

    console.log(
      'Account creation complete. You can now login with CPF and default password (last 6 digits of CNPJ).'
    );

    await client.end();
  } catch (err) {
    console.error('Error creating account:', err);
    try {
      await client.end();
    } catch {}
    process.exit(1);
  }
})();
