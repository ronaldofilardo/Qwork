/**
 * EXEMPLO: Ajuste de API Route para respeitar novas políticas RLS
 *
 * Este é um exemplo de como ajustar as rotas da API para refletir
 * as novas políticas RLS que restringem o acesso do perfil Admin.
 *
 * Aplique este padrão em todas as rotas que lidam com:
 * - Avaliações
 * - Respostas
 * - Resultados
 * - Lotes de avaliação
 * - Laudos
 */

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';

// ================================================================
// EXEMPLO 1: Rota de Avaliações - Bloqueio para Admin
// ================================================================

/**
 * Nota importante sobre o papel `emissor`:
 * - `emissor` é um usuário independente/global (não vinculado a `clinica_id`/`empresa_id`).
 * - RLS deve conter regras explícitas que permitam ao `emissor` visualizar e operar sobre lotes/laudos
 *   necessários para emissão sem depender de `app.current_user_clinica_id`.
 * - Não use `clinica_id` como critério de autorização para `emissor`.
 *
 * GET /api/admin/avaliacoes
 * Lista todas as avaliações (apenas para RH)
 */
export async function GET_avaliacoes(_request: Request) {
  try {
    const session = getSession();

    if (!session || !session.cpf) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // NOVA VERIFICAÇÃO: Admin não tem acesso a avaliações
    if (session.perfil === 'admin') {
      return NextResponse.json(
        {
          error: 'Acesso negado',
          message: 'Perfil Admin não tem permissão para acessar avaliações',
          hint: 'Esta restrição faz parte das políticas de segurança RLS',
        },
        { status: 403 }
      );
    }

    // Apenas RH pode acessar
    if (!['rh'].includes(session.perfil)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Configurar contexto da sessão para RLS
    await query('SET app.current_user_perfil = $1', [session.perfil]);
    await query('SET app.current_user_cpf = $1', [session.cpf]);

    if (session.clinica_id) {
      await query('SET app.current_user_clinica_id = $1', [
        session.clinica_id.toString(),
      ]);
    }

    // Buscar avaliações (RLS aplicará automaticamente as restrições)
    const result = await query(`
      SELECT 
        a.id,
        a.funcionario_cpf,
        f.nome as funcionario_nome,
        a.status,
        a.data_inicio,
        a.data_conclusao,
        a.progresso
      FROM avaliacoes a
      JOIN funcionarios f ON f.cpf = a.funcionario_cpf
      ORDER BY a.data_inicio DESC
      LIMIT 100
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar avaliações',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// ================================================================
// EXEMPLO 2: Rota de Resultados - Bloqueio para Admin
// ================================================================

/**
 * GET /api/admin/resultados/[id]
 * Busca resultados de uma avaliação específica
 */
export async function GET_resultados(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();

    if (!session || !session.cpf) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // NOVA VERIFICAÇÃO: Admin não tem acesso a resultados
    if (session.perfil === 'admin') {
      return NextResponse.json(
        {
          error: 'Acesso negado',
          message:
            'Perfil Admin não tem permissão para acessar resultados de avaliações',
          hint: 'Esta restrição faz parte das políticas de segurança RLS',
        },
        { status: 403 }
      );
    }

    // Configurar contexto da sessão para RLS
    await query('SET app.current_user_perfil = $1', [session.perfil]);
    await query('SET app.current_user_cpf = $1', [session.cpf]);

    if (session.clinica_id) {
      await query('SET app.current_user_clinica_id = $1', [
        session.clinica_id.toString(),
      ]);
    }

    // Buscar resultados (RLS aplicará automaticamente as restrições)
    const result = await query(
      `
      SELECT 
        r.id,
        r.avaliacao_id,
        r.grupo_avaliacao,
        r.score,
        r.nivel_risco,
        r.dimensao,
        r.created_at
      FROM resultados r
      WHERE r.avaliacao_id = $1
      ORDER BY r.grupo_avaliacao, r.dimensao
    `,
      [params.id]
    );

    // Se não retornou nada, pode ser por falta de permissão ou não existir
    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          error: 'Resultados não encontrados',
          message:
            'Nenhum resultado encontrado ou você não tem permissão para acessá-los',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar resultados:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar resultados',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// ================================================================
// EXEMPLO 3: Rota de Funcionários - Admin vê apenas RH/Emissor
// ================================================================

/**
 * GET /api/admin/funcionarios
 * Lista funcionários (Admin vê apenas RH e Emissor)
 */
export async function GET_funcionarios(_request: Request) {
  try {
    const session = getSession();

    if (!session || !session.cpf) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar permissão básica
    if (!['admin', 'rh'].includes(session.perfil)) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Configurar contexto da sessão para RLS
    await query('SET app.current_user_perfil = $1', [session.perfil]);
    await query('SET app.current_user_cpf = $1', [session.cpf]);

    if (session.clinica_id) {
      await query('SET app.current_user_clinica_id = $1', [
        session.clinica_id.toString(),
      ]);
    }

    // Buscar funcionários (RLS aplicará automaticamente as restrições)
    // Admin verá apenas RH e Emissor devido à política RLS
    const result = await query(`
      SELECT 
        f.cpf,
        f.nome,
        f.email,
        f.perfil,
        f.cargo,
        f.empresa_id,
        e.nome_fantasia as empresa_nome,
        f.clinica_id,
        c.nome as clinica_nome,
        f.created_at
      FROM funcionarios f
      LEFT JOIN empresas_clientes e ON e.id = f.empresa_id
      LEFT JOIN clinicas c ON c.id = f.clinica_id
      ORDER BY f.nome
    `);

    // Adicionar aviso para Admin
    let metadata = {};
    if (session.perfil === 'admin') {
      metadata = {
        nota: 'Perfil Admin visualiza apenas funcionários com perfil RH e Emissor',
        perfis_visiveis: ['rh', 'emissor'],
      };
    }

    return NextResponse.json({
      data: result.rows,
      count: result.rows.length,
      metadata,
    });
  } catch (error) {
    console.error('Erro ao buscar funcionários:', error);
    return NextResponse.json(
      {
        error: 'Erro ao buscar funcionários',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// ================================================================
// EXEMPLO 4: Middleware para verificação automática
// ================================================================

/**
 * Middleware para verificar permissões antes de executar a rota
 * Use este middleware em todas as rotas sensíveis
 */
function withAdminRestriction(
  handler: (request: Request, ...args: unknown[]) => Promise<NextResponse>,
  blockedTables: string[] = []
) {
  return async function (request: Request, ...args: unknown[]) {
    const session = getSession();

    if (!session || !session.cpf) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Verificar se Admin está tentando acessar tabelas bloqueadas
    if (session.perfil === 'admin' && blockedTables.length > 0) {
      const routePath = new URL(request.url).pathname;
      const isBlocked = blockedTables.some((table) =>
        routePath.includes(table)
      );

      if (isBlocked) {
        return NextResponse.json(
          {
            error: 'Acesso negado',
            message: `Perfil Admin não tem permissão para acessar ${blockedTables.join(', ')}`,
            hint: 'Esta restrição faz parte das políticas de segurança RLS',
          },
          { status: 403 }
        );
      }
    }

    // Executar handler original
    return handler(request, ...args);
  };
}

// ================================================================
// EXEMPLO DE USO DO MIDDLEWARE
// ================================================================

/**
 * Uso em uma rota de API:
 *
 * // app/api/admin/avaliacoes/route.ts
 * import { withAdminRestriction } from '@/lib/middleware/admin-restriction';
 *
 * async function GET_handler(request: Request) {
 *   // ... lógica da rota
 * }
 *
 * export const GET = withAdminRestriction(
 *   GET_handler,
 *   ['avaliacoes', 'resultados', 'respostas']
 * );
 */

// ================================================================
// EXEMPLO 5: Tratamento de tentativa de modificação de resultado concluído
// ================================================================

/**
 * PUT /api/admin/resultados/[id]
 * Atualiza um resultado (com verificação de imutabilidade)
 */
export async function PUT_resultado(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();

    if (!session || !session.cpf) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Admin não pode acessar resultados
    if (session.perfil === 'admin') {
      return NextResponse.json(
        {
          error: 'Acesso negado',
          message: 'Perfil Admin não tem permissão para modificar resultados',
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      score: number;
      nivel_risco: string;
    };

    // Configurar contexto da sessão para RLS
    await query('SET app.current_user_perfil = $1', [session.perfil]);
    await query('SET app.current_user_cpf = $1', [session.cpf]);

    try {
      // Tentar atualizar (trigger verificará imutabilidade automaticamente)
      const result = await query<{
        id: number;
        avaliacao_id: number;
        grupo_avaliacao: string;
        score: number;
        nivel_risco: string;
        dimensao: string;
        created_at: Date;
        updated_at: Date;
      }>(
        `
        UPDATE resultados
        SET score = $1, nivel_risco = $2, updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `,
        [body.score, body.nivel_risco, params.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          {
            error: 'Resultado não encontrado',
            message:
              'Resultado não existe ou você não tem permissão para modificá-lo',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.rows[0],
      });
    } catch (dbError) {
      // Capturar erro de imutabilidade (ERRCODE 23506)
      const typedError = dbError as {
        code?: string;
        message?: string;
        hint?: string;
      };

      if (typedError.code === '23506') {
        return NextResponse.json(
          {
            error: 'Operação não permitida',
            message: typedError.message || 'Resultado imutável',
            hint:
              typedError.hint ||
              'Resultados de avaliações concluídas são imutáveis',
            code: 'IMMUTABLE_RESULT',
          },
          { status: 422 } // Unprocessable Entity
        );
      }

      // Outros erros de banco
      throw dbError;
    }
  } catch (error) {
    console.error('Erro ao atualizar resultado:', error);
    return NextResponse.json(
      {
        error: 'Erro ao atualizar resultado',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// ================================================================
// EXPORTS PARA USO EM OUTRAS ROTAS
// ================================================================

export {
  GET_avaliacoes as GET_avaliacoes_example,
  GET_resultados as GET_resultados_example,
  GET_funcionarios as GET_funcionarios_example,
  PUT_resultado as PUT_resultado_example,
  withAdminRestriction,
};
