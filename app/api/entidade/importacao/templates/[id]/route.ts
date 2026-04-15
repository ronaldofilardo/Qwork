import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const PatchBodySchema = z.object({
  nivelCargoMap: z.record(z.string(), z.string()),
});

/**
 * DELETE /api/entidade/importacao/templates/[id]
 * Remove um template. Verifica que pertence ao usuário autenticado nesta entidade.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireEntity();

    const templateId = Number(params.id);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const result = await queryAsGestorEntidade(
      `DELETE FROM importacao_templates
       WHERE id = $1
         AND entidade_id = $2
         AND criado_por_cpf = $3
       RETURNING id`,
      [templateId, session.entidade_id, session.cpf]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template não encontrado ou acesso negado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    console.error('[templates/entidade] DELETE error:', err);
    return NextResponse.json(
      { error: 'Erro ao deletar template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/entidade/importacao/templates/[id]
 * Mescla novas classificações de nivel_cargo_map em um template existente.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireEntity();

    const templateId = Number(params.id);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }

    const parsed = PatchBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { nivelCargoMap } = parsed.data;

    const result = await queryAsGestorEntidade(
      `UPDATE importacao_templates
       SET nivel_cargo_map = COALESCE(nivel_cargo_map, '{}'::jsonb) || $1::jsonb
       WHERE id = $2
         AND entidade_id = $3
         AND criado_por_cpf = $4
       RETURNING id`,
      [
        JSON.stringify(nivelCargoMap),
        templateId,
        session.entidade_id,
        session.cpf,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Template não encontrado ou acesso negado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes('Não autenticado')) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    console.error('[templates/entidade] PATCH error:', err);
    return NextResponse.json(
      { error: 'Erro ao atualizar template' },
      { status: 500 }
    );
  }
}
