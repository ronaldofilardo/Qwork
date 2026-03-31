/**
 * POST /api/representante/equipe/vendedores/[id]/reativar
 * Reativa um vendedor anteriormente inativado pelo representante logado.
 * Auth: representante (rep-session ou bps-session com perfil representante)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import type { Session } from '@/lib/session';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  motivo: z.string().min(5).max(500).trim(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const sess = requireRepresentante();

    const vendedorId = parseInt(params.id, 10);
    if (isNaN(vendedorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }
    const { motivo } = parsed.data;

    const rlsSess: Session = {
      cpf: sess.cpf ?? '',
      nome: sess.nome,
      perfil: 'representante',
      representante_id: sess.representante_id,
    };

    // Verificar que o vínculo existe (pode estar inativo) e pertence a este representante
    const vinculo = await query<{
      id: number;
      ativo: boolean;
      vendedor_nome: string;
      vendedor_cpf: string;
      usuario_ativo: boolean;
    }>(
      `SELECT hc.id, hc.ativo,
              u.nome AS vendedor_nome,
              u.cpf  AS vendedor_cpf,
              u.ativo AS usuario_ativo
       FROM hierarquia_comercial hc
       JOIN usuarios u ON u.id = hc.vendedor_id
       WHERE hc.vendedor_id = $1 AND hc.representante_id = $2
       LIMIT 1`,
      [vendedorId, sess.representante_id],
      rlsSess
    );

    if (vinculo.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vínculo com este vendedor não encontrado' },
        { status: 404 }
      );
    }

    const v = vinculo.rows[0];

    if (v.ativo && v.usuario_ativo) {
      return NextResponse.json(
        { error: 'Vendedor já está ativo' },
        { status: 409 }
      );
    }

    const { vendedor_nome, vendedor_cpf } = v;

    // Reativar usuário
    await query(
      `UPDATE usuarios SET ativo = true, atualizado_em = NOW() WHERE id = $1`,
      [vendedorId],
      rlsSess
    );

    // Reativar vínculo na hierarquia_comercial
    await query(
      `UPDATE hierarquia_comercial
       SET ativo = true, data_fim = NULL, atualizado_em = NOW()
       WHERE vendedor_id = $1 AND representante_id = $2`,
      [vendedorId, sess.representante_id],
      rlsSess
    );

    // Auditoria
    const cpfOperador = (sess.cpf ?? '').replace(/\D/g, '').substring(0, 11);
    await query(
      `INSERT INTO comissionamento_auditoria (
         tabela, registro_id, status_anterior, status_novo,
         triggador, motivo, dados_extras, criado_por_cpf
       ) VALUES (
         'usuarios', $1, 'inativo', 'ativo',
         'representante', $2, $3::jsonb, $4
       )`,
      [
        vendedorId,
        motivo,
        JSON.stringify({ representante_id: sess.representante_id, vendedor_cpf }),
        cpfOperador,
      ],
      rlsSess
    );

    return NextResponse.json({
      success: true,
      message: `Vendedor ${vendedor_nome} reativado com sucesso`,
      vendedor_id: vendedorId,
    });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error('[POST /api/representante/equipe/vendedores/[id]/reativar]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
