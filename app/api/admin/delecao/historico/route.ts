import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/delecao/historico
 *
 * Retorna o histórico de hard-deletes de tomadores executados pelo admin.
 */
export async function GET(): Promise<NextResponse> {
  try {
    await requireRole('admin', false);

    const result = await query<{
      id: number;
      cnpj: string;
      nome: string;
      tipo: string;
      tomador_id: number;
      admin_cpf: string;
      admin_nome: string;
      resumo: Record<string, number>;
      criado_em: string;
    }>(
      `SELECT id, cnpj, nome, tipo, tomador_id, admin_cpf, admin_nome, resumo, criado_em
       FROM audit_delecoes_tomador
       ORDER BY criado_em DESC
       LIMIT 100`
    );

    return NextResponse.json({ historico: result.rows });
  } catch (err) {
    console.error('[admin/delecao/historico] Erro:', err);
    if (err instanceof Error) {
      if (err.message === 'Sem permissão') {
        return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
      }
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
