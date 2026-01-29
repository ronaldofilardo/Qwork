import { query } from './lib/db.js';

async function verificarLotesPendentes() {
  try {
    console.log(
      'Buscando lotes concluídos sem laudo ou com laudo em rascunho...'
    );

    const result = await query(`
      SELECT la.id, la.codigo, la.status, la.emitido_em, l.id as laudo_id, l.status as status_laudo
      FROM lotes_avaliacao la
      LEFT JOIN laudos l ON la.id = l.id
      WHERE la.status = 'concluido' AND (l.id IS NULL OR l.status = 'rascunho')
      ORDER BY la.finalizado_em DESC
      LIMIT 5;
    `);

    console.log(`Encontrados ${result.rows.length} lotes pendentes:`);
    result.rows.forEach((lote) => {
      console.log(
        `ID: ${lote.id} | Código: ${lote.codigo} | Status: ${lote.status}`
      );
      console.log(
        `Emitido em: ${lote.emitido_em} | Laudo ID: ${lote.laudo_id} | Status Laudo: ${lote.status_laudo}`
      );
      console.log('---');
    });

    // Verificar se há emissores ativos
    const emissores = await query(`
      SELECT cpf, nome, ativo FROM funcionarios WHERE perfil = 'emissor' AND ativo = true;
    `);

    console.log(`\nEmissores ativos: ${emissores.rows.length}`);
    emissores.rows.forEach((emissor) => {
      console.log(
        `CPF: ${emissor.cpf} | Nome: ${emissor.nome} | Ativo: ${emissor.ativo}`
      );
    });
  } catch (error) {
    console.error('Erro ao verificar lotes pendentes:', error);
  }
}

verificarLotesPendentes().then(() => {
  console.log('Verificação concluída');
  process.exit(0);
});
