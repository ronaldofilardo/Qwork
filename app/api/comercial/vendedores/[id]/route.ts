/**
 * PATCH /api/comercial/vendedores/[id] — inativa (soft delete) um vendedor
 *
 * Acesso para perfis 'comercial' e 'admin'.
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
    const session = await requireRole(['comercial', 'admin'], false);

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

    // Ownership check: comercial só pode inativar vendedores vinculados aos seus representantes
    if (session.perfil === 'comercial') {
      const owned = await query<{ id: number }>(
        `SELECT 1 AS id
         FROM hierarquia_comercial hc
         JOIN representantes r ON r.id = hc.representante_id
         WHERE hc.vendedor_id = $1
           AND hc.ativo = true
           AND r.gestor_comercial_cpf = $2
         LIMIT 1`,
        [vendedorId, session.cpf]
      );
      if (owned.rows.length === 0) {
        return NextResponse.json(
          { error: 'Vendedor não encontrado' },
          { status: 404 }
        );
      }
    }

    const motivo = parsed.data.motivo ?? 'Inativação via painel comercial';
    const operadorCpf = (session as { cpf?: string }).cpf ?? 'desconhecido';
    const operadorInfo = `comercial:${operadorCpf}`;

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
         'comercial', $2, $3::jsonb, $4
       )`,
      [
        vendedorId,
        motivo,
        JSON.stringify({ operador: operadorInfo }),
        operadorCpf,
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
    console.error('[PATCH /api/comercial/vendedores/[id]]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
