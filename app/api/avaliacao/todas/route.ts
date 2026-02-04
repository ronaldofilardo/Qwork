export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function GET() {
  try {
    const session = await requireAuth();

    // Buscar todas as avaliações do usuário (excluindo inativadas) com contagem de respostas
    const avaliacoesResult = await query(
      `SELECT 
        a.id, 
        a.status, 
        a.inicio, 
        a.envio, 
        a.grupo_atual, 
        a.criado_em,
        a.lote_id,
        a.atualizado_em,
        (SELECT COUNT(*) FROM respostas r WHERE r.avaliacao_id = a.id) as total_respostas
       FROM avaliacoes a
       WHERE a.funcionario_cpf = $1 AND a.status != 'inativada'
       ORDER BY a.criado_em DESC`,
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
