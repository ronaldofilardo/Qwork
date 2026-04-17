/**
 * PATCH /api/comercial/vinculos/[id]/atribuir-rep
 * Atribui retroativamente um representante a um vínculo sem representante.
 * Valida e define o modelo de comissionamento para os laudos futuros.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const AtribuirRepSchema = z.object({
  representante_id: z.number().int().positive(),
  percentual_comissao: z.number().min(0).max(40).optional().nullable(),
  percentual_comissao_comercial: z
    .number()
    .min(0)
    .max(40)
    .optional()
    .nullable(),
  obs: z.string().max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRole(['comercial', 'admin'], false);

    const id = parseInt(params.id, 10);
    if (isNaN(id))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const body = await request.json();
    const parsed = AtribuirRepSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );

    const data = parsed.data;

    // Ownership check: comercial só pode atribuir representantes gerenciados por ele
    if (session.perfil === 'comercial') {
      const owned = await query<{ id: number }>(
        `SELECT 1 AS id FROM representantes WHERE id = $1 AND gestor_comercial_cpf = $2 LIMIT 1`,
        [data.representante_id, session.cpf]
      );
      if (owned.rows.length === 0) {
        return NextResponse.json(
          { error: 'Representante não encontrado' },
          { status: 404 }
        );
      }
    }

    // Verificar que o vínculo existe e está sem representante
    const vinculo = await query<{
      id: number;
      representante_id: number | null;
      status: string;
    }>(
      `SELECT id, representante_id, status FROM vinculos_comissao WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (vinculo.rows.length === 0)
      return NextResponse.json(
        { error: 'Vínculo não encontrado' },
        { status: 404 }
      );

    if (vinculo.rows[0].representante_id !== null)
      return NextResponse.json(
        {
          error:
            'Vínculo já possui representante. Use a rota de edição do representante.',
        },
        { status: 409 }
      );

    if (vinculo.rows[0].status === 'encerrado')
      return NextResponse.json(
        { error: 'Não é possível atribuir representante a vínculo encerrado' },
        { status: 422 }
      );

    // Verificar que o representante existe e está ativo
    const rep = await query<{
      id: number;
      status: string;
      modelo_comissionamento: string | null;
    }>(
      `SELECT id, status, modelo_comissionamento FROM representantes WHERE id = $1 LIMIT 1`,
      [data.representante_id]
    );

    if (rep.rows.length === 0)
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );

    if (!['apto', 'apto_bloqueado'].includes(rep.rows[0].status))
      return NextResponse.json(
        { error: 'Representante não está apto para receber vínculos' },
        { status: 422 }
      );

    // Atribuir representante
    await query(
      `UPDATE vinculos_comissao
       SET representante_id = $1, atualizado_em = NOW()
       WHERE id = $2`,
      [data.representante_id, id]
    );

    // Atualizar percentuais, se fornecidos
    if (
      data.percentual_comissao !== undefined ||
      data.percentual_comissao_comercial !== undefined
    ) {
      const fields: string[] = [];
      const vals: unknown[] = [];
      let idx = 1;
      if (data.percentual_comissao !== undefined) {
        fields.push(`percentual_comissao = $${idx++}`);
        vals.push(data.percentual_comissao);
      }
      if (data.percentual_comissao_comercial !== undefined) {
        fields.push(`percentual_comissao_comercial = $${idx++}`);
        vals.push(data.percentual_comissao_comercial);
      }
      if (fields.length > 0) {
        fields.push(`atualizado_em = NOW()`);
        vals.push(data.representante_id);
        await query(
          `UPDATE representantes SET ${fields.join(', ')} WHERE id = $${idx}`,
          vals
        );
      }
    }

    // Auditoria
    const operadorCpf = (session as { cpf?: string }).cpf ?? '';
    await query(
      `INSERT INTO comissionamento_auditoria (
         tabela, registro_id, status_anterior, status_novo,
         triggador, motivo, dados_extras, criado_por_cpf
       ) VALUES (
         'vinculos_comissao', $1, 'sem_representante', 'representante_atribuido',
         'comercial', $2, $3::jsonb, $4
       )`,
      [
        id,
        data.obs ?? 'Representante atribuído retroativamente pelo Comercial',
        JSON.stringify({ representante_id: data.representante_id }),
        operadorCpf,
      ]
    );

    return NextResponse.json({
      ok: true,
      message: 'Representante atribuído com sucesso ao vínculo.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[PATCH /api/comercial/vinculos/[id]/atribuir-rep]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
