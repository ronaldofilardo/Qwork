import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/entidade/funcionarios/status
 * Ativa ou inativa funcionário da entidade
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireEntity();
    const contratanteId = session.contratante_id;

    const { cpf, ativo } = await request.json();

    if (!cpf || typeof ativo !== 'boolean') {
      return NextResponse.json(
        { error: 'CPF e status ativo são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o funcionário pertence à entidade
    const funcionarioResult = await query(
      'SELECT id, cpf, nome, ativo FROM funcionarios WHERE cpf = $1 AND contratante_id = $2',
      [cpf, contratanteId]
    );

    if (funcionarioResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado ou não pertence a esta entidade' },
        { status: 404 }
      );
    }

    const funcionario = funcionarioResult.rows[0];

    // Se já está no status desejado, retornar sucesso
    if (funcionario.ativo === ativo) {
      return NextResponse.json({
        success: true,
        message: `Funcionário já está ${ativo ? 'ativo' : 'inativo'}`,
      });
    }

    // Atualizar status
    await query('UPDATE funcionarios SET ativo = $1 WHERE cpf = $2', [
      ativo,
      cpf,
    ]);

    // Se inativando, inativar também todas as avaliações pendentes
    if (!ativo) {
      await query(
        `UPDATE avaliacoes
         SET status = 'inativada',
             motivo_inativacao = 'Funcionário inativado pela entidade',
             inativada_em = NOW()
         WHERE funcionario_cpf = $1
           AND status NOT IN ('concluida', 'inativada')`,
        [cpf]
      );

      console.log(
        `[AUDIT] Funcionário ${cpf} (${funcionario.nome}) inativado pela entidade ${contratanteId} por ${session.cpf}`
      );
    } else {
      console.log(
        `[AUDIT] Funcionário ${cpf} (${funcionario.nome}) reativado pela entidade ${contratanteId} por ${session.cpf}`
      );
    }

    return NextResponse.json({
      success: true,
      message: `Funcionário ${ativo ? 'ativado' : 'inativado'} com sucesso`,
    });
  } catch (error) {
    console.error('Erro ao alterar status do funcionário:', error);

    if (error instanceof Error && error.message.includes('Acesso restrito')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro ao alterar status do funcionário' },
      { status: 500 }
    );
  }
}
