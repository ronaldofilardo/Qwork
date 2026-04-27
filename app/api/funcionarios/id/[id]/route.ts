import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { assertAuth, isApiError } from '@/lib/authorization/policies';

export const dynamic = 'force-dynamic';

/**
 * GET /api/funcionarios/id/[id]
 *
 * Retorna dados de um funcionário pelo ID interno (sem expor CPF na URL).
 * Substitui o endpoint GET /api/funcionarios/[cpf] por motivos de LGPD.
 *
 * Permissões: próprio funcionário, RH, Gestor, Admin, Emissor.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();
    assertAuth(session);

    const funcionarioId = parseInt(params.id, 10);
    if (isNaN(funcionarioId) || funcionarioId <= 0) {
      return NextResponse.json(
        { error: 'ID de funcionário inválido' },
        { status: 400 }
      );
    }

    const cpfSessao = session.cpf.replace(/\D/g, '');

    // Buscar dados do funcionário
    const resultado = await query(
      `SELECT 
        id,
        cpf,
        nome,
        email,
        setor,
        funcao,
        data_nascimento,
        nivel_cargo,
        ativo,
        criado_em
      FROM funcionarios 
      WHERE id = $1`,
      [funcionarioId]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    const funcionario = resultado.rows[0];

    // Verificar permissões: funcionário só pode ver próprios dados
    const cpfFuncionario = funcionario.cpf?.replace(/\D/g, '') ?? '';
    const isProprioFuncionario = cpfFuncionario === cpfSessao;
    const isRH = session.perfil === 'rh';
    const isGestor = session.perfil === 'gestor';
    const isAdmin = session.perfil === 'admin';
    const isEmissor = session.perfil === 'emissor';

    if (!isProprioFuncionario && !isRH && !isGestor && !isAdmin && !isEmissor) {
      return NextResponse.json(
        { error: 'Sem permissão para acessar esses dados' },
        { status: 403 }
      );
    }

    // Formatar data_nascimento para YYYY-MM-DD (sem timestamp)
    let dataNascimentoFormatada = null;
    if (funcionario.data_nascimento) {
      const data = new Date(funcionario.data_nascimento);
      const ano = data.getUTCFullYear();
      const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
      const dia = String(data.getUTCDate()).padStart(2, '0');
      dataNascimentoFormatada = `${ano}-${mes}-${dia}`;
    }

    return NextResponse.json({
      id: funcionario.id,
      cpf: funcionario.cpf,
      nome: funcionario.nome,
      email: funcionario.email,
      setor: funcionario.setor,
      funcao: funcionario.funcao,
      data_nascimento: dataNascimentoFormatada,
      nivel_cargo: funcionario.nivel_cargo,
      ativo: funcionario.ativo,
      criado_em: funcionario.criado_em,
    });
  } catch (error) {
    if (isApiError(error)) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      );
    }
    console.error('[API FUNCIONARIOS/ID] Erro ao buscar funcionário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do funcionário' },
      { status: 500 }
    );
  }
}
