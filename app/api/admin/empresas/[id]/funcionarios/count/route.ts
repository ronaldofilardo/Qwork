import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

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
    const user = await requireRole('admin');

    const empresaId = parseInt(params.id);

    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID da empresa inválido' },
        { status: 400 }
      );
    }

    // Get clinica_id for admin
    const adminClinica = await query<{ clinica_id: number }>(
      'SELECT clinica_id FROM contratantes WHERE cpf = $1',
      [user.cpf]
    );

    if (adminClinica.rows.length === 0) {
      return NextResponse.json(
        { error: 'Admin não encontrado' },
        { status: 404 }
      );
    }

    const clinicaId = adminClinica.rows[0].clinica_id;

    // Check if empresa exists and belongs to clinica
    const empresaCheck = await query<{ clinica_id: number }>(
      'SELECT clinica_id FROM empresas_clientes WHERE id = $1',
      [empresaId]
    );

    if (empresaCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    if (empresaCheck.rows[0].clinica_id !== clinicaId) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
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
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
