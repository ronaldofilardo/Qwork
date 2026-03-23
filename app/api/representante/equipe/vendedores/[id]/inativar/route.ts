/**
 * POST /api/representante/equipe/vendedores/[id]/inativar
 *
 * Soft delete de vendedor iniciado pelo próprio Representante.
 * Só pode inativar vendedores da sua própria equipe (hierarquia_comercial).
 *
 * Regras:
 * 1. Vendedor deve estar vinculado ao representante autenticado (ativo = true)
 * 2. Não deve haver comissões pendentes (status NOT IN 'paga', 'cancelada')
 * 3. Se tudo OK: inativa usuário + vínculo na hierarquia + registra auditoria
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

    const bodyRaw = await request.json().catch(() => null);
    const parsed = BodySchema.safeParse(bodyRaw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Motivo inválido (mínimo 5 caracteres)',
          details: parsed.error.flatten(),
        },
        { status: 422 }
      );
    }

    const { motivo } = parsed.data;

    // RLS session com perfil representante
    const rlsSess: Session = {
      cpf: sess.cpf ?? '',
      nome: sess.nome,
      perfil: 'representante',
      representante_id: sess.representante_id,
    };

    {
      // 1. Verificar vínculo ativo
      const vinculo = await query<{
        id: number;
        vendedor_nome: string;
        vendedor_cpf: string;
      }>(
        `SELECT hc.id, u.nome AS vendedor_nome, u.cpf AS vendedor_cpf
       FROM hierarquia_comercial hc
       JOIN usuarios u ON u.id = hc.vendedor_id AND u.ativo = true
       WHERE hc.vendedor_id = $1
         AND hc.representante_id = $2
         AND hc.ativo = true
       LIMIT 1`,
        [vendedorId, sess.representante_id],
        rlsSess
      );

      if (vinculo.rows.length === 0) {
        return NextResponse.json(
          { error: 'Vendedor não encontrado ou não pertence à sua equipe' },
          { status: 404 }
        );
      }

      const { vendedor_nome, vendedor_cpf } = vinculo.rows[0];

      // 2. Verificar comissões pendentes
      const pendentes = await query<{ total: string }>(
        `SELECT COUNT(*) AS total
       FROM comissoes_laudo cl
       JOIN vinculos_comissao vc ON vc.id = cl.vinculo_id
       WHERE vc.representante_id = $1
         AND vc.lead_id IN (
           SELECT id FROM leads_representante WHERE vendedor_id = $2
         )
         AND cl.status NOT IN ('paga', 'cancelada')`,
        [sess.representante_id, vendedorId],
        rlsSess
      );

      const totalPendente = parseInt(pendentes.rows[0]?.total ?? '0', 10);
      if (totalPendente > 0) {
        return NextResponse.json(
          {
            error: 'Vendedor possui comissões pendentes',
            detail: `Existem ${totalPendente} comissão(ões) não quitadas. Regularize antes de inativar.`,
            code: 'COMISSOES_PENDENTES',
            total_pendente: totalPendente,
          },
          { status: 409 }
        );
      }

      // 3. Inativar usuário
      await query(
        `UPDATE usuarios SET ativo = false, atualizado_em = NOW() WHERE id = $1`,
        [vendedorId],
        rlsSess
      );

      // 4. Inativar vínculo na hierarquia
      await query(
        `UPDATE hierarquia_comercial
       SET ativo = false, data_fim = NOW(), atualizado_em = NOW()
       WHERE vendedor_id = $1 AND representante_id = $2 AND ativo = true`,
        [vendedorId, sess.representante_id],
        rlsSess
      );

      // 5. Auditoria
      const cpfOperador = (sess.cpf ?? '').replace(/\D/g, '').substring(0, 11);
      await query(
        `INSERT INTO comissionamento_auditoria (
         tabela, registro_id, status_anterior, status_novo,
         triggador, motivo, dados_extras, criado_por_cpf
       ) VALUES (
         'usuarios', $1, 'ativo', 'inativo',
         'representante', $2, $3::jsonb, $4
       )`,
        [
          vendedorId,
          motivo,
          JSON.stringify({
            representante_id: sess.representante_id,
            vendedor_cpf,
          }),
          cpfOperador,
        ],
        rlsSess
      );

      return NextResponse.json({
        success: true,
        message: `Vendedor ${vendedor_nome} inativado com sucesso`,
        vendedor_id: vendedorId,
      });
    }
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    if (r.status !== 500)
      return NextResponse.json(r.body, { status: r.status });
    console.error(
      '[POST /api/representante/equipe/vendedores/[id]/inativar]',
      e
    );
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
