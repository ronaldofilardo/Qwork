const bcrypt = require('bcryptjs');
const { query } = require('C:/apps/QWork/lib/db');

async function testLogin() {
  const cpf = '87545772920';
  const senha = '000170';

  console.log('=== TESTE DIRETO DE LOGIN ===');
  console.log(`CPF: ${cpf}`);
  console.log(`Senha digitada: ${senha}`);

  try {
    // 1. Buscar em contratantes_senhas
    console.log('\n1. Buscando em contratantes_senhas...');
    const gestorResult = await query(
      `SELECT cs.cpf, cs.senha_hash, c.id as contratante_id, c.responsavel_nome as nome,
              c.tipo, c.ativa, c.pagamento_confirmado
       FROM contratantes_senhas cs
       JOIN contratantes c ON c.id = cs.contratante_id
       WHERE cs.cpf = $1`,
      [cpf]
    );

    if (gestorResult.rows.length > 0) {
      const gestor = gestorResult.rows[0];
      console.log('✅ Gestor encontrado em contratantes_senhas:');
      console.log(`   CPF: ${gestor.cpf}`);
      console.log(`   Tipo: ${gestor.tipo}`);
      console.log(`   Ativa: ${gestor.ativa}`);
      console.log(`   Hash length: ${gestor.senha_hash?.length}`);
      console.log(`   Hash preview: ${gestor.senha_hash?.substring(0, 20)}...`);

      // Testar senha
      console.log('\n2. Testando senha...');
      const senhaValida = await bcrypt.compare(senha, gestor.senha_hash);
      console.log(`   Senha válida: ${senhaValida}`);

      if (senhaValida) {
        console.log('✅ LOGIN BEM SUCEDIDO!');
      } else {
        console.log('❌ SENHA INVÁLIDA');

        // Tentar gerar o hash correto e comparar
        const hashCorreto = await bcrypt.hash(senha, 10);
        console.log(`   Hash correto seria: ${hashCorreto}`);
        console.log(`   Hash armazenado: ${gestor.senha_hash}`);
      }
    } else {
      console.log('❌ Gestor NÃO encontrado em contratantes_senhas');

      // 2. Buscar em funcionarios
      console.log('\n3. Buscando em funcionarios...');
      const funcResult = await query(
        'SELECT cpf, nome, perfil, senha_hash, ativo FROM funcionarios WHERE cpf = $1',
        [cpf]
      );

      if (funcResult.rows.length > 0) {
        const func = funcResult.rows[0];
        console.log('✅ Usuário encontrado em funcionarios:');
        console.log(`   Nome: ${func.nome}`);
        console.log(`   Perfil: ${func.perfil}`);
        console.log(`   Ativo: ${func.ativo}`);
        console.log(`   Hash length: ${func.senha_hash?.length}`);
        console.log(`   Hash preview: ${func.senha_hash?.substring(0, 20)}...`);

        const senhaValida = await bcrypt.compare(senha, func.senha_hash);
        console.log(`   Senha válida: ${senhaValida}`);
      } else {
        console.log('❌ Usuário NÃO encontrado em funcionarios');
      }
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

testLogin();
