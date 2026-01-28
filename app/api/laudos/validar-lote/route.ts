import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * API: Validar Lote Pré-Laudo
 * GET /api/laudos/validar-lote?lote_id=123
 *
 * Verifica se o lote está pronto para gerar laudo:
 * - Valida se índice está completo (todos funcionários elegíveis foram incluídos)
 * - Detecta anomalias (inativações excessivas, pendências críticas)
 * - Retorna alertas e recomendações antes da emissão
 */
export async function GET(req: Request) {
  try {
    const user = await requireAuth();

    // Apenas emissor, RH e admin podem validar laudos
    if (!['emissor', 'rh', 'admin'].includes(user.perfil)) {
      return NextResponse.json(
        {
          error:
            'Acesso negado. Apenas emissores, RH e admin podem validar laudos.',
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const lote_id = searchParams.get('lote_id');

    if (!lote_id) {
      return NextResponse.json(
        { error: 'ID do lote é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados básicos do lote
    const loteResult = await query(
      `SELECT 
        la.id, 
        la.codigo,
        la.numero_ordem,
        la.titulo,
        la.tipo,
        la.status,
        la.empresa_id,
        la.liberado_em,
        ec.nome AS empresa_nome,
        c.nome AS clinica_nome
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      JOIN clinicas c ON ec.clinica_id = c.id
      WHERE la.id = $1`,
      [lote_id]
    );

    if (loteResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // Validar lote usando função PostgreSQL
    const validacaoResult = await query(
      `SELECT * FROM validar_lote_pre_laudo($1)`,
      [lote_id]
    );

    const validacao = validacaoResult.rows[0];

    // Detectar anomalias na empresa
    const anomaliasResult = await query(
      `SELECT * FROM detectar_anomalias_indice($1)`,
      [lote.empresa_id]
    );

    const anomalias = anomaliasResult.rows;

    // Filtrar anomalias relacionadas aos funcionários do lote
    const cpfsDolote = await query(
      `SELECT DISTINCT funcionario_cpf FROM avaliacoes WHERE lote_id = $1`,
      [lote_id]
    );
    const cpfsSet = new Set(cpfsDolote.rows.map((r: any) => r.funcionario_cpf));
    const anomaliasDoLote = anomalias.filter((a: any) =>
      cpfsSet.has(a.funcionario_cpf)
    );

    // Montar resposta com recomendações
    const recomendacoes = [];

    // Não consideramos taxa de conclusão nem anomalias críticas como condição obrigatória para emissão.
    // Em vez disso, reportamos como métricas e alertas para o emissor avaliar.

    if (validacao.funcionarios_pendentes > 0) {
      recomendacoes.push({
        tipo: 'PENDÊNCIA',
        severidade: 'ALTA',
        mensagem: `${validacao.funcionarios_pendentes} funcionário(s) elegíveis não foram incluídos neste lote.`,
        acao: 'Considere criar um lote complementar ou aguardar o próximo lote regular para incluí-los.',
      });
    }

    if (anomaliasDoLote.length > 0) {
      const criticas = anomaliasDoLote.filter(
        (a: any) => a.severidade === 'CRÍTICA'
      ).length;
      const altas = anomaliasDoLote.filter(
        (a: any) => a.severidade === 'ALTA'
      ).length;

      recomendacoes.push({
        tipo: 'ANOMALIA',
        severidade: 'MÉDIA',
        mensagem: `${anomaliasDoLote.length} anomalia(s) detectada(s) no histórico de avaliações (${criticas} críticas, ${altas} altas).`,
        acao: 'Revise os funcionários com padrões suspeitos. Anomalias são relatadas como alertas, não bloqueiam a emissão de laudo.',
      });
    }

    const taxaConclusao = validacao.detalhes?.taxa_conclusao || 0;
    // Taxa de conclusão é informativa: não impede emissão, apenas recomenda atenção
    recomendacoes.push({
      tipo: 'MÉTRICA',
      severidade: 'INFO',
      mensagem: `Taxa de conclusão: ${taxaConclusao.toFixed(2)}% (métrica informativa).`,
      acao: 'Use como referência; não é critério obrigatório para emissão de laudo.',
    });

    if (validacao.alertas && validacao.alertas.length > 0) {
      validacao.alertas.forEach((alerta: string) => {
        recomendacoes.push({
          tipo: 'ALERTA',
          severidade: alerta.includes('ERRO')
            ? 'CRÍTICA'
            : alerta.includes('ATENÇÃO')
              ? 'ALTA'
              : 'MÉDIA',
          mensagem: alerta,
          acao: 'Revise conforme descrito no alerta.',
        });
      });
    }

    const bloqueante = validacao.bloqueante || false;

    return NextResponse.json(
      {
        // 'valido' indica se o lote possui condições básicas para emissão (sem bloqueios severos)
        valido: !bloqueante,
        // `pode_emitir` é true se não houver bloqueios críticos; warnings não impedem emissão imediata
        pode_emitir: !bloqueante,
        bloqueante,
        lote: {
          id: lote.id,
          codigo: lote.codigo,
          numero_ordem: lote.numero_ordem,
          titulo: lote.titulo,
          empresa: lote.empresa_nome,
          clinica: lote.clinica_nome,
          liberado_em: lote.liberado_em,
        },
        validacao: {
          total_avaliacoes: validacao.detalhes?.total_avaliacoes || 0,
          avaliacoes_concluidas: validacao.detalhes?.avaliacoes_concluidas || 0,
          avaliacoes_inativadas: validacao.detalhes?.avaliacoes_inativadas || 0,
          funcionarios_pendentes: validacao.funcionarios_pendentes || 0,
          taxa_conclusao: validacao.detalhes?.taxa_conclusao || 0,
        },
        anomalias: {
          total: anomalias.length,
          do_lote: anomaliasDoLote.length,
          criticas: anomaliasDoLote.filter(
            (a: any) => a.severidade === 'CRÍTICA'
          ).length,
          altas: anomaliasDoLote.filter((a: any) => a.severidade === 'ALTA')
            .length,
          detalhes: anomaliasDoLote.slice(0, 5), // Primeiras 5 anomalias
        },
        recomendacoes,
        mensagem: bloqueante
          ? '⚠️ Lote possui bloqueios críticos que impedem emissão automática.'
          : '✅ Lote validado com sucesso. Verifique alertas e métricas antes de emitir.',
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao validar lote pré-laudo:', error);
    return NextResponse.json(
      { error: 'Erro interno ao validar lote' },
      { status: 500 }
    );
  }
}
