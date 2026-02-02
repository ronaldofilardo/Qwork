require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function listarLaudosEmitidos() {
  try {
    console.log('Conectando ao banco...\n');

    const result = await pool.query(`
      SELECT 
        l.id as laudo_id,
        l.emitido_em,
        l.status as laudo_status,
        la.codigo as lote_codigo,
        la.titulo as lote_titulo,
        CASE 
          WHEN la.clinica_id IS NOT NULL THEN 'CLÍNICA/RH'
          WHEN la.contratante_id IS NOT NULL THEN 'ENTIDADE'
          ELSE 'DESCONHECIDO'
        END as tipo_contratante,
        c.nome as clinica_nome,
        c.cnpj as clinica_cnpj,
        ec.nome as empresa_nome,
        ec.cnpj as empresa_cnpj,
        cont.nome as entidade_nome,
        cont.responsavel_cpf as entidade_cpf
      FROM laudos l
      INNER JOIN lotes_avaliacao la ON la.id = l.lote_id
      LEFT JOIN clinicas c ON c.id = la.clinica_id
      LEFT JOIN empresas_clientes ec ON ec.id = la.empresa_id
      LEFT JOIN contratantes cont ON cont.id = la.contratante_id
      WHERE l.emitido_em IS NOT NULL
      ORDER BY l.emitido_em DESC, l.id DESC
    `);

    console.log('=== LAUDOS EMITIDOS ===\n');

    if (result.rows.length === 0) {
      console.log('❌ Nenhum laudo emitido encontrado\n');
    } else {
      console.log(`✓ Total de laudos emitidos: ${result.rows.length}\n`);

      result.rows.forEach((row, idx) => {
        console.log(`${idx + 1}. Laudo ID ${row.laudo_id}`);
        console.log(`   Status: ${row.laudo_status}`);
        console.log(`   Emitido em: ${row.emitido_em}`);
        console.log(`   Tipo: ${row.tipo_contratante}`);
        console.log(`   Lote: ${row.lote_codigo} - ${row.lote_titulo}`);

        if (row.tipo_contratante === 'CLÍNICA/RH') {
          console.log(
            `   Clínica: ${row.clinica_nome || 'N/A'} (CNPJ: ${row.clinica_cnpj || 'N/A'})`
          );
          console.log(
            `   Empresa: ${row.empresa_nome || 'N/A'} (CNPJ: ${row.empresa_cnpj || 'N/A'})`
          );
        } else if (row.tipo_contratante === 'ENTIDADE') {
          console.log(
            `   Entidade: ${row.entidade_nome || 'N/A'} (CPF: ${row.entidade_cpf || 'N/A'})`
          );
        }
        console.log('');
      });
    }

    await pool.end();
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

listarLaudosEmitidos();
