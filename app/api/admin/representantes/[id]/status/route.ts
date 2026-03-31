/**
 * PATCH /api/admin/representantes/[id]/status
 * Admin atualiza status do representante.
 * Transições válidas definidas pelas regras de negócio.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { registrarAuditoria } from '@/lib/db/comissionamento';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Transições válidas: de → para
// Máquina simplificada: ativo → apto (direto, sem apto_pendente obrigatório)
// apto_pendente mantido como estado legado, mas admin pode pular direto para apto
const TRANSICOES_VALIDAS: Record<string, string[]> = {
  ativo: ['apto', 'apto_pendente', 'suspenso', 'desativado', 'rejeitado'],
  apto_pendente: ['apto', 'ativo', 'suspenso', 'desativado', 'rejeitado'],
  apto: ['suspenso', 'desativado'],
  apto_bloqueado: ['apto', 'suspenso', 'desativado', 'rejeitado'],
  suspenso: ['apto', 'ativo', 'desativado'],
  desativado: [], // terminal
  rejeitado: [], // terminal
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['comercial', 'suporte', 'admin'], false);
    const repId = parseInt(params.id, 10);
    if (isNaN(repId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const body = await request.json();
    const { novo_status, motivo } = body;

    const statusValidos = [
      'ativo',
      'apto_pendente',
      'apto',
      'apto_bloqueado',
      'suspenso',
      'desativado',
      'rejeitado',
    ];
    if (!novo_status || !statusValidos.includes(novo_status)) {
      return NextResponse.json(
        {
          error: `Status inválido. Valores aceitos: ${statusValidos.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Buscar status atual
    const repResult = await query(
      `SELECT id, status, nome FROM representantes WHERE id = $1 LIMIT 1`,
      [repId]
    );
    if (repResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );
    }

    const rep = repResult.rows[0];
    const statusAtual = rep.status as string;

    // Verificar se a transição é válida
    const transicoesPossiveis = TRANSICOES_VALIDAS[statusAtual] ?? [];
    if (!transicoesPossiveis.includes(novo_status)) {
      return NextResponse.json(
        {
          error: `Transição inválida: ${statusAtual} → ${novo_status}. Transições permitidas: ${transicoesPossiveis.join(', ') || 'nenhuma'}`,
        },
        { status: 422 }
      );
    }

    // Campos extras a atualizar conforme novo status
    const setClauses: string[] = ['status = $2', 'atualizado_em = NOW()'];
    const queryParams: unknown[] = [repId, novo_status];
    let qi = 3;

    if (novo_status === 'apto') {
      setClauses.push(`aprovado_em = NOW()`, `aprovado_por_cpf = $${qi++}`);
      queryParams.push(session.cpf);
    }

    const repAtualizado = await query(
      `UPDATE representantes SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
      queryParams,
      session // necessário para o trigger trg_auditar_representante_status usar app.current_user_cpf
    );

    // Efeitos colaterais por tipo de transição
    if (novo_status === 'apto') {
      // Liberar comissões retidas (status retida → pendente_nf)
      await query(
        `UPDATE comissoes_laudo
         SET status = 'pendente_nf', data_aprovacao = NOW()
         WHERE representante_id = $1 AND status = 'retida'`,
        [repId]
      );

      // Solicitar confirmação de dados bancários se ainda não foram confirmados
      await query(
        `UPDATE representantes
         SET dados_bancarios_status = 'pendente_confirmacao',
             dados_bancarios_solicitado_em = NOW(),
             atualizado_em = NOW()
         WHERE id = $1
           AND dados_bancarios_status = 'nao_informado'`,
        [repId]
      );
    }

    if (novo_status === 'suspenso') {
      // Congelar comissões em pendente_nf/nf_em_analise/liberada → congelada_rep_suspenso
      await query(
        `UPDATE comissoes_laudo
         SET status = 'congelada_rep_suspenso', motivo_congelamento = 'rep_suspenso'
         WHERE representante_id = $1 AND status IN ('pendente_nf', 'nf_em_analise', 'liberada')`,
        [repId]
      );
      // Suspender vínculos ativos
      await query(
        `UPDATE vinculos_comissao SET status = 'suspenso' WHERE representante_id = $1 AND status = 'ativo'`,
        [repId]
      );
    }

    if (novo_status === 'desativado') {
      // Encerrar todos os vínculos
      await query(
        `UPDATE vinculos_comissao
         SET status = 'encerrado', encerrado_em = NOW(), encerrado_motivo = 'Representante desativado'
         WHERE representante_id = $1 AND status IN ('ativo','inativo','suspenso')`,
        [repId]
      );
      // Cancelar comissões pendentes
      await query(
        `UPDATE comissoes_laudo
         SET status = 'cancelada'
         WHERE representante_id = $1 AND status IN ('retida','pendente_nf','nf_em_analise','congelada_rep_suspenso')`,
        [repId]
      );
    }

    // Restaurar ao reverter suspensão → ativo/apto
    if (
      (novo_status === 'ativo' || novo_status === 'apto') &&
      statusAtual === 'suspenso'
    ) {
      await query(
        `UPDATE vinculos_comissao SET status = 'ativo' WHERE representante_id = $1 AND status = 'suspenso'`,
        [repId]
      );
      await query(
        `UPDATE comissoes_laudo
         SET status = CASE WHEN $2::text = 'apto' THEN 'pendente_nf' ELSE 'retida' END,
             motivo_congelamento = NULL
         WHERE representante_id = $1 AND status = 'congelada_rep_suspenso'`,
        [repId, novo_status]
      );
    }

    // Registrar auditoria
    await registrarAuditoria({
      tabela: 'representantes',
      registro_id: repId,
      status_anterior: statusAtual,
      status_novo: novo_status,
      triggador: 'admin_action',
      motivo: motivo ?? null,
      criado_por_cpf: session.cpf,
    });

    return NextResponse.json({
      success: true,
      representante: repAtualizado.rows[0],
      motivo: motivo ?? null,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[PATCH /api/admin/representantes/[id]/status]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
