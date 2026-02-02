import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';
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
      '[DEBUG] GET /api/rh/lotes: user=',
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
    const empresaCheck = await query<{
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
        '[DEBUG] requireRHWithEmpresaAccess falhou para listagem de lotes:',
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

    // Buscar lotes da empresa através da relação clinica_id
    // empresaCheck.rows[0].clinica_id contém o clinica_id da empresa
    const clinicaId = empresaCheck.rows[0].clinica_id;

    const lotesQuery = await query(
      `
      SELECT
        la.id,
        la.codigo,
        la.titulo,
        la.descricao,
        la.tipo,
        la.status,
        la.liberado_em,
        la.liberado_por,
        f.nome as liberado_por_nome,
        COUNT(a.id) as total_avaliacoes,
        COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
        COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
        fe.solicitado_por,
        fe.solicitado_em,
        fe.tipo_solicitante
      FROM lotes_avaliacao la
      LEFT JOIN funcionarios f ON la.liberado_por = f.cpf
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      LEFT JOIN fila_emissao fe ON fe.lote_id = la.id
      WHERE la.clinica_id = $1 
        AND la.empresa_id = $2
      GROUP BY la.id, la.codigo, la.titulo, la.descricao, la.tipo, la.status, la.liberado_em, la.liberado_por, f.nome, fe.solicitado_por, fe.solicitado_em, fe.tipo_solicitante
      ORDER BY la.liberado_em DESC
      LIMIT $3
    `,
      [clinicaId, empresaId, limit]
    );

    const lotes = lotesQuery.rows.map((lote: any) => ({
      id: lote.id,
      codigo: lote.codigo,
      titulo: lote.titulo,
      tipo: lote.tipo,
      status: lote.status,
      liberado_em: lote.liberado_em,
      liberado_por: lote.liberado_por,
      liberado_por_nome: lote.liberado_por_nome,
      total_avaliacoes: parseInt(lote.total_avaliacoes),
      avaliacoes_concluidas: parseInt(lote.avaliacoes_concluidas),
      avaliacoes_inativadas: parseInt(lote.avaliacoes_inativadas),
      solicitado_por: lote.solicitado_por,
      solicitado_em: lote.solicitado_em,
      tipo_solicitante: lote.tipo_solicitante,
    }));

    // Validar quais lotes podem emitir laudo usando a função SQL
    const lotesComValidacao = [];
    for (const lote of lotes) {
      try {
        const validacao = await query(
          `SELECT * FROM validar_lote_pre_laudo($1)`,
          [lote.id]
        );

        const resultado = validacao.rows[0] || {
          valido: false,
          alertas: ['Erro ao validar lote'],
          funcionarios_pendentes: 0,
          detalhes: {},
        };

        lotesComValidacao.push({
          ...lote,
          pode_emitir_laudo: resultado.valido || false,
          motivos_bloqueio: resultado.alertas || [],
          taxa_conclusao: resultado.detalhes?.taxa_conclusao || 0,
        });
      } catch (validationError) {
        console.error(`Erro ao validar lote ${lote.id}:`, validationError);
        lotesComValidacao.push({
          ...lote,
          pode_emitir_laudo: false,
          motivos_bloqueio: ['Erro ao validar lote'],
          taxa_conclusao: 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      lotes: lotesComValidacao,
      total: lotesComValidacao.length,
    });
  } catch (error) {
    console.error('Erro ao buscar lotes:', error);
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
