/**
 * Script para corrigir emissor_cpf dos laudos
 * Atualiza emissor_cpf para corresponder ao liberado_por do lote (gestor)
 */

import { query } from '../../lib/db';

async function corrigirEmissorLaudos() {
  console.log('=========================================');
  console.log('CORRIGINDO EMISSOR_CPF DOS LAUDOS');
  console.log('=========================================\n');

  // 1. Mostrar situação atual
  console.log('[1] Situação atual dos laudos:');
  const situacaoAtual = await query(`
    SELECT 
      l.id,
      l.lote_id,
      la.codigo,
      la.liberado_por as gestor_cpf,
      l.emissor_cpf,
      l.emissor_cpf = la.liberado_por as emissor_correto,
      l.status
    FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
    WHERE la.liberado_por IN ('87545772920', '16543102047')
    ORDER BY l.id DESC
  `);
  console.table(situacaoAtual.rows);

  // 2. Identificar laudos que precisam correção
  const laudosParaCorrigir = situacaoAtual.rows.filter(
    (r) => !r.emissor_correto && r.status === 'enviado'
  );

  if (laudosParaCorrigir.length === 0) {
    console.log('\n✓ Todos os laudos já estão com emissor_cpf correto!');
    process.exit(0);
  }

  console.log(
    `\n[2] ${laudosParaCorrigir.length} laudos precisam de correção:\n`
  );
  console.table(laudosParaCorrigir);

  // 3. Confirmar correção
  console.log('\n[3] Aplicando correção...\n');

  for (const laudo of laudosParaCorrigir) {
    try {
      await query(
        `UPDATE laudos 
         SET emissor_cpf = $1, atualizado_em = NOW()
         WHERE id = $2`,
        [laudo.gestor_cpf, laudo.id]
      );
      console.log(
        `✓ Laudo ${laudo.id} (lote ${laudo.codigo}) - emissor atualizado para ${laudo.gestor_cpf}`
      );
    } catch (error) {
      console.error(`✗ Erro ao atualizar laudo ${laudo.id}:`, error);
    }
  }

  // 4. Verificar resultado
  console.log('\n[4] Situação após correção:');
  const situacaoFinal = await query(`
    SELECT 
      l.id,
      l.lote_id,
      la.codigo,
      la.liberado_por as gestor_cpf,
      l.emissor_cpf,
      l.emissor_cpf = la.liberado_por as emissor_correto,
      l.status
    FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
    WHERE la.liberado_por IN ('87545772920', '16543102047')
    ORDER BY l.id DESC
  `);
  console.table(situacaoFinal.rows);

  const todos_corretos = situacaoFinal.rows.every(
    (r) => r.emissor_correto || r.status !== 'enviado'
  );

  if (todos_corretos) {
    console.log(
      '\n✅ SUCESSO: Todos os laudos enviados agora têm emissor_cpf correto!'
    );
  } else {
    console.log('\n⚠️ ATENÇÃO: Ainda existem laudos com emissor_cpf incorreto');
  }

  console.log('\n=========================================');
  console.log('Correção Concluída');
  console.log('=========================================');

  process.exit(0);
}

corrigirEmissorLaudos().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
