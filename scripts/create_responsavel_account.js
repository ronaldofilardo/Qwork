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

    // Upsert entidades_senhas
    const exists = await client.query(
      'SELECT id FROM entidades_senhas WHERE contratante_id = $1 AND cpf = $2',
      [c.id, cpfParaUsar]
    );
    if (exists.rows.length > 0) {
      await client.query(
        'UPDATE entidades_senhas SET senha_hash = $1, atualizado_em = CURRENT_TIMESTAMP WHERE contratante_id = $2 AND cpf = $3',
        [hashed, c.id, cpfParaUsar]
      );
      console.log('Updated entidades_senhas');
    } else {
      await client.query(
        'INSERT INTO entidades_senhas (contratante_id, cpf, senha_hash) VALUES ($1, $2, $3)',
        [c.id, cpfParaUsar, hashed]
      );
      console.log('Inserted entidades_senhas');
    }

    // Upsert usuarios (gestores não são funcionarios)
    const u = await client.query('SELECT id FROM usuarios WHERE cpf = $1', [
      cpfParaUsar,
    ]);
    const tipoUsuario = c.tipo === 'entidade' ? 'gestor' : 'rh';
    if (u.rows.length > 0) {
      const uid = u.rows[0].id;
      await client.query(
        'UPDATE usuarios SET nome = $1, email = $2, tipo_usuario = $3, contratante_id = $4, ativo = true, senha_hash = $5, atualizado_em = CURRENT_TIMESTAMP WHERE id = $6',
        [
          c.responsavel_nome || 'Gestor',
          c.responsavel_email || null,
          tipoUsuario,
          c.id,
          hashed,
          uid,
        ]
      );
      console.log('Updated usuario id', uid);
    } else {
      const ins = await client.query(
        `INSERT INTO usuarios (cpf, nome, email, senha_hash, tipo_usuario, contratante_id, ativo, criado_em, atualizado_em)
        VALUES ($1,$2,$3,$4,$5,$6,true,NOW(),NOW()) RETURNING id`,
        [
          cpfParaUsar,
          c.responsavel_nome || 'Gestor',
          c.responsavel_email || null,
          hashed,
          tipoUsuario,
          c.id,
        ]
      );
      const newId = ins.rows[0].id;
      console.log('Inserted new usuario id', newId);
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
