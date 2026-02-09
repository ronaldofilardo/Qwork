import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/emissor/laudos/[loteId]/upload-url
 * Gera URL para upload de laudo (versão local inicial)
 *
 * Máquina de estados:
 * - Lote deve estar 'concluido'
 * - Não deve existir laudo com status 'enviado' ou 'emitido'
 * - Emissor deve estar autorizado para o lote
 */
export const POST = async (
  req: Request,
  { params }: { params: { loteId: string } }
) => {
  const user = await requireRole('emissor');
  if (!user) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    const loteId = parseInt(params.loteId);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido', success: false },
        { status: 400 }
      );
    }

    // Verificar estado do lote e permissões
    const loteCheck = await query(
      `
      SELECT 
        la.id, 
         
        la.status,
        la.emissor_cpf,
        COUNT(a.id) FILTER (WHERE a.status != 'rascunho') as total_liberadas,
        COUNT(a.id) FILTER (WHERE a.status = 'concluida' OR a.status = 'concluido') as concluidas,
        COUNT(a.id) FILTER (WHERE a.status = 'inativada') as inativadas
      FROM lotes_avaliacao la
      LEFT JOIN avaliacoes a ON la.id = a.lote_id
      WHERE la.id = $1 AND la.status != 'cancelado'
      GROUP BY la.id,  la.status, la.emissor_cpf
    `,
      [loteId]
    );

    if (loteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado', success: false },
        { status: 404 }
      );
    }

    const lote = loteCheck.rows[0];

    // Verificar se emissor está autorizado (ou se não há emissor definido ainda)
    if (lote.emissor_cpf && lote.emissor_cpf !== user.cpf) {
      return NextResponse.json(
        {
          error: 'Acesso negado: lote pertence a outro emissor',
          success: false,
        },
        { status: 403 }
      );
    }

    // Verificar se o lote está concluído
    const totalLiberadas = parseInt(lote.total_liberadas) || 0;
    const concluidas = parseInt(lote.concluidas) || 0;
    const inativadas = parseInt(lote.inativadas) || 0;
    const finalizadas = concluidas + inativadas;

    const isLoteConcluido =
      totalLiberadas === finalizadas && totalLiberadas > 0;

    if (!isLoteConcluido) {
      return NextResponse.json(
        {
          error: 'Lote não está pronto para emissão',
          success: false,
          detalhes: `${finalizadas}/${totalLiberadas} avaliações finalizadas`,
        },
        { status: 400 }
      );
    }

    // Verificar se já existe laudo emitido ou enviado
    const laudoExistente = await query(
      `SELECT id, status, emitido_em FROM laudos WHERE lote_id = $1`,
      [loteId]
    );

    if (laudoExistente.rows.length > 0) {
      const existing = laudoExistente.rows[0];

      if (existing.status === 'enviado') {
        return NextResponse.json(
          {
            error: 'Laudo já foi enviado para este lote',
            success: false,
            immutable: true,
          },
          { status: 400 }
        );
      }

      if (existing.emitido_em) {
        return NextResponse.json(
          {
            error: 'Laudo já foi emitido para este lote',
            success: false,
            immutable: true,
          },
          { status: 400 }
        );
      }
    }

    // Gerar key para upload (versão local: usaremos storage/laudos/pending)
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const key = `laudos/lote-${loteId}/laudo-${timestamp}-${random}.pdf`;

    // Em local, a "URL" será um endpoint interno temporário
    // Em produção, isso será substituído por presigned URL do Backblaze
    const uploadUrl = `/api/emissor/laudos/${loteId}/upload-local`;

    console.log(
      `[UPLOAD-URL] Gerada URL de upload para lote ${loteId} (emissor: ${user.cpf})`
    );

    return NextResponse.json({
      success: true,
      key,
      uploadUrl,
      uploadMethod: 'POST', // em local usaremos POST com multipart
      maxSizeBytes: 1048576, // 1 MB
      allowedContentTypes: ['application/pdf'],
      expiresIn: 3600, // 1 hora
      lote: {
        id: lote.id,
      },
    });
  } catch (error) {
    console.error(
      '[POST /api/emissor/laudos/[loteId]/upload-url] Erro:',
      error
    );
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
