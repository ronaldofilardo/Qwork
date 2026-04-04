/**
 * POST /api/representante/aceitar-termos
 *
 * Registra o aceite de um dos documentos obrigatórios no portal do representante.
 * Chamado no fluxo de primeiro acesso após o cadastro.
 *
 * Body: { tipo: 'contrato_nao_clt' | 'politica_privacidade' | 'termos_uso' }
 *
 * Mapeamento banco:
 *   contrato_nao_clt     → aceite_disclaimer_nv / aceite_disclaimer_nv_em
 *   politica_privacidade → aceite_politica_privacidade / aceite_politica_privacidade_em
 *   termos_uso           → aceite_termos / aceite_termos_em
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

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

export async function POST(request: NextRequest) {
  try {
    const sess = requireRepresentante();

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

    // Idempotente: atualiza apenas se ainda não aceito
    await query(
      `UPDATE public.representantes
       SET ${campo} = TRUE, ${campo_em} = NOW()
       WHERE id = $1 AND ${campo} = FALSE`,
      [sess.representante_id]
    );

    // Garantir que primeira_senha_alterada = TRUE para reps que passaram pelo fluxo
    // de convite com bug antigo (FALSE), eliminando o loop de troca de senha
    await query(
      `UPDATE public.representantes_senhas
       SET primeira_senha_alterada = TRUE
       WHERE representante_id = $1 AND primeira_senha_alterada = FALSE`,
      [sess.representante_id]
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const e = err as Error;
    const r = repAuthErrorResponse(e);
    return NextResponse.json(r.body, { status: r.status });
  }
}
