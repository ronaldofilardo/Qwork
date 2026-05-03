import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getContratantesByTipo, query, type TipoContratante } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/contratantes
 * Lista contratantes aprovados por tipo (clinica/entidade) ou busca por ID
 * Query params: ?tipo=clinica|entidade ou ?id=123
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação (suporta mocks assíncronos em testes)
    const session = await Promise.resolve(getSession());
    if (!session || session.perfil !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    // Extrair parâmetros da query string
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const tipo = searchParams.get('tipo') as TipoContratante | null;

    // Se ID foi fornecido, buscar específico
    if (id) {
      const result = await query(
        `SELECT 
          c.id, c.tipo, c.nome, c.cnpj, c.inscricao_estadual, 
          c.email, c.telefone, c.endereco, c.cidade, c.estado, c.cep,
          c.status, c.ativa, c.data_cadastro, c.data_aprovacao,
          c.responsavel_nome, c.responsavel_cpf, c.responsavel_cargo,
          c.responsavel_email, c.responsavel_celular,
          c.pagamento_confirmado, c.data_liberacao_login
        FROM contratantes c
        WHERE c.id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Contratante não encontrado' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        contratante: result.rows[0],
      });
    }

    if (tipo && tipo !== 'clinica' && tipo !== 'entidade') {
      return NextResponse.json(
        { error: 'Tipo inválido. Use "clinica" ou "entidade"' },
        { status: 400 }
      );
    }

    // Buscar contratantes por tipo
    const contratantes = await getContratantesByTipo(
      tipo ?? undefined,
      session
    );

    return NextResponse.json({
      success: true,
      contratantes,
      total: contratantes.length,
    });
  } catch (error) {
    console.error('Erro ao buscar contratantes:', error);
    console.error(error && error.stack ? error.stack : error);
    console.error('Request URL:', request.url);
    console.error('Request nextUrl:', request.nextUrl);
    if (request.nextUrl) {
      console.error(
        'Search params:',
        Object.fromEntries(request.nextUrl.searchParams)
      );
    }
    return NextResponse.json(
      { error: 'Erro ao buscar contratantes' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/contratantes
 * Remove ou desativa um contratante (soft delete por padrão, force=true para remoção completa)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await Promise.resolve(getSession());
    if (!session || session.perfil !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, force, admin_password, motivo } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do contratante é obrigatório' },
        { status: 400 }
      );
    }

    const existing = await query('SELECT * FROM contratantes WHERE id = $1', [
      id,
    ]);
    if (existing.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contratante não encontrado' },
        { status: 404 }
      );
    }

    const contratante = existing.rows[0];

    // Não permitir desativação de contratantes aguardando pagamento
    if (contratante.status === 'aguardando_pagamento') {
      return NextResponse.json(
        {
          error:
            'Não é possível desativar contratante que está aguardando confirmação de pagamento. Aguarde o pagamento ou regenere o link de pagamento.',
        },
        { status: 400 }
      );
    }

    if (force) {
      // Não permitir remoção completa de contratantes aguardando pagamento
      if (contratante.status === 'aguardando_pagamento') {
        return NextResponse.json(
          {
            error:
              'Não é possível remover completamente contratante que está aguardando confirmação de pagamento.',
          },
          { status: 400 }
        );
      }

      // Remoção completa exige confirmação da senha do admin
      if (!admin_password || typeof admin_password !== 'string') {
        return NextResponse.json(
          { error: 'Senha do admin é necessária para deleção completa' },
          { status: 400 }
        );
      }

      // Validar senha do admin
      const bcrypt = (await import('bcryptjs')).default;
      try {
        const adminRow = await query(
          "SELECT senha_hash FROM funcionarios WHERE cpf = $1 AND perfil = 'admin' AND ativo = true",
          [session.cpf]
        );

        if (adminRow.rows.length === 0) {
          return NextResponse.json(
            { error: 'Administrador não encontrado' },
            { status: 403 }
          );
        }

        const hash = adminRow.rows[0].senha_hash;
        const valid = await bcrypt.compare(admin_password, hash);

        if (!valid) {
          return NextResponse.json(
            { error: 'Senha do admin inválida' },
            { status: 403 }
          );
        }
      } catch (err) {
        console.error('Erro ao validar senha do admin:', err);
        return NextResponse.json(
          { error: 'Erro ao validar senha do admin' },
          { status: 500 }
        );
      }

      // Preparar motivo (obrigatório para fn_delete_senha_autorizado)
      const motivoFinal = motivo?.trim()
        ? motivo.trim()
        : `Remoção completa do contratante por ${session.cpf}`;

      // Executar em uma transação única para manter atomicidade e contexto de auditoria
      const tx = `BEGIN;
        SELECT set_config('app.current_user_cpf', $3, true);
        SELECT set_config('app.current_user_perfil', $4, true);
        SELECT fn_delete_senha_autorizado($1, $2);
        DELETE FROM pagamentos WHERE contratante_id = $1;
        DELETE FROM contratos WHERE contratante_id = $1;
        DELETE FROM contratantes WHERE id = $1;
        COMMIT;`;

      try {
        await query(tx, [id, motivoFinal, session.cpf, session.perfil]);
      } catch (err: any) {
        console.error(
          'Erro ao remover contratante (transação):',
          err && err.message ? err.message : err
        );
        console.error(err && err.stack ? err.stack : err);
        try {
          await query('ROLLBACK');
        } catch (rerr) {
          console.error('Erro ao efetuar ROLLBACK:', rerr);
        }
        // Propagar erro adequado
        if (err && err.message && err.message.includes('OPERAÇÃO BLOQUEADA')) {
          return NextResponse.json(
            {
              error:
                'Delete de senhas bloqueado - motivo inválido ou autorização faltando',
            },
            { status: 400 }
          );
        }
        return NextResponse.json(
          { error: 'Erro ao remover contratante' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Contratante removido permanentemente',
      });
    }

    // Soft delete: marcar como inativo
    await query(
      `UPDATE contratantes
       SET ativa = false, status = 'inativa', atualizado_em = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Contratante desativado (soft delete)',
    });
  } catch (error) {
    console.error('Erro ao deletar contratante:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar contratante' },
      { status: 500 }
    );
  }
}
