/**
 * API: Progresso de Emissão de Laudo
 *
 * Endpoint: GET /api/emissor/laudos/[loteId]/progresso
 *
 * Retorna o progresso atual da emissão de um laudo para exibição em tempo real.
 * Usado pelo hook useProgressoEmissao para polling.
 */

/* eslint-disable */
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';
import type {
  ProgressoEmissao,
  StatusEmissao,
} from '@/lib/hooks/useProgressoEmissao';

export async function GET(
  request: Request,
  { params }: { params: { loteId: string } }
) {
  try {
    const user = await requireAuth();
    const loteId = parseInt(params.loteId);

    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID de lote inválido' },
        { status: 400 }
      );
    }

    // Buscar status atual do lote e laudo
    const resultado = await query(
      `SELECT 
        la.id,
        la.status as status_lote,
        la.hash_pdf,
        l.id as laudo_id,
        l.status as status_laudo,
        l.emitido_em,
        l.enviado_em,
        fe.solicitado_em,
        al.acao as ultima_acao,
        al.criado_em as ultima_acao_em
      FROM lotes_avaliacao la
      LEFT JOIN laudos l ON la.id = l.lote_id
      LEFT JOIN fila_emissao fe ON la.id = fe.lote_id
      LEFT JOIN LATERAL (
        SELECT acao, criado_em
        FROM auditoria_laudos
        WHERE lote_id = la.id
        ORDER BY criado_em DESC
        LIMIT 1
      ) al ON true
      WHERE la.id = $1`,
      [loteId]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const dados = resultado.rows[0];

    // Determinar status e progresso
    const progresso = determinarProgresso(dados);

    return NextResponse.json(progresso);
  } catch (error) {
    console.error('[GET /api/emissor/laudos/[loteId]/progresso] Erro:', error);

    return NextResponse.json(
      {
        error: 'Erro ao buscar progresso',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * Determinar progresso baseado no estado do lote e laudo
 */
function determinarProgresso(dados: any): ProgressoEmissao {
  const {
    status_lote,
    status_laudo,
    laudo_id,
    hash_pdf,
    emitido_em,
    enviado_em,
    solicitado_em,
    ultima_acao,
  } = dados;

  // Estado inicial
  if (!solicitado_em && status_lote === 'concluido') {
    return {
      status: 'idle',
      mensagem: 'Aguardando solicitação de emissão',
      porcentagem: 0,
      etapa: 0,
      totalEtapas: 5,
    };
  }

  // Emissão solicitada
  if ((status_lote === 'emissao_solicitada' || solicitado_em) && !laudo_id) {
    return {
      status: 'solicitado',
      mensagem: 'Emissão solicitada - aguardando emissor',
      porcentagem: 20,
      etapa: 1,
      totalEtapas: 5,
    };
  }

  // Gerando PDF (lote em andamento)
  if (status_lote === 'emissao_em_andamento' && !hash_pdf) {
    return {
      status: 'gerando_pdf',
      mensagem: 'Gerando PDF do laudo...',
      porcentagem: 40,
      etapa: 2,
      totalEtapas: 5,
    };
  }

  // PDF gerado, enviando para storage
  if (hash_pdf && !emitido_em) {
    return {
      status: 'enviando_storage',
      mensagem: 'Enviando PDF para armazenamento...',
      porcentagem: 70,
      etapa: 3,
      totalEtapas: 5,
    };
  }

  // Laudo emitido
  if (status_laudo === 'emitido' || emitido_em) {
    return {
      status: 'finalizando',
      mensagem: 'Laudo emitido - finalizando processo',
      porcentagem: 95,
      etapa: 4,
      totalEtapas: 5,
    };
  }

  // Laudo enviado (concluído)
  if (status_laudo === 'enviado' || enviado_em) {
    return {
      status: 'concluido',
      mensagem: 'Emissão concluída com sucesso!',
      porcentagem: 100,
      etapa: 5,
      totalEtapas: 5,
    };
  }

  // Erro (verificar se há ação de erro na auditoria)
  if (ultima_acao?.includes('erro') || ultima_acao?.includes('falha')) {
    return {
      status: 'erro',
      mensagem: 'Erro durante a emissão',
      porcentagem: 0,
      etapa: 0,
      totalEtapas: 5,
      erro: 'Falha detectada no processo de emissão',
    };
  }

  // Estado desconhecido - retornar idle
  return {
    status: 'idle',
    mensagem: 'Status desconhecido',
    porcentagem: 0,
    etapa: 0,
    totalEtapas: 5,
  };
}
