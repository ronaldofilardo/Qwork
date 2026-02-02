import { query } from '../lib/db';

async function checkData() {
  try {
    console.log('Total de Funcionários ativos:');
    const funcs = await query(
      'SELECT COUNT(*) as total, perfil FROM funcionarios WHERE ativo = true GROUP BY perfil ORDER BY perfil'
    );
    console.log(funcs.rows);

    console.log('\nTotal de Contratantes_senhas:');
    const senhas = await query(
      'SELECT COUNT(*) as total FROM contratantes_senhas'
    );
    console.log(senhas.rows);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkData();
