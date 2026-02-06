import { NextResponse } from 'next/server';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/empresas
 *
 * Lista todas as empresas associadas à entidade do gestor
 */
export async function GET() {
  try {
    const session = await Promise.resolve(getSession());

    if (!session || session.perfil !== 'gestor') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas gestores de entidade.' },
        { status: 403 }
      );
    }

    // Buscar empresas associadas à entidade do gestor
    // Nota: empresas_clientes usa clinica_id, não contratante_id
    const empresasResult = await queryAsGestorEntidade(
      `SELECT
        ec.id,
        ec.nome,
        ec.cnpj,
        ec.email,
        ec.telefone,
        ec.cidade,
        ec.estado,
        ec.ativa,
        ec.criado_em
      FROM empresas_clientes ec
      WHERE ec.clinica_id = $1
      ORDER BY ec.nome`,
      [session.contratante_id]
    );

    return NextResponse.json({
      success: true,
      empresas: empresasResult.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
