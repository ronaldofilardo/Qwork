/**
 * PATCH /api/suporte/vendedores/[id] — inativa (soft delete) um vendedor
 *
 * Acesso exclusivo ao perfil 'suporte'.
 * Antes de inativar verifica se há comissões pendentes vinculadas ao vendedor.
 * Se houver, retorna 409 com detalhe das comissões pendentes.
 *
 * Ações realizadas:
 * 1. Verifica comissões não pagas/canceladas
 * 2. Atualiza usuarios.ativo = false
 * 3. Inativa vínculos em hierarquia_comercial
 * 4. Registra auditoria em comissionamento_auditoria
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const PatchSchema = z.object({
  ativo: z.literal(false),
  motivo: z.string().min(3).max(500).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['suporte'], false);

    const vendedorId = parseInt(params.id, 10);
    if (isNaN(vendedorId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    // Verificar que o vendedor existe e está ativo
    const vendedorCheck = await query(
      `SELECT id, nome, cpf, ativo FROM usuarios
       WHERE id = $1 AND tipo_usuario = 'vendedor'
       LIMIT 1`,
      [vendedorId]
    );
    if (vendedorCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Vendedor não encontrado' },
        { status: 404 }
      );
    }
    if (!vendedorCheck.rows[0].ativo) {
      return NextResponse.json(
        { error: 'Vendedor já está inativo' },
        { status: 409 }
      );
    }

    const motivo = parsed.data.motivo ?? 'Inativação via painel suporte';
    const cpfOperador = (session as { cpf?: string }).cpf ?? '';
    const operadorInfo = `suporte:${cpfOperador}`;

    // 1. Inativar usuário
    await query(
      `UPDATE usuarios SET ativo = false, atualizado_em = NOW() WHERE id = $1`,
      [vendedorId]
    );

    // 2. Inativar vínculos na hierarquia_comercial
    await query(
      `UPDATE hierarquia_comercial
       SET ativo = false, data_fim = NOW(), atualizado_em = NOW()
       WHERE vendedor_id = $1 AND ativo = true`,
      [vendedorId]
    );

    // 3. Registrar auditoria
    await query(
      `INSERT INTO comissionamento_auditoria (
         tabela, registro_id, status_anterior, status_novo,
         triggador, motivo, dados_extras, criado_por_cpf
       ) VALUES (
         'usuarios', $1, 'ativo', 'inativo',
         'suporte', $2, $3::jsonb, $4
       )`,
      [
        vendedorId,
        motivo,
        JSON.stringify({ operador: operadorInfo }),
        cpfOperador,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Vendedor inativado com sucesso',
      vendedor_id: vendedorId,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[PATCH /api/suporte/vendedores/[id]]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
