import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/entidade/lotes
 *
 * Retorna lista de lotes da entidade (arquitetura segregada)
 *
 * Arquitetura (conforme diagrama TOMADOR):
 * - ENTIDADE -> Funcionários -> Avaliações -> Lote
 * - Schema: lotes_avaliacao.entidade_id referencia entidades(id)
 * - Constraint: lote tem clinica_id OU entidade_id (mutuamente exclusivos)
 * - Filtro direto: WHERE la.entidade_id = entidade_id
 *
 * Alinhado com API de Clínica: filtro simples na tabela de lotes.
 *
 * @returns {Object} { lotes: Array<Lote> }
 */
export async function GET() {
  try {
    // Verificar sessão e extrair entidade_id do gestor autenticado
    const session = await requireEntity();

    // Buscar lotes associados à entidade via entidade_id
    // Inclui informações de validação e laudos (igual à API da clínica)
    console.log(
      `[DEBUG /api/entidade/lotes] session=${JSON.stringify({ perfil: session.perfil, entidade_id: session.entidade_id })}`
    );

    let lotesResult;
    try {
      // Query alinhada com arquitetura: valida lote via funcionarios da entidade
      // Schema: lotes recebem entidade_id via migration 1008, mas usamos join para compatibilidade
      lotesResult = await query(
        `
        SELECT DISTINCT
          la.id,
          la.tipo,
          la.status,
          la.criado_em,
          la.liberado_em,
          f2.nome as liberado_por_nome,
          e.nome as empresa_nome,
          COUNT(DISTINCT a.id) as total_avaliacoes,
          COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN a.id END) as avaliacoes_concluidas,
          COUNT(DISTINCT CASE WHEN a.status = 'inativada' THEN a.id END) as avaliacoes_inativadas,
          -- Informações de laudo
          l.id as laudo_id,
          l.status as laudo_status,
          l.emitido_em as laudo_emitido_em,
          l.enviado_em as laudo_enviado_em,
          l.hash_pdf as laudo_hash,
          f3.nome as emissor_nome,
          -- Informações de solicitação de emissão
          fe.solicitado_por,
          fe.solicitado_em,
          fe.tipo_solicitante
        FROM lotes_avaliacao la
        INNER JOIN avaliacoes a ON a.lote_id = la.id
        INNER JOIN funcionarios f ON a.funcionario_cpf = f.cpf
        INNER JOIN funcionarios_entidades fe_join ON fe_join.funcionario_id = f.id
        LEFT JOIN entidades e ON fe_join.entidade_id = e.id
        LEFT JOIN funcionarios f2 ON la.liberado_por = f2.cpf
        LEFT JOIN laudos l ON l.lote_id = la.id
        LEFT JOIN funcionarios f3 ON l.emissor_cpf = f3.cpf
        LEFT JOIN v_fila_emissao fe ON fe.lote_id = la.id
        WHERE fe_join.entidade_id = $1 AND fe_join.ativo = true
        GROUP BY la.id, la.tipo, la.status, la.criado_em, la.liberado_em, f2.nome, e.nome,
                 l.id, l.status, l.emitido_em, l.enviado_em, l.hash_pdf, f3.nome,
                 fe.solicitado_por, fe.solicitado_em, fe.tipo_solicitante
        ORDER BY la.criado_em DESC
      `,
        [session.entidade_id]
      );
      console.log(
        `[DEBUG /api/entidade/lotes] query returned rows=${lotesResult.rowCount}`
      );
    } catch (err) {
      console.error(
        '[ERROR /api/entidade/lotes] query failed:',
        err,
        err instanceof Error ? err.stack : null
      );
      return NextResponse.json(
        { error: 'Erro ao buscar lotes' },
        { status: 500, headers: { 'X-Lotes-Error': 'query_failed' } }
      );
    }

    // Validar cada lote para determinar se pode emitir laudo
    const lotesComValidacao = await Promise.all(
      lotesResult.rows.map(async (lote) => {
        // Somente validar quando lote estiver concluído (evita chamadas desnecessárias em lotes 'ativo')
        if (lote.status !== 'concluido') {
          return {
            ...lote,
            pode_emitir_laudo: false,
            motivos_bloqueio: [],
            taxa_conclusao: 0,
          };
        }

        try {
          const validacaoRes = await query(
            `SELECT * FROM validar_lote_pre_laudo($1)`,
            [lote.id]
          );
          const validacao = validacaoRes.rows[0];

          return {
            ...lote,
            // Suporte robusto para variações no retorno da função SQL
            // Prioridade: valido > pode_emitir > pode_emitir_laudo
            pode_emitir_laudo: !!(
              validacao?.valido ??
              validacao?.pode_emitir ??
              validacao?.pode_emitir_laudo ??
              false
            ),
            // Motivos podem vir em 'alertas', 'motivos_bloqueio' ou 'motivos'
            motivos_bloqueio:
              validacao?.alertas ||
              validacao?.motivos_bloqueio ||
              validacao?.motivos ||
              [],
            // Taxa de conclusão pode estar no topo ou dentro de 'detalhes'
            taxa_conclusao:
              validacao?.taxa_conclusao ||
              validacao?.detalhes?.taxa_conclusao ||
              0,
          };
        } catch (error) {
          console.error(`Erro ao validar lote ${lote.id}:`, error);
          return {
            ...lote,
            pode_emitir_laudo: false,
            motivos_bloqueio: ['Erro ao validar lote'],
            taxa_conclusao: 0,
          };
        }
      })
    );

    const response = NextResponse.json({
      lotes: lotesComValidacao,
    });

    // Anexar contagem para debug remoto
    response.headers.set('X-Lotes-Count', String(lotesComValidacao.length));

    // Forçar sem cache
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, max-age=0'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error(
      '[ERROR /api/entidade/lotes GET] Erro ao buscar lotes:',
      error,
      error instanceof Error ? error.stack : null
    );
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
