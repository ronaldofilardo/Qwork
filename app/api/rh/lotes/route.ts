import { requireRole, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  let user;
  try {
    user = await requireRole('rh');
  } catch {
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
      [empresaId],
      user
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

    console.log(
      `[DEBUG /api/rh/lotes] user=${user?.cpf || 'unknown'} empresa_id=${empresaId} clinica_id=${clinicaId}`
    );

    let lotesQuery;
    try {
      lotesQuery = await query(
        `
        SELECT
          la.id,
          la.descricao,
          la.tipo,
          la.status,
          la.status_pagamento,
          COALESCE(c.isento_pagamento, false) AS isento_pagamento,
          la.link_disponibilizado_em,
          la.liberado_em,
          la.liberado_por,
          f.nome as liberado_por_nome,
          ec.nome as empresa_nome,
          la.hash_pdf,
          COUNT(a.id) as total_avaliacoes,
          COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
          COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
          fe.solicitado_por,
          fe.solicitado_em,
          fe.tipo_solicitante
        FROM lotes_avaliacao la
        LEFT JOIN funcionarios f ON la.liberado_por = f.cpf
        LEFT JOIN empresas_clientes ec ON la.empresa_id = ec.id
        LEFT JOIN clinicas c ON la.clinica_id = c.id
        LEFT JOIN avaliacoes a ON la.id = a.lote_id
        LEFT JOIN v_fila_emissao fe ON fe.lote_id = la.id
        WHERE la.empresa_id = $1 AND la.clinica_id = $2
        GROUP BY la.id, la.descricao, la.tipo, la.status, la.status_pagamento, c.isento_pagamento, la.link_disponibilizado_em, la.liberado_em, la.liberado_por, f.nome, ec.nome, fe.solicitado_por, fe.solicitado_em, fe.tipo_solicitante
        ORDER BY la.liberado_em DESC
        LIMIT $3
      `,
        [empresaId, clinicaId, limit],
        user
      );
      console.log(
        `[DEBUG /api/rh/lotes] query returned rows=${lotesQuery.rowCount}`
      );
    } catch (err) {
      console.error(
        '[ERROR /api/rh/lotes] query failed:',
        err,
        err instanceof Error ? err.stack : null
      );
      return NextResponse.json(
        { error: 'Erro ao buscar lotes' },
        { status: 500, headers: { 'X-Lotes-Error': 'query_failed' } }
      );
    }

    const lotes = lotesQuery.rows.map((lote: any) => {
      if (lote.isento_pagamento === true && lote.status_pagamento !== 'pago') {
        lote.status_pagamento = 'pago';
      }

      const totalAv = parseInt(lote.total_avaliacoes) || 0;
      const concluidas = parseInt(lote.avaliacoes_concluidas) || 0;
      // taxa_conclusao: concluidas / total_liberadas (inclui inativadas, alinhado com trigger DB)
      const taxaConclusao =
        totalAv > 0 ? Math.round((concluidas / totalAv) * 100) : 0;
      // pode_emitir_laudo: lote concluido pelo trigger DB (trigger garante >= 70%)
      const podeEmitirLaudo = lote.status === 'concluido';

      return {
        id: lote.id,
        tipo: lote.tipo,
        status: lote.status,
        status_pagamento: lote.status_pagamento ?? null,
        link_disponibilizado_em: lote.link_disponibilizado_em ?? null,
        liberado_em: lote.liberado_em,
        liberado_por: lote.liberado_por,
        liberado_por_nome: lote.liberado_por_nome,
        empresa_nome: lote.empresa_nome,
        hash_pdf: lote.hash_pdf || null,
        total_avaliacoes: totalAv,
        avaliacoes_concluidas: concluidas,
        avaliacoes_inativadas: parseInt(lote.avaliacoes_inativadas) || 0,
        solicitado_por: lote.solicitado_por,
        solicitado_em: lote.solicitado_em,
        tipo_solicitante: lote.tipo_solicitante,
        taxa_conclusao: taxaConclusao,
        pode_emitir_laudo: podeEmitirLaudo,
      };
    });

    const response = NextResponse.json({ lotes });
    response.headers.set('X-Lotes-Count', String(lotes.length));
    return response;
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
