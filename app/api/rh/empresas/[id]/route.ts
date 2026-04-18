import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole, requireRHWithEmpresaAccess } from '@/lib/session';

/**
 * GET /api/rh/empresas/[id]
 *
 * Retorna os dados completos de uma empresa para edição.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = parseInt(params.id);
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID da empresa inválido' },
        { status: 400 }
      );
    }

    await requireRHWithEmpresaAccess(empresaId);

    const result = await query(
      `SELECT id, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
              representante_nome, representante_fone, representante_email, ativa
       FROM empresas_clientes
       WHERE id = $1`,
      [empresaId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ empresa: result.rows[0] });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    console.error('Erro ao buscar empresa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/rh/empresas/[id]
 *
 * Atualiza os dados cadastrais de uma empresa.
 * CNPJ não pode ser alterado (chave de negócio).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const empresaId = parseInt(params.id);
    if (isNaN(empresaId)) {
      return NextResponse.json(
        { error: 'ID da empresa inválido' },
        { status: 400 }
      );
    }

    const session = await requireRHWithEmpresaAccess(empresaId);

    const body = await request.json();
    const {
      nome,
      email,
      telefone,
      endereco,
      cidade,
      estado,
      cep,
      representante_nome,
      representante_fone,
      representante_email,
    } = body;

    if (!nome || nome.trim().length < 3) {
      return NextResponse.json(
        { error: 'Nome da empresa deve ter no mínimo 3 caracteres' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE empresas_clientes
       SET nome = $1,
           email = $2,
           telefone = $3,
           endereco = $4,
           cidade = $5,
           estado = $6,
           cep = $7,
           representante_nome = $8,
           representante_fone = $9,
           representante_email = $10,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING id, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
                 representante_nome, representante_fone, representante_email, ativa`,
      [
        nome.trim(),
        email?.trim() || null,
        telefone?.trim() || null,
        endereco?.trim() || null,
        cidade?.trim() || null,
        estado?.trim()?.toUpperCase() || null,
        cep?.trim() || null,
        representante_nome?.trim() || null,
        representante_fone?.trim() || null,
        representante_email?.trim() || null,
        empresaId,
      ],
      session
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, empresa: result.rows[0] });
  } catch (error) {
    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    console.error('Erro ao atualizar empresa:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

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
      // Se inativando a empresa, inativar os VÍNCULOS dos funcionários (não o funcionário globalmente)
      // SEGREGAÇÃO: inativa apenas o vinculo em funcionarios_clinicas, preservando vínculos com outras empresas
      if (!ativa) {
        const funcionariosResult = await query(
          `UPDATE funcionarios_clinicas fc
          SET ativo = false, data_desvinculo = CURRENT_TIMESTAMP, atualizado_em = CURRENT_TIMESTAMP
          FROM funcionarios f
          WHERE fc.funcionario_id = f.id
            AND fc.empresa_id = $1
            AND f.perfil = 'funcionario'
            AND fc.ativo = true
          RETURNING f.cpf`,
          [empresaId]
        );

        await query('COMMIT');

        return NextResponse.json({
          success: true,
          empresa: empresaResult.rows[0],
          funcionarios_inativados: funcionariosResult.rows.length,
          mensagem: `Empresa inativada com sucesso. ${funcionariosResult.rows.length} vínculo(s) de funcionário(s) foram inativados.`,
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
