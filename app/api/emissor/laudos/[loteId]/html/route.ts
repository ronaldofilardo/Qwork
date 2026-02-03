/**
 * API para retornar HTML de laudos (para geração client-side de PDFs)
 * Solução para fallback quando PDF não existe no storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireEmissor } from '@/lib/auth-require';
import { query } from '@/lib/db';
import {
  gerarDadosGeraisEmpresa,
  calcularScoresPorGrupo,
  gerarInterpretacaoRecomendacoes,
  gerarObservacoesConclusao,
} from '@/lib/laudo-calculos';
import { gerarHTMLLaudoCompleto } from '@/lib/templates/laudo-html';

// Helper para criar laudo padronizado
function criarLaudoPadronizado(
  dadosGerais: any,
  scores: any,
  interpretacao: any,
  observacoes: any
) {
  return {
    etapa1: dadosGerais,
    etapa2: scores,
    etapa3: interpretacao,
    etapa4: observacoes,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { loteId: string } }
) {
  try {
    // Verificar autenticação
    requireEmissor();
    const { loteId } = params;

    // Buscar dados do lote
    const loteResult = await query(
      `SELECT id, codigo, titulo, status, clinica_id, empresa_id
       FROM lotes_avaliacao
       WHERE id = $1`,
      [loteId]
    );

    if (loteResult.rows.length === 0) {
      console.log(`[404] Lote ${loteId} não encontrado`);
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];
    console.log(`[INFO] Lote encontrado: ${lote.id} - ${lote.titulo}`);

    // Verificar se já existe laudo emitido
    const laudoResult = await query(
      `SELECT id, hash_pdf, status, emitido_em, emissor_cpf
       FROM laudos
       WHERE lote_id = $1`,
      [loteId]
    );

    if (laudoResult.rows.length === 0) {
      console.log(`[404] Laudo não emitido para lote ${loteId}`);
      return NextResponse.json(
        { error: 'Laudo ainda não foi emitido para este lote' },
        { status: 404 }
      );
    }

    const laudo = laudoResult.rows[0];
    console.log(
      `[INFO] Laudo encontrado: ${laudo.id} - status: ${laudo.status}`
    );

    // Buscar avaliações finalizadas do lote
    const avaliacoesResult = await query(
      `SELECT 
        a.id,
        a.funcionario_cpf,
        a.status,
        f.nome as funcionario_nome,
        f.funcao,
        f.setor,
        (
          SELECT json_agg(
            json_build_object(
              'grupo', r.grupo,
              'item', r.item,
              'valor', r.valor
            )
            ORDER BY r.grupo, r.item
          )
          FROM respostas r
          WHERE r.avaliacao_id = a.id
        ) as respostas
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      WHERE a.lote_id = $1 AND a.status = 'concluida'
      ORDER BY f.nome`,
      [loteId]
    );

    if (avaliacoesResult.rows.length === 0) {
      console.log(`[404] Nenhuma avaliação concluída para lote ${loteId}`);
      return NextResponse.json(
        { error: 'Nenhuma avaliação concluída encontrada para este lote' },
        { status: 404 }
      );
    }

    console.log(
      `[INFO] ${avaliacoesResult.rows.length} avaliações finalizadas encontradas`
    );

    // Gerar dados do laudo seguindo a mesma lógica de laudo-auto.ts
    const dadosGeraisEmpresa = await gerarDadosGeraisEmpresa(lote.id);

    const scoresPorGrupo = await calcularScoresPorGrupo(lote.id);
    const interpretacaoRecomendacoes = gerarInterpretacaoRecomendacoes(
      dadosGeraisEmpresa.empresaAvaliada,
      scoresPorGrupo
    );
    const observacoesConclusao = gerarObservacoesConclusao('');

    const laudoPadronizado = criarLaudoPadronizado(
      dadosGeraisEmpresa,
      scoresPorGrupo,
      interpretacaoRecomendacoes,
      observacoesConclusao
    );

    // Gerar HTML do laudo
    const htmlContent = gerarHTMLLaudoCompleto(laudoPadronizado);

    // Retornar HTML com headers apropriados
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Laudo-Id': String(laudo.id),
        'X-Lote-Id': String(loteId),
        'Cache-Control': 'public, max-age=3600', // Cache 1 hora
      },
    });
  } catch (error) {
    console.error('Erro ao gerar HTML do laudo:', error);
    return NextResponse.json(
      {
        error: 'Erro ao gerar HTML do laudo',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
