export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function GET() {
  try {
    const session = await requireAuth();

    // Buscar todas as avaliações do usuário (excluindo inativadas)
    const avaliacoesResult = await query(
      `SELECT 
        id, 
        status, 
        inicio, 
        envio, 
        grupo_atual, 
        criado_em,
        lote_id,
        atualizado_em
       FROM avaliacoes
       WHERE funcionario_cpf = $1 AND status != 'inativada'
       ORDER BY criado_em DESC`,
      [session.cpf]
    );

    console.log(
      `[INFO] Busca de avaliações para CPF ${session.cpf}: ${avaliacoesResult.rows.length} encontradas`
    );

    return NextResponse.json({
      avaliacoes: avaliacoesResult.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar avaliações' },
      { status: 500 }
    );
  }
}
