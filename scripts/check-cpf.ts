import { query } from '../lib/db';

async function check() {
  try {
    const cpf = process.argv[2];

    if (!cpf) {
      console.error('Uso: node check-cpf.ts <CPF>');
      process.exit(1);
    }

    const res = await query(
      'SELECT cpf, nome, perfil, ativo FROM funcionarios WHERE cpf = $1',
      [cpf]
    );
    console.log('Funcionários encontrados:', res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

check();
