import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/funcionarios/[cpf]
 *
 * Retorna dados básicos de um funcionário pelo CPF.
 * Apenas o próprio funcionário pode acessar seus dados (ou RH/Gestor/Admin).
 */
export async function GET(
  request: Request,
  { params }: { params: { cpf: string } }
) {
  try {
    const session = getSession();
    if (!session || !session.cpf) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const cpfSolicitado = params.cpf.replace(/\D/g, '');
    const cpfSessao = session.cpf.replace(/\D/g, '');

    // Verificar permissões: funcionário só pode ver próprios dados
    // RH, Gestor, Admin podem ver dados de funcionários sob sua responsabilidade
    const isProprioFuncionario = cpfSolicitado === cpfSessao;
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

    // Buscar dados do funcionário
    const resultado = await query(
      `SELECT 
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
      WHERE cpf = $1`,
      [cpfSolicitado]
    );

    if (resultado.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    const funcionario = resultado.rows[0];

    // Formatar data_nascimento para YYYY-MM-DD (sem timestamp)
    let dataNascimentoFormatada = null;
    if (funcionario.data_nascimento) {
      const data = new Date(funcionario.data_nascimento);
      // Extrair apenas YYYY-MM-DD
      const ano = data.getFullYear();
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const dia = String(data.getDate()).padStart(2, '0');
      dataNascimentoFormatada = `${ano}-${mes}-${dia}`;
    }

    return NextResponse.json({
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
    console.error('[API FUNCIONARIOS] Erro ao buscar funcionário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do funcionário' },
      { status: 500 }
    );
  }
}
