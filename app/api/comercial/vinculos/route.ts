/**
 * POST /api/comercial/vinculos
 * Cria um novo vínculo atribuindo imediatamente um representante a uma
 * clínica ou entidade que ainda não possui vínculo algum.
 * Usado pelo VincularRepDrawer quando vinculo_id === null.
 * Auth: comercial | admin
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const CriarVinculoSchema = z
  .object({
    representante_id: z.number().int().positive(),
    clinica_id: z.number().int().positive().optional(),
    entidade_id: z.number().int().positive().optional(),
    valor_negociado: z.number().min(0).optional().nullable(),
    obs: z.string().max(500).optional(),
  })
  .refine((d) => !!(d.clinica_id ?? d.entidade_id), {
    message: 'Informe clinica_id ou entidade_id',
  });

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin'], false);

    const body = await request.json();
    const parsed = CriarVinculoSchema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );

    const data = parsed.data;

    // Verificar que o representante existe e está apto
    const rep = await query<{
      id: number;
      status: string;
      modelo_comissionamento: string | null;
    }>(
      `SELECT id, status, modelo_comissionamento
       FROM representantes WHERE id = $1 LIMIT 1`,
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

    // Verificar que o tomador existe
    if (data.clinica_id) {
      const clinica = await query(
        `SELECT id FROM clinicas WHERE id = $1 LIMIT 1`,
        [data.clinica_id]
      );
      if (clinica.rows.length === 0)
        return NextResponse.json(
          { error: 'Clínica não encontrada' },
          { status: 404 }
        );
    } else if (data.entidade_id) {
      const entidade = await query(
        `SELECT id FROM entidades WHERE id = $1 LIMIT 1`,
        [data.entidade_id]
      );
      if (entidade.rows.length === 0)
        return NextResponse.json(
          { error: 'Entidade não encontrada' },
          { status: 404 }
        );
    }

    // Verificar duplicidade: rep já vinculado ao mesmo tomador
    let dupCheck;
    if (data.clinica_id) {
      dupCheck = await query(
        `SELECT id FROM vinculos_comissao
         WHERE representante_id = $1 AND clinica_id = $2 LIMIT 1`,
        [data.representante_id, data.clinica_id]
      );
    } else {
      dupCheck = await query(
        `SELECT id FROM vinculos_comissao
         WHERE representante_id = $1 AND entidade_id = $2 LIMIT 1`,
        [data.representante_id, data.entidade_id]
      );
    }

    if (dupCheck.rows.length > 0)
      return NextResponse.json(
        { error: 'Este representante já possui vínculo com este tomador.' },
        { status: 409 }
      );

    // Criar vínculo
    const coluna = data.clinica_id ? 'clinica_id' : 'entidade_id';
    const valor = data.clinica_id ?? data.entidade_id;

    const novoVinculo = await query<{ id: number }>(
      `INSERT INTO vinculos_comissao
         (representante_id, ${coluna}, data_inicio, data_expiracao, status, valor_negociado)
       VALUES
         ($1, $2, NOW()::DATE, (NOW()::DATE + INTERVAL '1 year')::DATE, 'ativo', $3)
       RETURNING id`,
      [data.representante_id, valor, data.valor_negociado ?? null]
    );

    const vinculoId = novoVinculo.rows[0].id;

    // Auditoria
    const operadorCpf = (session as { cpf?: string }).cpf ?? '';
    await query(
      `INSERT INTO comissionamento_auditoria (
         tabela, registro_id, status_anterior, status_novo,
         triggador, motivo, dados_extras, criado_por_cpf
       ) VALUES (
         'vinculos_comissao', $1, NULL, 'ativo',
         'comercial', $2, $3::jsonb, $4
       )`,
      [
        vinculoId,
        data.obs ?? 'Vínculo criado retroativamente pelo Comercial',
        JSON.stringify({
          representante_id: data.representante_id,
          [coluna]: valor,
        }),
        operadorCpf,
      ]
    );

    return NextResponse.json({
      ok: true,
      vinculo_id: vinculoId,
      message: 'Vínculo criado e representante atribuído com sucesso.',
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Não autenticado' || e.message === 'Sem permissão')
      return NextResponse.json({ error: e.message }, { status: 403 });
    console.error('[POST /api/comercial/vinculos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
