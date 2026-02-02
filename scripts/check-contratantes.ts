import { query } from '../lib/db';

async function checkContratantes() {
  try {
    console.log('Estatísticas de Contratantes:');
    const contratantes = await query(
      'SELECT tipo, ativa, pagamento_confirmado, COUNT(*) as total FROM contratantes GROUP BY tipo, ativa, pagamento_confirmado ORDER BY tipo'
    );
    console.log(contratantes.rows);

    console.log('\nContratantes com senhas configuradas:');
    const senhasJoin = await query(`
      SELECT c.tipo, c.ativa, COUNT(DISTINCT c.id) as total_com_senha
      FROM contratantes_senhas cs
      JOIN contratantes c ON c.id = cs.contratante_id
      GROUP BY c.tipo, c.ativa
      ORDER BY c.tipo
    `);
    console.log(senhasJoin.rows);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

checkContratantes();
