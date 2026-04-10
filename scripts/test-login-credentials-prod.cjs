require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  console.log('🔍 Testando credenciais em PROD (neondb_v2)\n');

  const testCases = [
    { cpf: '09777228996', nome: 'Amanda', senha: '123456', tipo: 'suporte' },
    { cpf: '04256059903', nome: 'Talita Parteka', senha: '123456', tipo: 'comercial' },
  ];

  for (const tc of testCases) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Testando: ${tc.nome} (${tc.tipo})`);
    console.log(`CPF: ${tc.cpf} | Senha: ${tc.senha}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Buscar em usuarios
    const usuariosRes = await client.query(
      `SELECT id, cpf, nome, tipo_usuario, ativo, senha_hash FROM usuarios WHERE cpf = $1`,
      [tc.cpf]
    );

    if (usuariosRes.rows.length === 0) {
      console.log('❌ NÃO ENCONTRADO em usuarios');
    } else {
      const u = usuariosRes.rows[0];
      console.log(`✓ Encontrado em usuarios`);
      console.log(`  ID: ${u.id}`);
      console.log(`  Nome: ${u.nome}`);
      console.log(`  Tipo: ${u.tipo_usuario}`);
      console.log(`  Ativo: ${u.ativo}`);
      console.log(`  Hash: ${u.senha_hash.substring(0, 20)}...`);

      // Testar bcrypt
      const isValid = await bcrypt.compare(tc.senha, u.senha_hash);
      console.log(`\n  🔐 Senha válida (bcrypt): ${isValid ? '✅ SIM' : '❌ NÃO'}`);
    }

    // Verificar se existe em funcionarios (não deveria)
    const funcRes = await client.query(
      `SELECT cpf, nome, usuario_tipo FROM funcionarios WHERE cpf = $1`,
      [tc.cpf]
    );

    if (funcRes.rows.length > 0) {
      console.log(`\n⚠️  AVISO: Ainda existe em funcionarios com tipo=${funcRes.rows[0].usuario_tipo}`);
      console.log(`  → Para login funcionar, precisa estar APENAS em usuarios`);
    } else {
      console.log(`\n✓ Não encontrado em funcionarios (correto)`);
    }
  }

  console.log(`\n\n✅ Teste concluído!`);
  await client.end();
})();
