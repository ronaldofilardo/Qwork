export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryWithContext } from '@/lib/db-security';
import { requireAuth } from '@/lib/session';

export async function GET() {
  try {
    const session = await requireAuth();

    // Buscar todas as avaliações do usuário (excluindo inativadas) com contagem de respostas
    // SEGREGAÇÃO: incluir empresa_nome/entidade_nome para o dashboard separar por empresa
    const avaliacoesResult = await queryWithContext(
      `SELECT 
        a.id, 
        a.status, 
        a.inicio, 
        a.envio, 
        a.grupo_atual, 
        a.criado_em,
        a.lote_id,
        a.atualizado_em,
        la.empresa_id,
        la.entidade_id,
        COALESCE(ec.nome, ent.nome) as empresa_nome,
        CASE WHEN la.empresa_id IS NOT NULL THEN 'clinica' ELSE 'entidade' END as tipo_tomador,
        (SELECT COUNT(*) FROM respostas r WHERE r.avaliacao_id = a.id) as total_respostas
       FROM avaliacoes a
       INNER JOIN lotes_avaliacao la ON la.id = a.lote_id
       LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
       LEFT JOIN entidades ent ON la.entidade_id = ent.id
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
