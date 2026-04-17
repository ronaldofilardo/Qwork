/**
 * PATCH /api/admin/comissoes/[id]
 * Atualiza status de uma comissão.
 * Ações suporte: pagar, congelar, cancelar, descongelar (acesso total)
 * Ações comercial: congelar, cancelar, descongelar (sem pagar)
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { registrarAuditoria } from '@/lib/db/comissionamento';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Ações permitidas por perfil
const ACOES_SUPORTE = ['pagar', 'congelar', 'cancelar', 'descongelar'];
const ACOES_COMERCIAL = ['congelar', 'cancelar', 'descongelar'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['comercial', 'suporte'], false);
    const comissaoId = parseInt(params.id, 10);
    if (isNaN(comissaoId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const body = await request.json();
    const { acao, motivo, comprovante_path } = body;

    const acoesValidas = [...ACOES_SUPORTE, ...ACOES_COMERCIAL];
    if (!acao || !acoesValidas.includes(acao)) {
      return NextResponse.json(
        {
          error: `Ação inválida. Valores aceitos: ${acoesValidas.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Verificar se o perfil do usuário tem permissão para a ação solicitada
    if (session.perfil === 'suporte' && !ACOES_SUPORTE.includes(acao)) {
      return NextResponse.json(
        { error: `Perfil 'suporte' não tem permissão para a ação '${acao}'.` },
        { status: 403 }
      );
    }
    if (session.perfil === 'comercial' && !ACOES_COMERCIAL.includes(acao)) {
      return NextResponse.json(
        {
          error: `Perfil 'comercial' não tem permissão para a ação '${acao}'.`,
        },
        { status: 403 }
      );
    }

    const comissaoResult = await query(
      `SELECT c.*, r.nome AS representante_nome
       FROM comissoes_laudo c
       JOIN representantes r ON r.id = c.representante_id
       WHERE c.id = $1 LIMIT 1`,
      [comissaoId]
    );
    if (comissaoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Comissão não encontrada' },
        { status: 404 }
      );
    }
    const comissao = comissaoResult.rows[0];

    // Mapear ação → novo status e validações
    interface AcaoConfig {
      novoStatus: string;
      statusPermitidos: string[];
      exigirMotivo?: boolean;
      extraSet?: string;
      extraParam?: unknown;
    }
    const acaoMap: Record<string, AcaoConfig> = {
      pagar: {
        novoStatus: 'paga',
        statusPermitidos: ['liberada'],
        extraSet: ', data_pagamento = NOW()',
      },
      congelar: {
        novoStatus: 'congelada_aguardando_admin',
        statusPermitidos: ['retida', 'liberada'],
        exigirMotivo: true,
        extraSet: ', motivo_congelamento = $3',
      },
      cancelar: {
        novoStatus: 'cancelada',
        statusPermitidos: ['retida', 'liberada', 'congelada_aguardando_admin'],
      },
      descongelar: {
        novoStatus: 'retida',
        statusPermitidos: ['congelada_aguardando_admin'],
        extraSet: ', motivo_congelamento = NULL',
      },
    };

    const config = acaoMap[acao];
    if (!config.statusPermitidos.includes(comissao.status)) {
      return NextResponse.json(
        {
          error: `Ação '${acao}' não pode ser aplicada a comissão com status '${comissao.status}'.`,
        },
        { status: 422 }
      );
    }

    // F-08: liberar removido — liberação agora ocorre via ciclo mensal

    if (config.exigirMotivo && !motivo?.trim()) {
      return NextResponse.json(
        { error: `Motivo é obrigatório para a ação '${acao}'` },
        { status: 400 }
      );
    }

    const setClauses: string[] = [`status = $2`, `atualizado_em = NOW()`];
    const queryParams: unknown[] = [comissaoId, config.novoStatus];

    if (config.extraSet) {
      if (config.extraSet.includes('$3')) {
        queryParams.push(motivo ?? null);
      }
      setClauses.push(
        ...config.extraSet.replace(/^, /, '').split(', ').filter(Boolean)
      );
    }

    if (acao === 'pagar' && comprovante_path) {
      setClauses.push(
        `comprovante_pagamento_path = $${queryParams.length + 1}`
      );
      queryParams.push(comprovante_path);
    }

    const updated = await query(
      `UPDATE comissoes_laudo SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
      queryParams
    );

    // Registrar auditoria
    await registrarAuditoria({
      tabela: 'comissoes_laudo',
      registro_id: comissaoId,
      status_anterior: comissao.status,
      status_novo: config.novoStatus,
      triggador: 'admin_action',
      motivo: motivo ?? `Ação: ${acao}`,
      criado_por_cpf: session.cpf,
    });

    return NextResponse.json({
      success: true,
      comissao: updated.rows[0],
      acao,
      admin_cpf: session.cpf,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[PATCH /api/admin/comissoes/[id]]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
