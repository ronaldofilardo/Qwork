import { query } from '../lib/db';

async function checkData() {
  try {
    console.log('Funcionarios:');
    const funcs = await query(
      "SELECT cpf, nome, perfil, ativo FROM funcionarios WHERE cpf IN ('22222222222', '99999999999', '11111111111', '33333333333')"
    );
    console.log(funcs.rows);

    console.log('Contratantes_senhas:');
    const senhas = await query(
      'SELECT cpf, contratante_id FROM contratantes_senhas LIMIT 10'
    );
    console.log(senhas.rows);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkData();
