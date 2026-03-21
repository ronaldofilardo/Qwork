/**
 * GET /api/vendedor/dados/bancarios
 *
 * Retorna os dados bancários do vendedor autenticado (somente leitura).
 * Edição é exclusiva do perfil 'suporte' via /api/suporte/vendedores/[id]/dados-bancarios.
 */
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

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
