/**
 * POST /api/vendedor/aceitar-termos
 *
 * Registra o aceite de um dos documentos obrigatórios no portal do vendedor.
 * Chamado no fluxo de primeiro acesso após criação de senha.
 *
 * Body: { tipo: 'contrato_nao_clt' | 'politica_privacidade' | 'termos_uso' }
 *
 * Mapeamento banco (vendedores_perfil):
 *   contrato_nao_clt     → aceite_disclaimer_nv / aceite_disclaimer_nv_em
 *   politica_privacidade → aceite_politica_privacidade / aceite_politica_privacidade_em
 *   termos_uso           → aceite_termos / aceite_termos_em
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  tipo: z.enum(['contrato_nao_clt', 'politica_privacidade', 'termos_uso']),
});

const COLUNA_MAP: Record<
  'contrato_nao_clt' | 'politica_privacidade' | 'termos_uso',
  { campo: string; campo_em: string }
> = {
  contrato_nao_clt: {
    campo: 'aceite_disclaimer_nv',
    campo_em: 'aceite_disclaimer_nv_em',
  },
  politica_privacidade: {
    campo: 'aceite_politica_privacidade',
    campo_em: 'aceite_politica_privacidade_em',
  },
  termos_uso: { campo: 'aceite_termos', campo_em: 'aceite_termos_em' },
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole('vendedor', false);

    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Tipo de documento inválido' },
        { status: 400 }
      );
    }

    const { tipo } = parsed.data;
    const { campo, campo_em } = COLUNA_MAP[tipo];

    // Buscar usuario_id pelo CPF da sessão
    const userRes = await query<{ id: number }>(
      `SELECT id FROM usuarios WHERE cpf = $1 AND tipo_usuario = 'vendedor' AND ativo = true LIMIT 1`,
      [session.cpf]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const usuarioId = userRes.rows[0].id;

    // Idempotente: atualiza apenas se ainda não aceito
    await query(
      `UPDATE public.vendedores_perfil
       SET ${campo} = TRUE, ${campo_em} = NOW()
       WHERE usuario_id = $1 AND ${campo} = FALSE`,
      [usuarioId]
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'UNAUTHORIZED' || e.message?.includes('401')) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    console.error('[POST /api/vendedor/aceitar-termos]', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
