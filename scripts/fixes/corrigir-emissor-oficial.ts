/**
 * Script para corrigir emissor_cpf incorreto (00000000000)
 * Todos os laudos devem ter emissor_cpf = 53051173991 (emissor oficial)
 */

import { query } from '../../lib/db';

async function corrigirEmissorIncorreto() {
  console.log('=========================================');
  console.log('CORRIGINDO EMISSOR_CPF INCORRETO');
  console.log('Emissor oficial: 53051173991');
  console.log('=========================================\n');

  // 1. Identificar laudos com emissor incorreto
  console.log('[1] Laudos com emissor incorreto (00000000000):');
  const laudosIncorretos = await query(`
    SELECT 
      l.id,
      l.lote_id,
      
      la.liberado_por as gestor_cpf,
      l.emissor_cpf,
      l.status,
      l.emitido_em
    FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
    WHERE l.emissor_cpf = '00000000000'
    ORDER BY l.id DESC
  `);

  if (laudosIncorretos.rows.length === 0) {
    console.log('✓ Nenhum laudo com emissor incorreto encontrado!');
    process.exit(0);
  }

  console.table(laudosIncorretos.rows);
  console.log(
    `\nTotal: ${laudosIncorretos.rows.length} laudos para corrigir\n`
  );

  // 2. Corrigir emissor_cpf
  console.log('[2] Aplicando correção para emissor oficial: 53051173991\n');

  const emissorOficial = '53051173991';

  for (const laudo of laudosIncorretos.rows) {
    try {
      await query(
        `UPDATE laudos 
         SET emissor_cpf = $1, atualizado_em = NOW()
         WHERE id = $2`,
        [emissorOficial, laudo.id]
      );
      console.log(
        `✓ Laudo ${laudo.id} (lote ${laudo.codigo}) - emissor atualizado para ${emissorOficial}`
      );
    } catch (error) {
      console.error(`✗ Erro ao atualizar laudo ${laudo.id}:`, error);
    }
  }

  // 3. Verificar resultado final
  console.log('\n[3] Verificação final - todos os laudos:');
  const todosLaudos = await query(`
    SELECT 
      l.id,
      l.lote_id,
      
      la.liberado_por as gestor_cpf,
      l.emissor_cpf,
      CASE 
        WHEN l.emissor_cpf = '53051173991' THEN '✓'
        ELSE '✗'
      END as correto,
      l.status
    FROM laudos l
    JOIN lotes_avaliacao la ON l.lote_id = la.id
    WHERE la.liberado_por IN ('87545772920', '16543102047')
    ORDER BY l.id DESC
  `);
  console.table(todosLaudos.rows);

  const todosCorretos = todosLaudos.rows.every(
    (r) => r.emissor_cpf === '53051173991' || r.emissor_cpf === null
  );

  if (todosCorretos) {
    console.log(
      '\n✅ SUCESSO: Todos os laudos agora têm o emissor oficial correto!'
    );
  } else {
    console.log('\n⚠️ ATENÇÃO: Ainda existem laudos com emissor incorreto');
  }

  console.log('\n=========================================');
  console.log('Correção Concluída');
  console.log('=========================================');

  process.exit(0);
}

corrigirEmissorIncorreto().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
