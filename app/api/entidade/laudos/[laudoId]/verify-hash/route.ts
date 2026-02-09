import { requireEntity } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/laudos/[laudoId]/verify-hash
 * Verifica a integridade do laudo comparando o hash armazenado com o hash do arquivo
 */
export const GET = async (
  req: Request,
  { params }: { params: { laudoId: string } }
) => {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    const laudoId = parseInt(params.laudoId);
    if (isNaN(laudoId)) {
      return NextResponse.json(
        { error: 'ID do laudo inválido', success: false },
        { status: 400 }
      );
    }

    // Buscar laudo e verificar se pertence à entidade
    const laudoQuery = await query(
      `
      SELECT
        l.id,
        l.lote_id,
        l.hash_pdf,
        l.status,
        la.entidade_id,
        la.clinica_id
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.id = $1 
        AND l.status IN ('enviado', 'emitido')
        AND la.entidade_id = $2
    `,
      [laudoId, entidadeId]
    );

    if (laudoQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Laudo não encontrado ou acesso negado', success: false },
        { status: 404 }
      );
    }

    const laudo = laudoQuery.rows[0];
    const hashArmazenado = laudo.hash_pdf;

    if (!hashArmazenado) {
      return NextResponse.json(
        {
          error: 'Hash do laudo não encontrado no banco de dados',
          success: false,
        },
        { status: 404 }
      );
    }

    // Tentar ler o arquivo do storage local
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const localPath = path.join(
        process.cwd(),
        'storage',
        'laudos',
        `laudo-${laudo.id}.pdf`
      );

      try {
        // Ler arquivo e calcular hash
        const buffer = await fs.readFile(localPath);
        const hashCalculado = crypto
          .createHash('sha256')
          .update(buffer)
          .digest('hex');

        const hashValido = hashCalculado === hashArmazenado;

        console.log(`[VERIFY] Laudo ${laudo.id} - Hash válido: ${hashValido}`);
        console.log(`[VERIFY] Hash armazenado: ${hashArmazenado}`);
        console.log(`[VERIFY] Hash calculado:  ${hashCalculado}`);

        return NextResponse.json({
          success: true,
          hash_valido: hashValido,
          hash_armazenado: hashArmazenado,
          hash_calculado: hashCalculado,
          storage_location: 'local',
          laudo_id: laudo.id,
          lote_id: laudo.lote_id,
        });
      } catch (fileError) {
        void fileError;
        console.warn(
          `[VERIFY] Arquivo local não encontrado para laudo ${laudo.id}`
        );

        // Se não encontrou local, tentar Backblaze
        // Por enquanto, retornar que precisa de implementação do Backblaze
        return NextResponse.json(
          {
            error:
              'Arquivo não encontrado no storage local. Verificação em storage remoto não implementada ainda.',
            success: false,
          },
          { status: 404 }
        );
      }
    } catch (error: any) {
      console.error('[VERIFY] Erro ao verificar hash:', error);
      return NextResponse.json(
        { error: 'Erro ao verificar integridade do laudo', success: false },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao verificar hash do laudo:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erro interno do servidor',
        success: false,
      },
      { status: 500 }
    );
  }
};
