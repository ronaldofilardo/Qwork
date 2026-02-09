/**
 * Script para investigar lotes/laudos perdidos de gestores convertidos
 * CPFs: 87545772920, 16543102047
 */

import { query } from '../../lib/db';

async function investigarGestores() {
  const cpfs = ['87545772920', '16543102047'];

  console.log('=========================================');
  console.log('INVESTIGAÇÃO: Lotes/Laudos Perdidos');
  console.log('=========================================\n');

  for (const cpf of cpfs) {
    console.log(`\n========== CPF: ${cpf} ==========\n`);

    // 1. Localização do CPF
    console.log('[1] Localização atual:');
    const localizacao = await query(
      `SELECT 'funcionarios' as tabela, cpf, nome, perfil, ativo, tomador_id
       FROM funcionarios 
       WHERE cpf = $1
       UNION ALL
       SELECT 'entidades_senhas' as tabela, cs.cpf, c.nome, 'gestor' as perfil, true, cs.tomador_id
       FROM entidades_senhas cs
       JOIN tomadors c ON cs.tomador_id = c.id
       WHERE cs.cpf = $1`,
      [cpf]
    );
    console.table(localizacao.rows);

    // 2. Lotes criados
    console.log('\n[2] Lotes criados:');
    const lotes = await query(
      `SELECT 
        la.id,
        
        la.titulo,
        la.status,
        la.liberado_por,
        la.tomador_id,
        COALESCE(c.nome, 'SEM tomador') as tomador_nome,
        COUNT(a.id) as total_avaliacoes
      FROM lotes_avaliacao la
      LEFT JOIN tomadors c ON la.tomador_id = c.id
      LEFT JOIN avaliacoes a ON a.lote_id = la.id
      WHERE la.liberado_por = $1
      GROUP BY la.id,  la.titulo, la.status, la.liberado_por, la.tomador_id, c.nome
      ORDER BY la.id DESC`,
      [cpf]
    );
    console.table(lotes.rows);

    // 3. Laudos emitidos
    console.log('\n[3] Laudos emitidos:');
    const laudos = await query(
      `SELECT 
        l.id,
        l.lote_idas lote_codigo,
        l.status,
        l.emissor_cpf,
        l.emitido_em,
        l.hash_pdf IS NOT NULL as tem_hash
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.emissor_cpf = $1
      ORDER BY l.id DESC`,
      [cpf]
    );
    console.table(laudos.rows);

    // 4. Verificar inconsistências
    console.log('\n[4] Lotes sem tomador_id:');
    const inconsistencias = await query(
      `SELECT 
        la.id,
        
        la.liberado_por,
        la.tomador_id,
        cs.tomador_id as gestor_tomador_id
      FROM lotes_avaliacao la
      LEFT JOIN entidades_senhas cs ON cs.cpf = la.liberado_por
      WHERE la.liberado_por = $1
        AND la.tomador_id IS NULL
        AND cs.tomador_id IS NOT NULL`,
      [cpf]
    );

    if (inconsistencias.rows.length > 0) {
      console.table(inconsistencias.rows);
      console.log(
        `\n⚠️  Encontradas ${inconsistencias.rows.length} inconsistências que precisam ser corrigidas!`
      );
    } else {
      console.log('✓ Nenhuma inconsistência encontrada');
    }
  }

  console.log('\n=========================================');
  console.log('Fim da Investigação');
  console.log('=========================================');

  process.exit(0);
}

investigarGestores().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
