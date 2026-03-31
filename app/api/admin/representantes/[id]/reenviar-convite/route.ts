/**
 * POST /api/admin/representantes/[id]/reenviar-convite
 *
 * Admin reenvia convite de criação de senha para representante com
 * status 'aguardando_senha' ou 'expirado'.
 *
 * - Revoga token anterior
 * - Gera novo token (7 dias)
 * - Retorna convite_link para o admin copiar/testar durante desenvolvimento
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { transaction, type TransactionClient } from '@/lib/db';
import {
  gerarTokenConvite,
  logEmailConvite,
} from '@/lib/representantes/gerar-convite';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireRole('admin', false);

    const representanteId = parseInt(params.id, 10);
    if (isNaN(representanteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const resultado = await transaction(async (client: TransactionClient) => {
      // Buscar representante e travar linha
      const res = await client.query<{
        id: number;
        nome: string;
        email: string;
        status: string;
      }>(
        `SELECT id, nome, email, status
         FROM representantes
         WHERE id = $1
         FOR UPDATE`,
        [representanteId]
      );

      if (res.rows.length === 0) {
        throw Object.assign(new Error('Representante não encontrado'), {
          status: 404,
        });
      }

      const rep = res.rows[0];

      // Só reenvia para status que aguardam senha
      const statusPermitidos = ['aguardando_senha', 'expirado'];
      if (!statusPermitidos.includes(rep.status)) {
        throw Object.assign(
          new Error(
            `Não é possível reenviar convite para representante com status '${rep.status}'. ` +
              `Permitido apenas: ${statusPermitidos.join(', ')}.`
          ),
          { status: 409 }
        );
      }

      // Restaurar para aguardando_senha se estava expirado
      if (rep.status === 'expirado') {
        await client.query(
          `UPDATE representantes SET status = 'aguardando_senha' WHERE id = $1`,
          [rep.id]
        );
      }

      // Gerar novo token (revoga automaticamente o anterior no UPDATE)
      const convite = await gerarTokenConvite(
        rep.id,
        client,
        request.nextUrl.origin
      );
      logEmailConvite(rep.nome, rep.email, convite.link, convite.expira_em);

      console.log(
        `[REENVIAR_CONVITE] Novo convite gerado para representante #${rep.id} (${rep.email}), expira em ${convite.expira_em.toISOString()}`
      );

      return {
        nome: rep.nome,
        email: rep.email,
        convite_link: convite.link,
        expira_em: convite.expira_em.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      ...resultado,
      message: `Convite reenviado para ${resultado.email}. Link válido por 7 dias.`,
    });
  } catch (err: unknown) {
    const e = err as Error & { status?: number };

    if (e.message === 'Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    if (e.message === 'Sem permissão')
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });

    if (e.status) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }

    console.error('[POST /api/admin/representantes/[id]/reenviar-convite]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
