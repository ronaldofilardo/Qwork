/**
 * PATCH /api/admin/representantes/[id]/atribuir-comercial
 *
 * Atribui (ou remove) um usuário comercial como gestor de um representante.
 * Apenas admin pode executar.
 *
 * Body: { cpf_comercial: string | null }
 *   - string: CPF de um usuário ativo com tipo_usuario = 'comercial'
 *   - null: remove atribuição (representante passa a ser visível só para admin)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  cpf_comercial: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve conter exatamente 11 dígitos numéricos')
    .nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['admin'], false);

    const representanteId = parseInt(params.id, 10);
    if (isNaN(representanteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { cpf_comercial } = parsed.data;

    // Verificar que o representante existe
    const repCheck = await query<{ id: number; nome: string }>(
      `SELECT id, nome FROM representantes WHERE id = $1 LIMIT 1`,
      [representanteId]
    );
    if (repCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );
    }

    // Se CPF informado, validar que o usuário comercial existe e está ativo
    if (cpf_comercial !== null) {
      const comercialCheck = await query<{ cpf: string }>(
        `SELECT cpf FROM usuarios
         WHERE cpf = $1 AND tipo_usuario = 'comercial' AND ativo = true
         LIMIT 1`,
        [cpf_comercial]
      );
      if (comercialCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Usuário comercial não encontrado ou inativo' },
          { status: 422 }
        );
      }
    }

    await query(
      `UPDATE representantes
       SET gestor_comercial_cpf = $1, atualizado_em = NOW()
       WHERE id = $2`,
      [cpf_comercial, representanteId]
    );

    console.info(
      JSON.stringify({
        event: 'representante_gestor_comercial_atribuido',
        representante_id: representanteId,
        representante_nome: repCheck.rows[0].nome,
        cpf_comercial,
        by_cpf: session.cpf,
      })
    );

    return NextResponse.json({
      success: true,
      representante_id: representanteId,
      gestor_comercial_cpf: cpf_comercial,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error(
      '[PATCH /api/admin/representantes/[id]/atribuir-comercial]',
      e
    );
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
