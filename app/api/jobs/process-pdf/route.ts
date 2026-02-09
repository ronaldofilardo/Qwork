/**
 * API Route: POST /api/jobs/process-pdf
 * Processa jobs de geração de PDFs (pode ser chamado por cron ou manualmente)
 *
 * Configurar Vercel Cron:
 * vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/jobs/process-pdf",
 *     "schedule": "<every 5 minutes>" (for example)
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

export function POST(_: NextRequest) {
  // ENDPOINT DESABILITADO - Migrado para processamento local via emissor
  // O emissor local agora processa toda geração de PDFs (laudos e recibos)
  // Este endpoint não é mais necessário em produção (Vercel)
  return NextResponse.json(
    {
      error: 'Endpoint desabilitado',
      message:
        'Processamento de PDFs migrado para emissor local. Este endpoint não é mais utilizado.',
      status: 410,
    },
    { status: 410 }
  );

  /* CÓDIGO ORIGINAL COMENTADO - NÃO USAR
  try {
    // Verificar autenticação (Bearer token ou cron secret)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Buscar jobs pendentes (limite de 3 para não exceder timeout do Vercel)
    const jobs = await getNextPendingJobs(3);

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum job pendente',
        processed: 0,
      });
    }

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ jobId: number; error: string }>,
    };

    // Processar cada job
    for (const job of jobs) {
      try {
        // Buscar dados do recibo
        const reciboResult = await query(
          `SELECT r.id, r.numero_recibo, r.tomador_id 
           FROM recibos r 
           WHERE r.id = $1 AND r.pdf IS NULL`,
          [job.recibo_id]
        );

        if (reciboResult.rows.length === 0) {
          await markJobCompleted(job.id);
          results.processed++;
          results.succeeded++;
          continue;
        }

        const recibo = reciboResult.rows[0];
        const reciboUrl = `${BASE_URL}/recibo/${recibo.numero_recibo}`;

        // Gerar PDF
        const pdfBuffer = await generatePdfViaExternalService(
          reciboUrl,
          PDF_SERVICE_CONFIG
        );
        const hash = crypto
          .createHash('sha256')
          .update(pdfBuffer)
          .digest('hex');

        // Atualizar recibo
        await query(
          `UPDATE recibos 
           SET pdf = $1, hash_pdf = $2, atualizado_em = CURRENT_TIMESTAMP 
           WHERE id = $3`,
          [pdfBuffer, hash, recibo.id]
        );

        // Registrar auditoria de geração de PDF
        await query(
          `INSERT INTO auditoria_recibos (recibo_id, acao, status, ip_address, observacoes)
           VALUES ($1, 'geracao_pdf', 'sucesso', $2, $3)`,
          [recibo.id, '127.0.0.1', null]
        );

        // Marcar job como completo
        await markJobCompleted(job.id);

        // Criar notificação
        await createReciboNotification(recibo.id, recibo.tomador_id);

        results.processed++;
        results.succeeded++;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        await markJobFailed(job.id, errorMessage);

        // Registrar auditoria de erro na geração do recibo
        try {
          await query(
            `INSERT INTO auditoria_recibos (recibo_id, acao, status, ip_address, observacoes)
             VALUES ($1, 'geracao_pdf', 'erro', $2, $3)`,
            [job.recibo_id, '127.0.0.1', errorMessage]
          );
        } catch (auditErr) {
          console.error('Erro ao registrar auditoria_recibos:', auditErr);
        }

        results.processed++;
        results.failed++;
        results.errors.push({ jobId: job.id, error: errorMessage });
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Erro ao processar jobs de PDF:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar jobs',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
  */
}

// GET também desabilitado
export function GET(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Endpoint desabilitado',
      message: 'Processamento de PDFs migrado para emissor local.',
      status: 410,
    },
    { status: 410 }
  );

  /* CÓDIGO ORIGINAL COMENTADO
  try {
    const result = await query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
       FROM pdf_jobs`
    );

    return NextResponse.json({
      success: true,
      jobs: result.rows[0],
      provider: PDF_SERVICE_CONFIG.provider,
    });
  } catch {
    return NextResponse.json(
      { error: 'Erro ao consultar status dos jobs' },
      { status: 500 }
    );
  }
  */
}
