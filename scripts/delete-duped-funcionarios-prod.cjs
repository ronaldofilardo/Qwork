require('dotenv').config();
const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  
  console.log('🔍 Verificando funcionarios com esses CPFs...\n');
  const check = await client.query(
    'SELECT cpf, nome, usuario_tipo, ativo FROM funcionarios WHERE cpf IN ($1, $2)',
    ['04256059903', '09777228996']
  );
  
  console.log('Registros encontrados em funcionarios:');
  check.rows.forEach(r => console.log(`  • ${r.cpf} | ${r.nome} | tipo: ${r.usuario_tipo}`));
  
  console.log('\n🗑️  Deletando...\n');
  const del = await client.query('DELETE FROM funcionarios WHERE cpf IN ($1, $2)', ['04256059903', '09777228996']);
  
  console.log(`✅ Deletados ${del.rowCount} registros de funcionarios\n`);
  
  // Verificar em usuarios
  console.log('✓ Verificando usuarios...\n');
  const usuarios = await client.query(
    'SELECT cpf, nome, tipo_usuario FROM usuarios WHERE cpf IN ($1, $2)',
    ['04256059903', '09777228996']
  );
  
  console.log('Usuários em usuarios (ready for login):');
  usuarios.rows.forEach(r => console.log(`  • ${r.cpf} | ${r.nome} | tipo: ${r.tipo_usuario}`));
  
  await client.end();
})();
