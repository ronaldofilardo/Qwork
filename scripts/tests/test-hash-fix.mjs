import { criarContaResponsavel, query } from './lib/db.js';

async function testHashStorage() {
  try {
    // Primeiro, vamos verificar se há algum contratante existente para testar
    const contratantes = await query('SELECT * FROM contratantes LIMIT 1');

    if (contratantes.rows.length === 0) {
      console.log('Nenhum contratante encontrado para teste');
      return;
    }

    const contratante = contratantes.rows[0];
    console.log(
      'Testando com contratante:',
      contratante.id,
      contratante.responsavel_cpf
    );

    // Limpar dados existentes para teste limpo
    await query('DELETE FROM entidades_senhas WHERE contratante_id = $1', [
      contratante.id,
    ]);
    await query('DELETE FROM funcionarios WHERE cpf = $1', [
      contratante.responsavel_cpf,
    ]);

    // Executar a função
    await criarContaResponsavel(contratante);

    // Verificar o resultado
    const result = await query(
      'SELECT senha_hash, length(senha_hash) as len FROM entidades_senhas WHERE contratante_id = $1',
      [contratante.id]
    );

    if (result.rows.length > 0) {
      const { len, senha_hash } = result.rows[0];
      console.log(`Hash armazenado - Comprimento: ${len}`);
      console.log(`Hash completo: ${senha_hash}`);

      if (len === 60) {
        console.log('✅ SUCESSO: Hash armazenado completamente!');
      } else {
        console.log(`❌ FALHA: Hash truncado para ${len} caracteres`);
      }
    } else {
      console.log('❌ ERRO: Nenhum hash encontrado após inserção');
    }
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

testHashStorage();
