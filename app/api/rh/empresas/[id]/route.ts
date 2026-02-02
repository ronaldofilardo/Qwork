import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole, requireRHWithEmpresaAccess } from '@/lib/session';

/**
 * PATCH /api/rh/empresas/[id]
 *
 * Ativa ou inativa uma empresa (apenas para perfil RH ou superior)
 * Quando uma empresa é inativada, todos os funcionários (exceto RH) são inativados também
 * Quando uma empresa é ativada, os funcionários NÃO são reativados automaticamente
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const _session = await requireRole('rh');

    const empresaId = parseInt(params.id);
    const { ativa } = await request.json();

    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID da empresa inválido' },
        { status: 400 }
      );
    }

    if (typeof ativa !== 'boolean') {
      return NextResponse.json(
        { error: 'Status ativa deve ser boolean' },
        { status: 400 }
      );
    }

    // Para operações de modificação, manter validação manual de acesso à empresa específica
    await requireRHWithEmpresaAccess(empresaId);

    // Iniciar transação normal
    await query('BEGIN');

    try {
      // Gestor RH usa query direta (não RLS)
      const empresaResult = await query(
        `UPDATE empresas_clientes
        SET ativa = $1, atualizado_em = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, nome, cnpj, ativa, clinica_id`,
        [ativa, empresaId]
      );

      if (empresaResult.rows.length === 0) {
        await query('ROLLBACK');
        return NextResponse.json(
          { error: 'Empresa não encontrada' },
          { status: 404 }
        );
      }
      // Se inativando a empresa, inativar também os funcionários (exceto RH, admin, emissor)
      if (!ativa) {
        const funcionariosResult = await query(
          `UPDATE funcionarios
          SET ativo = false, atualizado_em = CURRENT_TIMESTAMP
          WHERE empresa_id = $1
            AND perfil = 'funcionario'
            AND ativo = true
          RETURNING cpf`,
          [empresaId]
        );

        await query('COMMIT');

        return NextResponse.json({
          success: true,
          empresa: empresaResult.rows[0],
          funcionarios_inativados: funcionariosResult.rows.length,
          mensagem: `Empresa inativada com sucesso. ${funcionariosResult.rows.length} funcionário(s) foram inativados.`,
        });
      } else {
        // Se ativando, apenas atualizar a empresa (funcionários permanecem inativos)
        await query('COMMIT');

        return NextResponse.json({
          success: true,
          empresa: empresaResult.rows[0],
          mensagem:
            'Empresa ativada com sucesso. Os funcionários devem ser reativados individualmente se necessário.',
        });
      }
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);

    if (error instanceof Error) {
      if (error.message === 'Sem permissão') {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
      if (error.message === 'Gestor RH não encontrado') {
        return NextResponse.json(
          { error: 'Gestor RH não encontrado' },
          { status: 404 }
        );
      }
      if (error.message === 'Empresa não encontrada') {
        return NextResponse.json(
          { error: 'Empresa não encontrada' },
          { status: 404 }
        );
      }
      if (
        error.message === 'Você não tem permissão para acessar esta empresa'
      ) {
        return NextResponse.json(
          { error: 'Você não tem permissão para acessar esta empresa' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
