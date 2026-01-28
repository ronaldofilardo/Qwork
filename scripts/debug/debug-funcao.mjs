import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.development' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.LOCAL_DATABASE_URL,
});

(async () => {
  try {
    console.log('🔍 Debug da função detectar_anomalias_indice...\n');

    // Testar a primeira parte: funcionários que nunca avaliaram
    console.log('1. Funcionários que nunca tiveram avaliações liberadas:');
    const nuncaLiberadas = await pool.query(`
      SELECT f.cpf, f.nome
      FROM funcionarios f
      WHERE f.empresa_id = 1
        AND f.ativo = true
        AND f.criado_em < NOW() - INTERVAL '6 months'
        AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf)
    `);

    console.log(`Encontrados: ${nuncaLiberadas.rows.length}`);
    nuncaLiberadas.rows.forEach(row => console.log(`  - ${row.nome} (${row.cpf})`));

    // Testar a segunda parte: funcionários que tiveram avaliações mas nunca concluíram
    console.log('\n2. Funcionários que tiveram avaliações liberadas mas nunca concluíram:');
    const liberadasNuncaConcluidas = await pool.query(`
      SELECT f.cpf, f.nome
      FROM funcionarios f
      WHERE f.empresa_id = 1
        AND f.ativo = true
        AND EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf)
        AND NOT EXISTS(SELECT 1 FROM avaliacoes WHERE funcionario_cpf = f.cpf AND status = 'concluida')
    `);

    console.log(`Encontrados: ${liberadasNuncaConcluidas.rows.length}`);
    liberadasNuncaConcluidas.rows.forEach(row => console.log(`  - ${row.nome} (${row.cpf})`));

    // Verificar especificamente João
    console.log('\n3. Verificação específica para João da Lagos:');
    const joaoAvaliacoes = await pool.query(`
      SELECT
        f.cpf,
        f.nome,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as concluidas,
        COUNT(CASE WHEN a.status != 'concluida' THEN 1 END) as nao_concluidas
      FROM funcionarios f
      LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
      WHERE f.cpf = '80510620949'
      GROUP BY f.cpf, f.nome
    `);

    if (joaoAvaliacoes.rows.length > 0) {
      const row = joaoAvaliacoes.rows[0];
      console.log(`${row.nome}: ${row.total_avaliacoes} aval, ${row.concluidas} conc, ${row.nao_concluidas} não conc`);
      console.log(`Deve ser detectado como NUNCA_AVALIADO: ${row.total_avaliacoes > 0 && row.concluidas === 0}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
})();