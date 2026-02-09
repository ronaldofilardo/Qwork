/**
 * lib/pdf-service.ts
 * Serviço para geração de PDFs usando API externa (evita timeout em Vercel)
 *
 * Integra com serviço externo de PDF (ex: PDFShift, CloudConvert, ou Puppeteer hospedado)
 * Para desenvolvimento local: usa Puppeteer se disponível
 * Para produção: usa API externa configurada via env vars
 */

import { query } from './db';

export interface PdfGenerationJob {
  id: number;
  recibo_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  max_attempts: number;
  error_message?: string;
}

export interface PdfServiceConfig {
  provider: 'local' | 'pdfshift' | 'cloudconvert';
  apiKey?: string;
  apiUrl?: string;
}

/**
 * Enfileira job de geração de PDF para um recibo
 */
export async function enqueuePdfJob(reciboId: number): Promise<number> {
  const result = await query(
    `INSERT INTO pdf_jobs (recibo_id, status, attempts)
     VALUES ($1, 'pending', 0)
     ON CONFLICT (recibo_id) DO UPDATE 
     SET status = 'pending', attempts = 0, error_message = NULL
     RETURNING id`,
    [reciboId]
  );
  return result.rows[0].id;
}

/**
 * Busca próximos jobs pendentes para processar
 */
export async function getNextPendingJobs(
  limit: number = 5
): Promise<PdfGenerationJob[]> {
  const result = await query(
    `UPDATE pdf_jobs
     SET status = 'processing', updated_at = CURRENT_TIMESTAMP
     WHERE id IN (
       SELECT id FROM pdf_jobs
       WHERE status = 'pending' AND attempts < 5
       ORDER BY created_at ASC
       LIMIT $1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id, recibo_id, status, attempts, error_message`,
    [limit]
  );
  return result.rows as PdfGenerationJob[];
}

/**
 * Marca job como completo
 */
export async function markJobCompleted(jobId: number): Promise<void> {
  await query(
    `UPDATE pdf_jobs
     SET status = 'completed', processed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [jobId]
  );
}

/**
 * Marca job como falho (com retry se não excedeu max_attempts)
 */
export async function markJobFailed(
  jobId: number,
  errorMessage: string
): Promise<void> {
  const result = await query(
    `UPDATE pdf_jobs
     SET attempts = attempts + 1,
         error_message = $2,
         status = CASE WHEN attempts + 1 >= 5 THEN 'failed' ELSE 'pending' END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING status, attempts`,
    [jobId, errorMessage]
  );

  const row = result.rows[0];
  console.log(
    `Job ${jobId} falhou (tentativa ${row.attempts}/${row.max_attempts}). Status: ${row.status}`
  );
}

/**
 * Gera PDF usando serviço externo (abstração)
 */
export async function generatePdfViaExternalService(
  url: string,
  config: PdfServiceConfig
): Promise<Buffer> {
  if (config.provider === 'local') {
    // Fallback local (apenas para dev)
    const { gerarPdfFromUrl } = await import('./pdf-generator');
    const result = await gerarPdfFromUrl(url, 'temp.pdf');
    return result.pdfBuffer;
  }

  // Integração com serviço externo (ex: PDFShift)
  if (config.provider === 'pdfshift' && config.apiKey) {
    const response = await fetch('https://api.pdfshift.io/v3/convert/pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString('base64')}`,
      },
      body: JSON.stringify({
        source: url,
        sandbox: false,
        wait_for: 'networkidle0',
      }),
    });

    if (!response.ok) {
      throw new Error(
        `PDFShift error: ${response.status} ${response.statusText}`
      );
    }

    return Buffer.from(await response.arrayBuffer());
  }

  throw new Error(
    `PDF provider ${config.provider} não configurado ou não suportado`
  );
}

/**
 * Cria notificação para o usuário sobre recibo gerado
 */
export async function createReciboNotification(
  reciboId: number,
  tomadorId: number
): Promise<void> {
  try {
    await query(
      `INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, link, lido, criado_em)
       VALUES ($1, 'recibo_gerado', 'Recibo Disponível', 'Seu recibo foi gerado e está pronto para download.', $2, false, CURRENT_TIMESTAMP)`,
      [tomadorId, `/recibo/${reciboId}`]
    );
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    // Não fatal - log e continue
  }
}
