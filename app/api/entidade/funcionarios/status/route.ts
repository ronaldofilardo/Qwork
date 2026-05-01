import { NextResponse, NextRequest } from 'next/server';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { requireEntity } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/entidade/funcionarios/status
 * Ativa ou inativa funcionário da entidade
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    const { cpf, ativo } = await request.json();

    if (!cpf || typeof ativo !== 'boolean') {
      return NextResponse.json(
        { error: 'CPF e status ativo são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se o funcionário tem vínculo com a entidade
    // Não filtrar por ativo=true para permitir ativação de vínculos inativos
    const funcionarioResult = await queryAsGestorEntidade(
      `SELECT f.id, f.cpf, f.nome, fe.ativo as vinculo_ativo
       FROM funcionarios f
       INNER JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
       WHERE f.cpf = $1 AND fe.entidade_id = $2`,
      [cpf, entidadeId]
    );

    if (funcionarioResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado ou não pertence a esta entidade' },
        { status: 404 }
      );
    }

    const funcionario = funcionarioResult.rows[0];

    // Se já está no status desejado, retornar sucesso
    if (funcionario.vinculo_ativo === ativo) {
      return NextResponse.json({
        success: true,
        message: `Funcionário já está ${ativo ? 'ativo' : 'inativo'}`,
      });
    }

    // Atualizar funcionarios_entidades — status segregado por entidade
    await queryAsGestorEntidade(
      `UPDATE funcionarios_entidades fe
       SET ativo = $1, atualizado_em = NOW()
       FROM funcionarios f
       WHERE fe.funcionario_id = f.id
         AND f.cpf = $2
         AND fe.entidade_id = $3`,
      [ativo, cpf, entidadeId]
    );

    // Se inativando, inativar avaliações pendentes escopadas pela entidade
    if (!ativo) {
      await queryAsGestorEntidade(
        `UPDATE avaliacoes a
         SET status = 'inativada',
             motivo_inativacao = 'Funcionário inativado pela entidade',
             inativada_em = NOW()
         FROM lotes_avaliacao la
         WHERE a.lote_id = la.id
           AND a.funcionario_cpf = $1
           AND la.entidade_id = $2
           AND a.status NOT IN ('concluido', 'inativada')`,
        [cpf, entidadeId]
      );

      console.log(
        `[AUDIT] Funcionário ${cpf} (${String(funcionario.nome)}) inativado pela entidade ${session.entidade_id} por ${session.cpf}`
      );
    } else {
      console.log(
        `[AUDIT] Funcionário ${cpf} (${String(funcionario.nome)}) reativado pela entidade ${session.entidade_id} por ${session.cpf}`
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
