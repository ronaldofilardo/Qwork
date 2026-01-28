import { query } from '../lib/db';

async function testFuncionarioQuery() {
  try {
    const result = await query(
      "SELECT cpf, nome, perfil, senha_hash, ativo, nivel_cargo FROM funcionarios WHERE cpf = '22222222222'"
    );
    console.log('Resultado da query:', result.rows);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testFuncionarioQuery();
