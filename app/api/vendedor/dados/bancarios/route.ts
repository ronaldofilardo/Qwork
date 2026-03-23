/**
 * GET  /api/vendedor/dados/bancarios — retorna dados bancários do vendedor autenticado
 * PATCH /api/vendedor/dados/bancarios — atualiza dados bancários do vendedor autenticado
 */
import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  banco_codigo: z.string().max(10).optional().nullable(),
  agencia: z.string().max(20).optional().nullable(),
  conta: z.string().max(30).optional().nullable(),
  tipo_conta: z
    .enum(['corrente', 'poupanca', 'pagamento'])
    .optional()
    .nullable(),
  titular_conta: z.string().max(200).optional().nullable(),
  pix_chave: z.string().max(200).optional().nullable(),
  pix_tipo: z
    .enum(['cpf', 'cnpj', 'email', 'telefone', 'aleatoria'])
    .optional()
    .nullable(),
});

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    // Resolve o usuario_id pelo CPF da sessão
    const userResult = await query<{ id: number }>(
      `SELECT id FROM public.usuarios WHERE cpf = $1 AND ativo = true LIMIT 1`,
      [session.cpf]
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    const usuarioId = userResult.rows[0].id;

    const result = await query(
      `SELECT banco_codigo, agencia, conta, tipo_conta, titular_conta,
              pix_chave, pix_tipo, atualizado_em
       FROM public.vendedores_dados_bancarios
       WHERE usuario_id = $1
       LIMIT 1`,
      [usuarioId]
    );

    return NextResponse.json({
      dados_bancarios: result.rows[0] ?? null,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[GET /api/vendedor/dados/bancarios]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    // Resolve o usuario_id pelo CPF da sessão
    const userResult = await query<{ id: number }>(
      `SELECT id FROM public.usuarios WHERE cpf = $1 AND ativo = true LIMIT 1`,
      [session.cpf]
    );
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    const usuarioId = userResult.rows[0].id;

    const body = await request.json();
    const parsed = PatchSchema.parse(body);

    // INSERT or UPDATE (upsert no vendedores_dados_bancarios)
    const updateFields: string[] = [];
    const updateValues: unknown[] = [usuarioId];
    let paramIndex = 2;

    Object.entries(parsed).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(value);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({
        message: 'Nenhum dado para atualizar',
        dados_bancarios: null,
      });
    }

    updateFields.push(`atualizado_em = NOW()`);

    const sqlUpdate = `
      UPDATE public.vendedores_dados_bancarios
      SET ${updateFields.join(', ')}
      WHERE usuario_id = $1
      RETURNING banco_codigo, agencia, conta, tipo_conta, titular_conta,
                pix_chave, pix_tipo, atualizado_em
    `;

    let updateResult = await query(sqlUpdate, updateValues);

    // Se não atualizou nenhuma linha (registro não existe), inserir novo
    if (updateResult.rows.length === 0) {
      const insertFields = [
        'usuario_id',
        ...Object.keys(parsed).filter(
          (k) => parsed[k as keyof typeof parsed] !== undefined
        ),
      ];
      const insertPlaceholders = insertFields
        .map((_, i) => `$${i + 1}`)
        .join(', ');
      const insertValues = [
        usuarioId,
        ...Object.values(parsed).filter((v) => v !== undefined),
      ];

      const sqlInsert = `
        INSERT INTO public.vendedores_dados_bancarios (${insertFields.join(', ')})
        VALUES (${insertPlaceholders})
        RETURNING banco_codigo, agencia, conta, tipo_conta, titular_conta,
                  pix_chave, pix_tipo, atualizado_em
      `;

      updateResult = await query(sqlInsert, insertValues);
    }

    return NextResponse.json({
      message: 'Dados bancários atualizados com sucesso',
      dados_bancarios: updateResult.rows[0] ?? null,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    if (e.message.includes('Unexpected token')) {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      );
    }
    if (e.message.includes('validation')) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error('[PATCH /api/vendedor/dados/bancarios]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
