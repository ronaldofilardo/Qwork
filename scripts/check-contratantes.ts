import { query } from '../lib/db';

async function checkContratantes() {
  try {
    console.log('Contratantes:');
    const contratantes = await query(
      'SELECT id, cnpj, responsavel_nome, tipo, ativa FROM contratantes LIMIT 5'
    );
    console.log(contratantes.rows);

    console.log('Contratantes_senhas com JOIN:');
    const senhasJoin = await query(`
      SELECT cs.cpf, cs.senha_hash, c.id as contratante_id, c.responsavel_nome as nome,
             c.tipo, c.ativa, c.pagamento_confirmado
      FROM contratantes_senhas cs
      JOIN contratantes c ON c.id = cs.contratante_id
      LIMIT 5
    `);
    console.log(senhasJoin.rows);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkContratantes();
