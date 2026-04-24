require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log('🔄 Sincronizando senhas de usuarios → funcionarios\n');

  // Envolver em transação para SET LOCAL ser efetivo
  await client.query('BEGIN');
  
  // Definir contexto de sessão (exigido para auditoria)
  await client.query(`SET LOCAL app.current_user_cpf = '00000000000'`);
  await client.query(`SET LOCAL app.current_user_perfil = 'admin'`);

  const cpfs = ['09777228996', '04256059903'];

  for (const cpf of cpfs) {
    console.log(`\nProcessando CPF ${cpf}...`);

    // Buscar senha em usuarios
    const usuariosRes = await client.query(
      `SELECT nome, tipo_usuario, senha_hash FROM usuarios WHERE cpf = $1`,
      [cpf]
    );

    if (usuariosRes.rows.length === 0) {
      console.log(`  ❌ Não encontrado em usuarios`);
      continue;
    }

    const senhaHash = usuariosRes.rows[0].senha_hash;
    console.log(`  ✓ Senha encontrada em usuarios`);

    // Atualizar em funcionarios
    const updateRes = await client.query(
      `UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2`,
      [senhaHash, cpf]
    );

    console.log(`  ✓ Sincronizado em funcionarios (${updateRes.rowCount} registros)`);
  }

  console.log(`\n✅ Sincronização concluída!\n`);
  
  // Commit da transação
  await client.query('COMMIT');
  
  // Verificação final (nova conexão para ver alterações)
  console.log('📋 Verificação final:');
  const check = await client.query(
    `SELECT cpf, nome, usuario_tipo, senha_hash FROM funcionarios WHERE cpf IN ($1, $2)`,
    ['09777228996', '04256059903']
  );

  for (const row of check.rows) {
    const isValid = await bcrypt.compare('123456', row.senha_hash);
    console.log(`  • ${row.cpf} | ${row.nome} | tipo=${row.usuario_tipo} | senha válida=${isValid}`);
  }

  await client.end();
})();
