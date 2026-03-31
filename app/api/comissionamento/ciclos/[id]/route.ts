/**
 * GET   /api/comissionamento/ciclos/[id] — detalhe do ciclo
 * PATCH /api/comissionamento/ciclos/[id] — ações no ciclo (fechar, aprovar_nf, rejeitar_nf, pagar)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import {
  fecharCiclo,
  aprovarNfCiclo,
  rejeitarNfCiclo,
  registrarPagamentoCiclo,
  sincronizarCiclo,
} from '@/lib/db/comissionamento/ciclos';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await requireRole(['admin', 'representante', 'vendedor'], false);
    const { id } = await params;
    const cicloId = parseInt(id, 10);
    if (isNaN(cicloId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const result = await query(
      `SELECT * FROM ciclos_comissao WHERE id = $1 LIMIT 1`,
      [cicloId]
    );
    if (result.rows.length === 0)
      return NextResponse.json(
        { error: 'Ciclo não encontrado' },
        { status: 404 }
      );

    return NextResponse.json({ ciclo: result.rows[0] });
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[GET /api/comissionamento/ciclos/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

const patchSchema = z.discriminatedUnion('acao', [
  z.object({ acao: z.literal('fechar') }),
  z.object({ acao: z.literal('sincronizar') }),
  z.object({ acao: z.literal('aprovar_nf') }),
  z.object({
    acao: z.literal('rejeitar_nf'),
    motivo: z.string().min(5).max(500),
  }),
  z.object({ acao: z.literal('pagar'), comprovante_path: z.string().min(1) }),
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['admin', 'suporte'], false);
    const { id } = await params;
    const cicloId = parseInt(id, 10);
    if (isNaN(cicloId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 422 }
      );
    }

    const data = parsed.data;

    switch (data.acao) {
      case 'fechar': {
        const { ciclo, erro } = await fecharCiclo(
          cicloId,
          session.cpf,
          session.perfil
        );
        if (erro) return NextResponse.json({ error: erro }, { status: 400 });
        return NextResponse.json({
          ciclo,
          message: 'Ciclo fechado com sucesso.',
        });
      }
      case 'sincronizar': {
        const ciclo = await sincronizarCiclo(cicloId);
        if (!ciclo)
          return NextResponse.json(
            { error: 'Ciclo não encontrado' },
            { status: 404 }
          );
        return NextResponse.json({ ciclo, message: 'Totais sincronizados.' });
      }
      case 'aprovar_nf': {
        const { ciclo, erro } = await aprovarNfCiclo(
          cicloId,
          session.cpf,
          session.perfil
        );
        if (erro) return NextResponse.json({ error: erro }, { status: 400 });
        return NextResponse.json({
          ciclo,
          message: 'NF aprovada com sucesso.',
        });
      }
      case 'rejeitar_nf': {
        const { ciclo, erro } = await rejeitarNfCiclo(
          cicloId,
          session.cpf,
          data.motivo,
          session.perfil
        );
        if (erro) return NextResponse.json({ error: erro }, { status: 400 });
        return NextResponse.json({ ciclo, message: 'NF rejeitada.' });
      }
      case 'pagar': {
        const { ciclo, erro } = await registrarPagamentoCiclo(
          cicloId,
          data.comprovante_path,
          session.cpf,
          session.perfil
        );
        if (erro) return NextResponse.json({ error: erro }, { status: 400 });
        return NextResponse.json({
          ciclo,
          message: 'Pagamento registrado com sucesso.',
        });
      }
    }
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      (err.message === 'Sem permissão' || err.message === 'Não autenticado')
    ) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('[PATCH /api/comissionamento/ciclos/[id]]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
