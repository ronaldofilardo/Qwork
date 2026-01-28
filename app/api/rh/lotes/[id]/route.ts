import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  const user = await requireAuth();
  if (!user || user.perfil !== 'rh') {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    const loteId = params.id;

    // Buscar detalhes do lote com empresa_id
    const loteQuery = await query(
      `
      SELECT
        la.id,
        la.codigo,
        la.titulo,
        la.descricao,
        la.tipo,
        la.status,
        la.liberado_em,
        f.nome as liberado_por_nome,
        ec.id as empresa_id,
        ec.nome as empresa_nome,
        ec.clinica_id
      FROM lotes_avaliacao la
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN funcionarios f ON la.liberado_por = f.cpf
      WHERE la.id = $1 AND ec.ativa = true
    `,
      [loteId]
    );

    if (loteQuery.rowCount === 0) {
      return NextResponse.json(
        {
          error: 'Lote não encontrado',
          success: false,
        },
        { status: 404 }
      );
    }

    const lote = loteQuery.rows[0];

    // Usar requireRHWithEmpresaAccess para validar permissões com mapeamento de clínica
    try {
      await requireRHWithEmpresaAccess(lote.empresa_id);
    } catch (permError) {
      console.log(
        '[DEBUG] requireRHWithEmpresaAccess falhou para lote:',
        permError
      );
      return NextResponse.json(
        {
          error: 'Você não tem permissão para acessar este lote',
          success: false,
          error_code: 'permission_clinic_mismatch',
          hint: 'Verifique se o seu usuário pertence à mesma clínica desta empresa. Caso necessário, contate o administrador da clínica ou o suporte.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      lote: {
        id: lote.id,
        empresa_id: lote.empresa_id,
        empresa_nome: lote.empresa_nome,
        codigo: lote.codigo,
        titulo: lote.titulo,
        descricao: lote.descricao,
        tipo: lote.tipo,
        status: lote.status,
        liberado_em: lote.liberado_em,
        liberado_por_nome: lote.liberado_por_nome,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar lote:', error);
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
