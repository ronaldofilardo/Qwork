import { requireClinica } from '@/lib/session';
import { queryAsGestorRH } from '@/lib/db-gestor';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/clinica/laudos
 * Retorna lista de laudos da clínica com paginação
 */
export const GET = async (_req: Request) => {
  try {
    const session = await requireClinica();
    const clinicaId = session.clinica_id;

    // Extrair limit da query (opcional)
    const url = new URL(_req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Buscar laudos da clínica
    const laudosQuery = await queryAsGestorRH(
      `
      SELECT 
        l.id as laudo_id,
        l.lote_id,
        l.status,
        l.enviado_em,
        l.hash_pdf,
        la.codigo,
        la.titulo,
        ec.nome as empresa_nome,
        u.nome as emissor_nome
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      JOIN empresas_clientes ec ON la.empresa_id = ec.id
      LEFT JOIN users u ON l.emissor_cpf = u.cpf
      WHERE la.clinica_id = $1
        AND l.status IN ('enviado', 'emitido')
      ORDER BY l.enviado_em DESC
      LIMIT $2
    `,
      [clinicaId, limit]
    );

    const laudos = laudosQuery.rows.map((laudo) => ({
      id: laudo.laudo_id,
      lote_id: laudo.lote_id,
      codigo: laudo.codigo,
      lote_codigo: laudo.codigo,
      lote_titulo: laudo.titulo,
      empresa_nome: laudo.empresa_nome,
      emissor_nome: laudo.emissor_nome || 'N/A',
      enviado_em: laudo.enviado_em,
      status: laudo.status || 'emitido',
      data_emissao: laudo.enviado_em,
      hash: laudo.hash_pdf || null,
      arquivos: {
        relatorio_lote: laudo.laudo_id
          ? `/api/clinica/laudos/${String(laudo.laudo_id)}/download`
          : undefined,
      },
    }));

    return NextResponse.json({
      success: true,
      laudos,
    });
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
