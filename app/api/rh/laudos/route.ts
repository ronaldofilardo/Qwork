import {
  requireAuth,
  requireRHWithEmpresaAccess,
  requireClinica,
} from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (_req: Request) => {
  // Autenticação e validação de perfil
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  // Extrair empresa_id e limit da query (opcional)
  const url = new URL(_req.url);
  const empresaId = url.searchParams.get('empresa_id');
  const limit = parseInt(url.searchParams.get('limit') || '50'); // Default 50, configurável

  try {
    // Determinar clinica usada para filtro
    let clinicaId: number | undefined = user.clinica_id;

    if (user.perfil === 'rh') {
      try {
        const rhSession = await requireClinica();
        user = rhSession;
        clinicaId = rhSession.clinica_id;
      } catch (err: any) {
        return NextResponse.json(
          {
            error: err?.message || 'Clínica não identificada na sessão',
            success: false,
          },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Acesso negado', success: false },
        { status: 403 }
      );
    }

    if (!clinicaId) {
      return NextResponse.json(
        { error: 'Clínica não identificada na sessão', success: false },
        { status: 403 }
      );
    }

    // Se foi informado empresa_id, validar acesso e usar a clínica desta empresa no filtro
    if (empresaId) {
      const empresaCheck = await query(
        `
        SELECT ec.id, ec.clinica_id
        FROM empresas_clientes ec
        WHERE ec.id = $1 AND ec.ativa = true
      `,
        [empresaId]
      );

      if (empresaCheck.rowCount === 0) {
        return NextResponse.json(
          { error: 'Empresa não encontrada', success: false },
          { status: 404 }
        );
      }

      try {
        await requireRHWithEmpresaAccess(Number(empresaId));
      } catch {
        return NextResponse.json(
          {
            error: 'Você não tem permissão para acessar laudos desta empresa',
            success: false,
            error_code: 'permission_clinic_mismatch',
            hint: 'Verifique se o seu usuário pertence à mesma clínica desta empresa. Caso necessário, contate o administrador da clínica ou o suporte.',
          },
          { status: 403 }
        );
      }

      clinicaId = empresaCheck.rows[0].clinica_id as number;
    }

    // Construir WHERE clause baseado no filtro de empresa
    let whereClause = `WHERE ec.clinica_id = $1`;
    const params: any[] = [clinicaId];

    if (empresaId) {
      whereClause += ` AND ec.id = $2`;
      params.push(parseInt(empresaId));
    }

    // Adicionar LIMIT para performance
    params.push(limit);

    // Buscar laudos enviados para a clínica do usuário (com filtro opcional por empresa)
    const laudosQuery = await query(
      `
      SELECT
        l.id as laudo_id,
        l.lote_id,
        l.status,
        l.enviado_em,
        l.hash_pdf,
        la.id as lote_id_ref,
        ec.nome as empresa_nome,
        c.nome as clinica_nome,
        f.nome as emissor_nome
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      JOIN clinicas c ON ec.clinica_id = c.id
      LEFT JOIN funcionarios f ON l.emissor_cpf = f.cpf
      ${String(whereClause)}
      ORDER BY l.enviado_em DESC
      LIMIT $${String(params.length)}
    `,
      params
    );

    const laudos = laudosQuery.rows.map((laudo) => ({
      id: laudo.laudo_id,
      lote_id: laudo.lote_id,
      empresa_nome: laudo.empresa_nome,
      clinica_nome: laudo.clinica_nome,
      emissor_nome: laudo.emissor_nome || 'N/A',
      enviado_em: laudo.enviado_em,
      status: laudo.status || 'emitido',
      data_emissao: laudo.enviado_em,
      hash: laudo.hash_pdf || null,
      arquivos: {
        relatorio_lote: laudo.laudo_id
          ? `/api/rh/laudos/${String(laudo.laudo_id)}/download`
          : undefined,
      },
    }));

    const responsePayload: any = {
      success: true,
      laudos,
    };

    if (process.env.NODE_ENV === 'development') {
      // Informações auxiliares de debug para desenvolvimento local
      responsePayload._debug = {
        params,
        rawCount: laudosQuery.rowCount,
        sampleRows: laudosQuery.rows.slice(0, 5),
      };
    }

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Erro ao buscar laudos:', error);
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
