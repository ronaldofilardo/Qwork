import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/pagamento/confirmar-simples
 *
 * Endpoint ULTRA-SIMPLIFICADO para confirmar pagamento durante desenvolvimento.
 * Não valida status, não cria registros complexos - apenas marca como pago e ativa conta.
 *
 * Body: { entidade_id, valor_total, metodo? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entidade_id, valor_total, metodo = 'pix' } = body;

    if (!entidade_id) {
      return NextResponse.json(
        { error: 'entidade_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log(
      '[PAGAMENTO_SIMPLES] Iniciando confirmação para entidade',
      entidade_id
    );

    // 1. Confirmar pagamento na entidade
    await query(
      `UPDATE entidades 
       SET pagamento_confirmado = true,
           status = 'ativo',
           ativa = true,
           atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [entidade_id]
    );

    // 2. Criar registro de pagamento simples (apenas para histórico)
    const pagamentoRes = await query(
      `INSERT INTO pagamentos (entidade_id, valor, metodo, status, confirmado_em)
       VALUES ($1, $2, $3, 'confirmado', CURRENT_TIMESTAMP)
       RETURNING id`,
      [entidade_id, valor_total || 0, metodo]
    );

    const pagamentoId = pagamentoRes.rows[0].id;

    // 3. Criar conta responsável (login)
    const entidadeRes = await query(
      'SELECT responsavel_cpf, responsavel_nome, responsavel_email, tipo FROM entidades WHERE id = $1',
      [entidade_id]
    );

    if (entidadeRes.rows.length > 0) {
      const { responsavel_cpf, responsavel_nome, responsavel_email, tipo } =
        entidadeRes.rows[0];

      // Verificar se já existe login
      const loginExists = await query(
        'SELECT cpf FROM funcionarios WHERE cpf = $1',
        [responsavel_cpf]
      );

      if (loginExists.rows.length === 0) {
        // Criar senha padrão: "123456"
        const bcrypt = await import('bcryptjs');
        const senhaHash = await bcrypt.hash('123456', 10);

        const perfil = tipo === 'clinica' ? 'gestor' : 'gestor';

        await query(
          `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, entidade_id)
           VALUES ($1, $2, $3, $4, $5, true, $6)`,
          [
            responsavel_cpf,
            responsavel_nome,
            responsavel_email,
            senhaHash,
            perfil,
            entidade_id,
          ]
        );

        console.log('[PAGAMENTO_SIMPLES] Login criado para', responsavel_cpf);
      }
    }

    console.log('[PAGAMENTO_SIMPLES] Pagamento confirmado com sucesso', {
      entidade_id,
      pagamento_id: pagamentoId,
    });

    return NextResponse.json({
      success: true,
      message: 'Pagamento confirmado com sucesso!',
      pagamento_id: pagamentoId,
      redirect_url: '/',
    });
  } catch (error) {
    console.error('[PAGAMENTO_SIMPLES] Erro:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao processar pagamento',
      },
      { status: 500 }
    );
  }
}
