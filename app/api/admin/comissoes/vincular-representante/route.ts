/**
 * POST /api/admin/comissoes/vincular-representante
 * Admin vincula um representante (por id numérico) a uma entidade.
 * Usado quando o card de pagamento não tem representante associado.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import {
  vincularRepresentantePorId,
  autoConvertirLeadPorCnpj,
} from '@/lib/db/comissionamento';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin', 'suporte', 'comercial'], false);
    const body = await request.json();

    const { representante_id, entidade_id, clinica_id, valor_negociado, cnpj } =
      body;

    const repIdNum = Number(representante_id);
    if (!Number.isFinite(repIdNum) || (!entidade_id && !clinica_id)) {
      return NextResponse.json(
        {
          error:
            'Campos obrigatórios: representante_id (número) e (entidade_id ou clinica_id)',
        },
        { status: 400 }
      );
    }

    const result = await vincularRepresentantePorId(
      repIdNum,
      entidade_id,
      clinica_id
    );

    if (!result) {
      return NextResponse.json(
        {
          error: 'Representante não encontrado ou inativo para o id informado.',
        },
        { status: 404 }
      );
    }

    // Atualizar valor_negociado no vínculo se fornecido
    if (valor_negociado != null && result.vinculo_id) {
      try {
        await query(
          `UPDATE vinculos_comissao SET valor_negociado = $1 WHERE id = $2`,
          [valor_negociado, result.vinculo_id]
        );
      } catch {
        // Non-critical: log but continue
        console.warn(
          '[vincular-representante] Falha ao atualizar valor_negociado'
        );
      }
    }

    // Converter leads pendentes por CNPJ (não-bloqueante)
    if (cnpj) {
      try {
        await autoConvertirLeadPorCnpj(
          cnpj,
          entidade_id ?? null,
          clinica_id ?? null
        );
      } catch {
        console.warn(
          '[vincular-representante] Falha ao converter leads por CNPJ'
        );
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    console.error('[POST /api/admin/comissoes/vincular-representante]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
