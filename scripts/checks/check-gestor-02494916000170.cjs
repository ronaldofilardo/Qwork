/**
 * Verificar dados do contratante CNPJ 02494916000170
 * e gestor CPF 87545772920
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://postgres:123456@localhost:5432/nr-bps_db';

async function verificarGestor() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    const cnpj = '02494916000170';
    const cpf = '87545772920';
    const senhaEsperada = '000170';

    console.log('📋 Dados a verificar:');
    console.log(`   CNPJ: ${cnpj}`);
    console.log(`   CPF Gestor: ${cpf}`);
    console.log(`   Senha esperada: ${senhaEsperada}`);
    console.log('');

    // 1. Verificar contratante
    console.log('1️⃣ Verificando contratante...');
    const contratanteResult = await client.query(
      'SELECT id, cnpj, responsavel_nome, responsavel_cpf, tipo, ativa FROM contratantes WHERE cnpj = $1',
      [cnpj]
    );

    if (contratanteResult.rows.length === 0) {
      console.log('   ❌ Contratante não encontrado!');
      return;
    }

    const contratante = contratanteResult.rows[0];
    console.log('   ✅ Contratante encontrado:');
    console.log(`      ID: ${contratante.id}`);
    console.log(`      Nome: ${contratante.responsavel_nome}`);
    console.log(`      CPF Responsável: ${contratante.responsavel_cpf}`);
    console.log(`      Tipo: ${contratante.tipo}`);
    console.log(`      Ativa: ${contratante.ativa}`);
    console.log('');

    // 2. Verificar senha em contratantes_senhas
    console.log('2️⃣ Verificando senha em contratantes_senhas...');
    const senhaResult = await client.query(
      'SELECT senha_hash, LENGTH(senha_hash) as hash_len FROM contratantes_senhas WHERE contratante_id = $1 AND cpf = $2',
      [contratante.id, cpf]
    );

    if (senhaResult.rows.length === 0) {
      console.log('   ❌ Senha não encontrada em contratantes_senhas!');
    } else {
      const senhaData = senhaResult.rows[0];
      console.log('   ✅ Senha encontrada:');
      console.log(`      Hash length: ${senhaData.hash_len}`);
      console.log(`      Hash: ${senhaData.senha_hash}`);

      // Testar senha
      console.log('\n3️⃣ Testando autenticação...');
      const senhaValida = await bcrypt.compare(
        senhaEsperada,
        senhaData.senha_hash
      );

      if (senhaValida) {
        console.log('   ✅ SENHA VÁLIDA! Autenticação funcionará.');
      } else {
        console.log('   ❌ SENHA INVÁLIDA! Autenticação falhará.');

        // Testar variações
        console.log('\n   🔍 Testando variações:');
        const teste1 = await bcrypt.compare('000170', senhaData.senha_hash);
        console.log(`      "000170": ${teste1 ? 'válida' : 'inválida'}`);

        const teste2 = await bcrypt.compare('170', senhaData.senha_hash);
        console.log(`      "170": ${teste2 ? 'válida' : 'inválida'}`);

        // Gerar novo hash correto
        console.log('\n   🔧 Gerando hash correto para a senha "000170":');
        const hashCorreto = await bcrypt.hash(senhaEsperada, 10);
        console.log(`      ${hashCorreto}`);
      }
    }

    // 3. Verificar em funcionarios
    console.log('\n4️⃣ Verificando registro em funcionarios...');
    const funcResult = await client.query(
      'SELECT cpf, nome, perfil, ativo, contratante_id FROM funcionarios WHERE cpf = $1',
      [cpf]
    );

    if (funcResult.rows.length === 0) {
      console.log('   ❌ Funcionário não encontrado!');
    } else {
      const func = funcResult.rows[0];
      console.log('   ✅ Funcionário encontrado:');
      console.log(`      CPF: ${func.cpf}`);
      console.log(`      Nome: ${func.nome}`);
      console.log(`      Perfil: ${func.perfil}`);
      console.log(`      Ativo: ${func.ativo}`);
      console.log(`      Contratante ID: ${func.contratante_id}`);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

verificarGestor();
