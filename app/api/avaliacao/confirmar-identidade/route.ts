import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * POST /api/avaliacao/confirmar-identidade
 *
 * Registra a confirmação de identidade de um funcionário antes de iniciar/continuar avaliação.
 * Necessário para fins de auditoria jurídica.
 *
 * Body:
 * {
 *   avaliacaoId: number,
 *   nome: string,
 *   cpf: string,
 *   dataNascimento: string (YYYY-MM-DD)
 * }
 */
export async function POST(request: Request) {
  try {
    // Validar sessão
    const session = getSession();
    if (!session || !session.cpf) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { avaliacaoId, nome, cpf, dataNascimento } = await request.json();

    // Validações - avaliacaoId pode ser null para contexto de login
    // Não validar se é obrigatório aqui, pois pode ser null no login

    if (!nome || !cpf || !dataNascimento) {
      return NextResponse.json(
        {
          error:
            'Dados incompletos. Nome, CPF e data de nascimento são obrigatórios.',
        },
        { status: 400 }
      );
    }

    // Validar que o CPF da sessão corresponde ao CPF enviado
    const cpfLimpo = cpf.replace(/\D/g, '');
    const cpfSessao = session.cpf.replace(/\D/g, '');

    if (cpfLimpo !== cpfSessao) {
      console.error(
        `[CONFIRMAR-IDENTIDADE] CPF da sessão (${cpfSessao}) não corresponde ao CPF enviado (${cpfLimpo})`
      );
      return NextResponse.json(
        { error: 'CPF não corresponde à sessão atual' },
        { status: 403 }
      );
    }

    // Se avaliacaoId é fornecido (não null), validar se a avaliação existe e pertence ao funcionário
    if (avaliacaoId !== null && avaliacaoId !== undefined && avaliacaoId > 0) {
      const avaliacaoCheck = await query(
        `SELECT id, funcionario_cpf, status 
         FROM avaliacoes 
         WHERE id = $1 AND funcionario_cpf = $2`,
        [avaliacaoId, cpfSessao]
      );

      if (avaliacaoCheck.rows.length === 0) {
        console.error(
          `[CONFIRMAR-IDENTIDADE] Avaliação ${avaliacaoId} não encontrada ou não pertence ao funcionário ${cpfSessao}`
        );
        return NextResponse.json(
          { error: 'Avaliação não encontrada ou acesso não autorizado' },
          { status: 404 }
        );
      }

      const avaliacao = avaliacaoCheck.rows[0];

      // Não permitir confirmação para avaliações concluídas ou inativadas
      if (
        avaliacao.status === 'concluida' ||
        avaliacao.status === 'inativada'
      ) {
        return NextResponse.json(
          {
            error: `Não é possível confirmar identidade para avaliação ${avaliacao.status}`,
          },
          { status: 400 }
        );
      }

      // Verificar se já existe confirmação para esta avaliação
      const confirmacaoExistente = await query(
        `SELECT id FROM confirmacao_identidade WHERE avaliacao_id = $1`,
        [avaliacaoId]
      );

      if (confirmacaoExistente.rows.length > 0) {
        console.log(
          `[CONFIRMAR-IDENTIDADE] Confirmação já existe para avaliação ${avaliacaoId}`
        );
        return NextResponse.json({
          success: true,
          mensagem: 'Identidade já confirmada anteriormente',
          confirmaçãoId: confirmacaoExistente.rows[0].id,
        });
      }
    } else {
      // avaliacaoId é null: contexto de login, apenas registrar confirmação sem avaliação
      console.log(
        `[CONFIRMAR-IDENTIDADE] Confirmação de identidade no contexto de login para CPF ${cpfSessao}`
      );
    }

    // Buscar dados do funcionário para validação
    const funcionarioData = await query(
      `SELECT nome, cpf, data_nascimento FROM funcionarios WHERE cpf = $1`,
      [cpfSessao]
    );

    if (funcionarioData.rows.length === 0) {
      return NextResponse.json(
        { error: 'Funcionário não encontrado' },
        { status: 404 }
      );
    }

    // Validar data de nascimento (formato YYYY-MM-DD)
    let dataNascimentoValidada = dataNascimento;
    if (dataNascimento.includes('/')) {
      // Converter DD/MM/YYYY para YYYY-MM-DD
      const partes = dataNascimento.split('/');
      if (partes.length === 3) {
        dataNascimentoValidada = `${partes[2]}-${partes[1]}-${partes[0]}`;
      }
    }

    // Inserir confirmação de identidade
    const resultado = await query(
      `INSERT INTO confirmacao_identidade (
        avaliacao_id,
        funcionario_cpf,
        nome_confirmado,
        cpf_confirmado,
        data_nascimento,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, confirmado_em`,
      [
        avaliacaoId || null, // Permite null para contexto de login
        cpfSessao,
        nome,
        cpfLimpo,
        dataNascimentoValidada,
        request.headers.get('x-forwarded-for') || null,
        request.headers.get('user-agent') || null,
      ]
    );

    const confirmacao = resultado.rows[0];

    console.log(
      `[CONFIRMAR-IDENTIDADE] Confirmação registrada: ID=${confirmacao.id}, Avaliação=${avaliacaoId}, CPF=${cpfSessao}`
    );

    return NextResponse.json({
      success: true,
      mensagem: 'Identidade confirmada com sucesso',
      confirmacaoId: confirmacao.id,
      confirmadoEm: confirmacao.confirmado_em,
    });
  } catch (error) {
    console.error('[CONFIRMAR-IDENTIDADE] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao registrar confirmação de identidade' },
      { status: 500 }
    );
  }
}
