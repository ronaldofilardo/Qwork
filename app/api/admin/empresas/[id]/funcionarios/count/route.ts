import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole, requireRHWithEmpresaAccess } from '@/lib/session';

/**
 * GET /api/admin/empresas/[id]/funcionarios/count
 *
 * Conta funcionários ativos de uma empresa específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['rh', 'gestor']);

    const empresaId = parseInt(params.id);

    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID da empresa inválido' },
        { status: 400 }
      );
    }

    // Check if empresa exists
    const empresaCheck = await query<{
      clinica_id: number;
      tomador_id: number;
    }>('SELECT clinica_id, tomador_id FROM empresas_clientes WHERE id = $1', [
      empresaId,
    ]);

    if (empresaCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    // Enforce access based on role
    if (user.perfil === 'rh') {
      // Will throw if RH does not have access
      await requireRHWithEmpresaAccess(empresaId);
    } else if (user.perfil === 'gestor') {
      // Gestores não podem acessar empresas (que pertencem a clínicas)
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Count active funcionarios via funcionarios_clinicas
    const countResult = await query<{ count: string }>(
      'SELECT COUNT(DISTINCT fc.funcionario_id) as count FROM funcionarios_clinicas fc JOIN funcionarios f ON f.id = fc.funcionario_id WHERE fc.empresa_id = $1 AND fc.ativo = true AND f.ativo = true',
      [empresaId]
    );

    const count = parseInt(countResult.rows[0].count);

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Erro ao contar funcionários:', error);
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
