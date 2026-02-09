import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { query } from '@/lib/db';

const GESTORES_CPF = ['87545772920', '16543102047', '04703084945'];

async function main() {
  console.log('=========================================');
  console.log('VERIFICANDO tomador_ID DOS LOTES');
  console.log('=========================================\n');

  // 1. Buscar tomador_id dos gestores
  console.log('[1] tomador_id dos gestores:');
  const gestores = await query(
    `SELECT cpf, nome, perfil, tomador_id FROM funcionarios WHERE cpf = ANY($1)`,
    [GESTORES_CPF]
  );
  console.table(gestores.rows);

  // 2. Buscar lotes e verificar tomador_id
  console.log('\n[2] Lotes dos gestores (liberado_por):');
  const lotes = await query(
    `
    SELECT 
      id, codigo, titulo, status,
      liberado_por,
      tomador_id,
      empresa_id,
      clinica_id,
      liberado_em
    FROM lotes_avaliacao 
    WHERE liberado_por = ANY($1)
    ORDER BY id
    `,
    [GESTORES_CPF]
  );
  console.table(lotes.rows);

  // 3. Verificar se tomador_id está NULL ou incorreto
  const lotesProblematicos = lotes.rows.filter(
    (l: any) => l.tomador_id === null
  );

  if (lotesProblematicos.length > 0) {
    console.log('\n⚠️ PROBLEMA ENCONTRADO:');
    console.log(
      `${lotesProblematicos.length} lotes têm tomador_id NULL!\n`
    );
    console.log('Esses lotes NÃO serão visíveis para o gestor devido ao RLS:');
    console.log(
      'POLICY policy_lotes_entidade filtra por: tomador_id = app.current_tomador_id\n'
    );

    console.log('Lotes problemáticos:');
    console.table(lotesProblematicos);

    // Sugerir correção
    console.log('\n[4] Correção necessária:');
    for (const lote of lotesProblematicos) {
      const gestor = gestores.rows.find(
        (g: any) => g.cpf === lote.liberado_por
      );
      if (gestor && gestor.tomador_id) {
        console.log(
          `UPDATE lotes_avaliacao SET tomador_id = ${gestor.tomador_id} WHERE id = ${lote.id}; -- ${lote.codigo}`
        );
      }
    }
  } else {
    console.log(
      '\n✅ Todos os lotes têm tomador_id preenchido corretamente!'
    );
  }

  // 5. Verificar laudos
  console.log('\n[5] Laudos dos lotes:');
  const laudos = await query(
    `
    SELECT 
      l.id, l.lote_id, l.status, l.emissor_cpf, l.enviado_emas lote_codigo
    FROM laudos l
    JOIN lotes_avaliacao la ON la.id = l.lote_id
    WHERE la.liberado_por = ANY($1)
    ORDER BY l.id
    `,
    [GESTORES_CPF]
  );
  console.table(laudos.rows);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro:', err);
    process.exit(1);
  });
