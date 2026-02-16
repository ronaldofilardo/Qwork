import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    // Buscar informações da entidade
    const entidadeQuery = `
      SELECT
        e.id,
        e.nome,
        e.cnpj,
        e.email,
        e.telefone,
        e.endereco,
        e.cidade,
        e.estado,
        e.responsavel_nome,
        e.criado_em,
        e.status
      FROM entidades e
      WHERE e.id = $1
      LIMIT 1
    `;

    const entidadeResult = await queryAsGestorEntidade(entidadeQuery, [
      entidadeId,
    ]);

    if (entidadeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Entidade não encontrada' },
        { status: 404 }
      );
    }

    const entidade = entidadeResult.rows[0];

    const accountInfo = {
      nome: entidade.nome,
      cnpj: entidade.cnpj,
      email: entidade.email,
      telefone: entidade.telefone,
      endereco: entidade.endereco,
      cidade: entidade.cidade,
      estado: entidade.estado,
      responsavel_nome: entidade.responsavel_nome,
      criado_em: entidade.criado_em,
    };

    return NextResponse.json(accountInfo);
  } catch (error) {
    console.error('Erro ao buscar informações da conta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
