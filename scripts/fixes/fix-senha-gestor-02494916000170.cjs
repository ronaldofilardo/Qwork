/**
 * Restaurar senha do gestor CPF 87545772920
 * Contratante CNPJ 02494916000170 (ID 39)
 * Senha: 000170 (últimos 6 dígitos do CNPJ)
 */

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const DATABASE_URL = 'postgresql://postgres:123456@localhost:5432/nr-bps_db';

async function restaurarSenha() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    const contratanteId = 39;
    const cpf = '87545772920';
    const cnpj = '02494916000170';
    const senha = '000170'; // Últimos 6 dígitos do CNPJ

    console.log('📋 Dados:');
    console.log(`   Contratante ID: ${contratanteId}`);
    console.log(`   CNPJ: ${cnpj}`);
    console.log(`   CPF Gestor: ${cpf}`);
    console.log(`   Senha: ${senha}`);
    console.log('');

    // Gerar hash bcrypt
    console.log('🔐 Gerando hash bcrypt...');
    const senhaHash = await bcrypt.hash(senha, 10);
    console.log(`   Hash: ${senhaHash}`);
    console.log(`   Tamanho: ${senhaHash.length} caracteres`);
    console.log('');

    // Verificar se já existe senha
    console.log('🔍 Verificando se senha já existe...');
    const existeResult = await client.query(
      'SELECT * FROM contratantes_senhas WHERE contratante_id = $1 AND cpf = $2',
      [contratanteId, cpf]
    );

    if (existeResult.rows.length > 0) {
      console.log('   ⚠️  Senha já existe. Atualizando...');
      await client.query(
        'UPDATE contratantes_senhas SET senha_hash = $1 WHERE contratante_id = $2 AND cpf = $3',
        [senhaHash, contratanteId, cpf]
      );
      console.log('   ✅ Senha atualizada com sucesso!');
    } else {
      console.log('   ➕ Senha não existe. Criando...');
      await client.query(
        'INSERT INTO contratantes_senhas (contratante_id, cpf, senha_hash) VALUES ($1, $2, $3)',
        [contratanteId, cpf, senhaHash]
      );
      console.log('   ✅ Senha criada com sucesso!');
    }

    console.log('');

    // Verificar inserção
    console.log('✅ Verificando inserção...');
    const verificacao = await client.query(
      'SELECT senha_hash, LENGTH(senha_hash) as hash_len FROM contratantes_senhas WHERE contratante_id = $1 AND cpf = $2',
      [contratanteId, cpf]
    );

    if (verificacao.rows.length > 0) {
      const dados = verificacao.rows[0];
      console.log(`   Hash armazenado: ${dados.senha_hash}`);
      console.log(`   Tamanho: ${dados.hash_len} caracteres`);

      // Testar autenticação
      console.log('');
      console.log('🔐 Testando autenticação...');
      const senhaValida = await bcrypt.compare(senha, dados.senha_hash);

      if (senhaValida) {
        console.log('   ✅ AUTENTICAÇÃO FUNCIONARÁ!');
        console.log('');
        console.log('🎉 Login disponível:');
        console.log(`   CPF: ${cpf}`);
        console.log(`   Senha: ${senha}`);
      } else {
        console.log('   ❌ ERRO: Senha não confere com o hash!');
      }
    } else {
      console.log('   ❌ ERRO: Senha não foi inserida!');
    }

    // Atualizar funcionarios se necessário
    console.log('');
    console.log('🔄 Atualizando registro em funcionarios...');
    await client.query(
      `UPDATE funcionarios 
       SET contratante_id = $1, senha_hash = $2 
       WHERE cpf = $3`,
      [contratanteId, senhaHash, cpf]
    );
    console.log('   ✅ Funcionário atualizado!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

restaurarSenha();
