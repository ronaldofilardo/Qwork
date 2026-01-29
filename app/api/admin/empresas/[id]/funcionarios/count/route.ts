import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRole,
  requireRHWithEmpresaAccess,
  requireEntity,
} from '@/lib/session';

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
    const user = await requireRole(['rh', 'gestor_entidade']);

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
      contratante_id: number;
    }>(
      'SELECT clinica_id, contratante_id FROM empresas_clientes WHERE id = $1',
      [empresaId]
    );

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
    } else {
      // Gestor de entidade -> verificar que empresa pertence ao contratante
      const entity = await requireEntity();
      if (empresaCheck.rows[0].contratante_id !== entity.contratante_id) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }

    // Count active funcionarios
    const countResult = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM funcionarios WHERE empresa_id = $1 AND status = 'ativo'",
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
