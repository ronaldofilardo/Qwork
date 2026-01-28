import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/auth';

/**
 * GET /api/admin/notificacoes
 *
 * Busca notificações para o admin
 * Query params:
 * - tipo: filtrar por tipo de notificação
 * - resolvida: 'true' | 'false' | undefined (todas)
 * - limit: número de resultados (padrão: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requireRole(session, ['admin']);

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const resolvidaStr = searchParams.get('resolvida');
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (tipo) {
      whereClause.push(`n.tipo = $${paramIndex}`);
      params.push(tipo);
      paramIndex++;
    }

    if (resolvidaStr !== null) {
      whereClause.push(`n.resolvida = $${paramIndex}`);
      params.push(resolvidaStr === 'true');
      paramIndex++;
    }

    const whereSQL =
      whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

    const result = await query(
      `SELECT 
        n.id,
        n.tipo,
        n.titulo,
        n.mensagem,
        n.contratante_id,
        n.contrato_id,
        n.pagamento_id,
        n.dados_contexto,
        n.lida,
        n.resolvida,
        n.data_leitura,
        n.data_resolucao,
        n.resolvido_por_cpf,
        n.observacoes_resolucao,
        n.criado_em,
        n.atualizado_em,
        c.nome as contratante_nome,
        c.email as contratante_email,
        c.tipo as contratante_tipo,
        cont.id as numero_contrato
      FROM notificacoes_admin n
      LEFT JOIN contratantes c ON n.contratante_id = c.id
      LEFT JOIN contratos cont ON n.contrato_id = cont.id
      ${whereSQL}
      ORDER BY n.criado_em DESC
      LIMIT $${paramIndex}`,
      [...params, limit]
    );

    // Contar não lidas
    const countResult = await query(
      `SELECT COUNT(*) as total_nao_lidas
       FROM notificacoes_admin
       WHERE lida = false`
    );

    return NextResponse.json({
      success: true,
      notificacoes: result.rows,
      total_nao_lidas: parseInt(countResult.rows[0].total_nao_lidas),
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar notificações',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/notificacoes/[id]
 *
 * Atualiza status de notificação (marcar como lida ou resolvida)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = requireAuth(request);
    requireRole(session, ['admin']);

    const body = await request.json();
    const { id, acao, observacoes } = body;

    if (!id || !acao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: id, acao (marcar_lida|resolver)' },
        { status: 400 }
      );
    }

    if (acao === 'marcar_lida') {
      await query(
        `UPDATE notificacoes_admin
         SET lida = true,
             data_leitura = NOW()
         WHERE id = $1`,
        [id]
      );
    } else if (acao === 'resolver') {
      await query(
        `UPDATE notificacoes_admin
         SET resolvida = true,
             lida = true,
             data_resolucao = NOW(),
             data_leitura = COALESCE(data_leitura, NOW()),
             resolvido_por_cpf = $1,
             observacoes_resolucao = $2
         WHERE id = $3`,
        [session.cpf, observacoes || null, id]
      );
    } else {
      return NextResponse.json(
        { error: 'Ação inválida. Use: marcar_lida ou resolver' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Notificação ${acao === 'marcar_lida' ? 'marcada como lida' : 'resolvida'} com sucesso`,
    });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar notificação',
      },
      { status: 500 }
    );
  }
}
