import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * API GET /api/recibo/[id]/pdf
 *
 * Serve PDF do recibo armazenado no banco (BYTEA)
 *
 * Funcionalidades:
 * - Busca PDF binário do banco de dados
 * - Valida hash SHA-256 para garantir integridade
 * - Retorna PDF com headers apropriados para download/visualização
 * - Registra acesso para auditoria
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reciboId = parseInt(params.id);

    if (isNaN(reciboId)) {
      return NextResponse.json(
        { error: 'ID de recibo inválido' },
        { status: 400 }
      );
    }

    // Buscar PDF e metadados do recibo
    const result = await query(
      `SELECT 
        id,
        numero_recibo,
        pdf,
        hash_pdf,
        contratante_id,
        criado_em
       FROM recibos
       WHERE id = $1 AND ativo = true`,
      [reciboId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recibo não encontrado ou inativo' },
        { status: 404 }
      );
    }

    const recibo = result.rows[0];

    // Verificar se PDF existe
    if (!recibo.pdf) {
      return NextResponse.json(
        { error: 'PDF do recibo não está disponível' },
        { status: 404 }
      );
    }

    // Verificar integridade do PDF (opcional, mas recomendado)
    if (recibo.hash_pdf) {
      const crypto = await import('crypto');
      const hashCalculado = crypto
        .createHash('sha256')
        .update(recibo.pdf)
        .digest('hex');

      if (hashCalculado !== recibo.hash_pdf) {
        console.error(
          `⚠️ Integridade do recibo ${recibo.numero_recibo} comprometida! Hash não confere.`
        );
        // Em produção, considere retornar erro ou alertar administrador
      }
    }

    // Preparar response com PDF
    const pdfBuffer = Buffer.from(recibo.pdf);
    const filename = `recibo-${recibo.numero_recibo}.pdf`;

    // Registrar acesso (auditoria opcional)
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    try {
      await query(
        `INSERT INTO auditoria_acessos (
          tipo_recurso,
          recurso_id,
          acao,
          ip_origem,
          timestamp
        ) VALUES ($1, $2, $3, $4, NOW())`,
        ['recibo_pdf', reciboId, 'download', ip]
      );
    } catch (auditError) {
      console.error('Erro ao registrar auditoria de acesso:', auditError);
      // Não falhar o download por erro de auditoria
    }

    // Retornar PDF com headers apropriados
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`, // 'attachment' para forçar download
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache por 1 hora
        'X-Content-Type-Options': 'nosniff',
        'X-Recibo-Numero': recibo.numero_recibo,
        'X-Recibo-Hash': recibo.hash_pdf || '',
      },
    });
  } catch (error) {
    console.error('Erro ao servir PDF do recibo:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar solicitação',
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * API HEAD /api/recibo/[id]/pdf
 *
 * Verifica se PDF existe sem baixá-lo (útil para validações)
 */
export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reciboId = parseInt(params.id);

    if (isNaN(reciboId)) {
      return new NextResponse(null, { status: 400 });
    }

    const result = await query(
      `SELECT 
        numero_recibo,
        hash_pdf,
        octet_length(pdf) as tamanho_pdf
       FROM recibos
       WHERE id = $1 AND ativo = true AND pdf IS NOT NULL`,
      [reciboId]
    );

    if (result.rows.length === 0) {
      return new NextResponse(null, { status: 404 });
    }

    const recibo = result.rows[0];

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': recibo.tamanho_pdf?.toString() || '0',
        'X-Recibo-Numero': recibo.numero_recibo,
        'X-Recibo-Hash': recibo.hash_pdf || '',
      },
    });
  } catch (error) {
    console.error('Erro ao verificar PDF do recibo:', error);
    return new NextResponse(null, { status: 500 });
  }
}
