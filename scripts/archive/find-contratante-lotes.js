import { query } from '../../lib/db.ts';

async function findContratanteELotes() {
  try {
    // Primeiro, encontrar o contratante
    const contratanteResult = await query(
      'SELECT id, nome, tipo, responsavel_cpf FROM contratantes WHERE responsavel_cpf = $1',
      ['87545772920']
    );

    if (contratanteResult.rows.length === 0) {
      console.log('Contratante não encontrado com CPF 87545772920');
      return;
    }

    const contratante = contratanteResult.rows[0];
    console.log('Contratante encontrado:');
    console.log('- ID:', contratante.id);
    console.log('- Nome:', contratante.nome);
    console.log('- Tipo:', contratante.tipo);
    console.log('- Responsável CPF:', contratante.responsavel_cpf);
    console.log('');

    // Agora buscar os lotes
    const lotesResult = await query(
      `
      SELECT DISTINCT
        la.id,
        la.tipo,
        la.status,
        la.criado_em,
        la.liberado_em,
        u.nome as liberado_por_nome,
        COUNT(DISTINCT f.id) as total_funcionarios,
        COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN f.id END) as funcionarios_concluidos,
        COUNT(DISTINCT CASE WHEN a.status = 'inativada' THEN f.id END) as funcionarios_inativados,
        COUNT(DISTINCT CASE WHEN a.status NOT IN ('concluida', 'inativada') THEN f.id END) as funcionarios_pendentes
      FROM lotes_avaliacao la
      JOIN avaliacoes a ON a.lote_id = la.id
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      JOIN contratantes_funcionarios cf ON cf.funcionario_id = f.id
      LEFT JOIN usuarios u ON la.liberado_por = u.id
      WHERE cf.contratante_id = $1 AND cf.vinculo_ativo = true
      GROUP BY la.id, la.tipo, la.status, la.criado_em, la.liberado_em, u.nome
      ORDER BY la.criado_em DESC
    `,
      [contratante.id]
    );

    console.log(`Lotes de avaliação encontrados: ${lotesResult.rows.length}`);
    console.log('');

    if (lotesResult.rows.length > 0) {
      lotesResult.rows.forEach((lote, index) => {
        console.log(`Lote ${index + 1}:`);
        console.log(`- ID: ${lote.id}`);
        console.log(`- Código: ${lote.codigo}`);
        console.log(`- Título: ${lote.titulo}`);
        console.log(`- Tipo: ${lote.tipo}`);
        console.log(`- Status: ${lote.status}`);
        console.log(`- Criado em: ${lote.criado_em}`);
        console.log(`- Liberado em: ${lote.liberado_em || 'Não liberado'}`);
        console.log(`- Liberado por: ${lote.liberado_por_nome || 'N/A'}`);
        console.log(`- Total funcionários: ${lote.total_funcionarios}`);
        console.log(`- Concluídos: ${lote.funcionarios_concluidos}`);
        console.log(`- Inativados: ${lote.funcionarios_inativados}`);
        console.log(`- Pendentes: ${lote.funcionarios_pendentes}`);
        console.log('');
      });
    } else {
      console.log('Nenhum lote de avaliação encontrado para esta entidade.');
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

findContratanteELotes();
