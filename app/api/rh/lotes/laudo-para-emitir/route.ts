import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { queryAsGestorRH } from '@/lib/db-gestor';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  if (!user || user.perfil !== 'rh') {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    let searchParams: URLSearchParams;
    // Compatibilidade com NextRequest mockado nos testes (que define nextUrl.searchParams)
    if ((req as any).nextUrl && (req as any).nextUrl.searchParams) {
      searchParams = (req as any).nextUrl.searchParams;
    } else {
      searchParams = new URL((req as any).url).searchParams;
    }

    const empresaId = searchParams.get('empresa_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log(
      '[DEBUG] GET /api/rh/lotes/laudo-para-emitir: user=',
      user,
      'empresaId=',
      empresaId,
      'limit=',
      limit
    );

    if (!empresaId) {
      return NextResponse.json(
        {
          error: 'ID da empresa é obrigatório',
          success: false,
        },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem acesso à empresa
    const empresaCheck = await queryAsGestorRH<{
      id: number;
      clinica_id: number;
    }>(
      `
      SELECT ec.id, ec.clinica_id
      FROM empresas_clientes ec
      WHERE ec.id = $1 AND ec.ativa = true
    `,
      [empresaId]
    );

    if (empresaCheck.rowCount === 0) {
      return NextResponse.json(
        {
          error: 'Empresa não encontrada',
          success: false,
        },
        { status: 404 }
      );
    }

    // Usar requireRHWithEmpresaAccess para validar permissões com mapeamento de clínica
    try {
      await requireRHWithEmpresaAccess(Number(empresaId));
    } catch (permError) {
      console.log(
        '[DEBUG] requireRHWithEmpresaAccess falhou para laudo-para-emitir:',
        permError
      );
      return NextResponse.json(
        {
          error: 'Você não tem permissão para acessar lotes desta empresa',
          success: false,
          error_code: 'permission_clinic_mismatch',
          hint: 'Verifique se o seu usuário pertence à mesma clínica desta empresa. Caso necessário, contate o administrador da clínica ou o suporte.',
        },
        { status: 403 }
      );
    }

    // Buscar lotes para emitir laudo (status = 'concluido' e sem laudo ou laudo em rascunho)
    const lotesQuery = await queryAsGestorRH(
      `
      SELECT
        la.id,
        la.descricao,
        la.tipo,
        la.status,
        la.liberado_em,
        la.liberado_por,
        la.finalizado_em,
        f.nome as liberado_por_nome,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluido' THEN 1 END) as avaliacoes_concluidas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
        l.status as status_laudo,
        l.id as laudo_id
      FROM lotes_avaliacao la
      LEFT JOIN funcionarios f ON la.liberado_por = f.cpf
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      LEFT JOIN laudos l ON la.id = l.id
      WHERE la.empresa_id = $1 AND la.status = 'concluido'
        AND (l.id IS NULL OR l.status = 'rascunho')
      GROUP BY la.id, la.descricao, la.tipo, la.status, la.liberado_em, la.liberado_por, la.finalizado_em, f.nome, l.status, l.id
      ORDER BY la.finalizado_em DESC
      LIMIT $2
    `,
      [empresaId, limit]
    );

    const lotes = lotesQuery.rows.map((lote: any) => ({
      id: lote.id,
      tipo: lote.tipo,
      status: lote.status,
      liberado_em: lote.liberado_em,
      liberado_por: lote.liberado_por,
      liberado_por_nome: lote.liberado_por_nome,
      finalizado_em: lote.finalizado_em,
      total_avaliacoes: parseInt(lote.total_avaliacoes),
      avaliacoes_concluidas: parseInt(lote.avaliacoes_concluidas),
      avaliacoes_inativadas: parseInt(lote.avaliacoes_inativadas),
      laudo: lote.laudo_id
        ? {
            id: lote.laudo_id,
            status: lote.status_laudo,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      lotes,
      total: lotes.length,
    });
  } catch (error) {
    console.error('Erro ao buscar lotes para emitir laudo:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        success: false,
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
};
