#!/usr/bin/env tsx
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

(async () => {
  console.log(
    '═══════════════════════════════════════════════════════════════'
  );
  console.log(
    'ESTRUTURA COMPLETA: laudos → lotes → avaliacoes → funcionarios\n'
  );

  // Lotes
  console.log('1️⃣  LOTES_AVALIACAO:\n');
  const lotes = await pool.query(`
    SELECT 
      l.id,
      l.numero_lote,
      l.clinica_id,
      c.nome AS clinica_nome,
      c.entidade_id,
      e.nome AS entidade_nome
    FROM lotes_avaliacao l
    LEFT JOIN clinicas c ON c.id = l.clinica_id
    LEFT JOIN entidades e ON e.id = c.entidade_id
    ORDER BY l.id
  `);

  for (const lote of lotes.rows) {
    console.log(`   Lote ${lote.id} (${lote.numero_lote})`);
    console.log(
      `      → clinica_id: ${lote.clinica_id} (${lote.clinica_nome || 'N/A'})`
    );
    console.log(
      `      → entidade_id: ${lote.entidade_id} (${lote.entidade_nome || 'N/A'})\n`
    );
  }

  // Avaliacoes
  console.log('2️⃣  AVALIACOES:\n');
  const avaliacoes = await pool.query(`
    SELECT 
      a.id,
      a.lote_id,
      a.funcionario_id,
      f.nome AS funcionario_nome,
      f.tomador_id,
      f.clinica_id AS funcionario_clinica
    FROM avaliacoes a
    LEFT JOIN funcionarios f ON f.id = a.funcionario_id
    ORDER BY a.id
  `);

  for (const aval of avaliacoes.rows) {
    console.log(`   Avaliação ${aval.id}`);
    console.log(`      → lote_id: ${aval.lote_id}`);
    console.log(
      `      → funcionario_id: ${aval.funcionario_id} (${aval.funcionario_nome || 'N/A'})`
    );
    console.log(
      `      → funcionario_tomador: ${aval.tomador_id || 'NULL'}`
    );
    console.log(
      `      → funcionario_clinica: ${aval.funcionario_clinica || 'NULL'}\n`
    );
  }

  // Laudos
  console.log('3️⃣  LAUDOS:\n');
  const laudos = await pool.query(`
    SELECT 
      l.id AS laudo_id,
      l.lote_id,
      lt.clinica_id,
      c.entidade_id
    FROM laudos l
    LEFT JOIN lotes_avaliacao lt ON lt.id = l.lote_id
    LEFT JOIN clinicas c ON c.id = lt.clinica_id
    ORDER BY l.id
  `);

  for (const laudo of laudos.rows) {
    console.log(`   Laudo ${laudo.laudo_id}`);
    console.log(`      → lote_id: ${laudo.lote_id}`);
    console.log(`      → clinica_id (do lote): ${laudo.clinica_id || 'NULL'}`);
    console.log(
      `      → entidade_id (da clínica): ${laudo.entidade_id || 'NULL'}\n`
    );
  }

  console.log(
    '═══════════════════════════════════════════════════════════════\n'
  );

  await pool.end();
})();
