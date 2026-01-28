#!/usr/bin/env node
/**
 * Worker para processar jobs de geração de PDFs
 * Uso: node scripts/fixes/process_pdf_jobs.mjs
 *
 * Este worker pode rodar:
 * - Localmente durante desenvolvimento
 * - Em uma VM/worker dedicado (Fly.io, Railway, etc.)
 * - Acionado por cron job que chama /api/jobs/process-pdf
 */

import { query } from '../../lib/db.ts';
import {
  getNextPendingJobs,
  markJobCompleted,
  markJobFailed,
  generatePdfViaExternalService,
  createReciboNotification,
} from '../../lib/pdf-service.ts';
import crypto from 'crypto';

const PDF_SERVICE_CONFIG = {
  provider: process.env.PDF_SERVICE_PROVIDER || 'local',
  apiKey: process.env.PDF_SERVICE_API_KEY,
  apiUrl: process.env.PDF_SERVICE_API_URL,
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function processJob(job) {
  console.log(`[Job ${job.id}] Processando recibo ${job.recibo_id}...`);

  try {
    // 1. Buscar dados do recibo
    const reciboResult = await query(
      `SELECT r.id, r.numero_recibo, r.contratante_id 
       FROM recibos r 
       WHERE r.id = $1 AND r.pdf IS NULL`,
      [job.recibo_id]
    );

    if (reciboResult.rows.length === 0) {
      console.log(
        `[Job ${job.id}] Recibo ${job.recibo_id} já tem PDF ou não existe. Marcando como completo.`
      );
      await markJobCompleted(job.id);
      return;
    }

    const recibo = reciboResult.rows[0];
    const reciboUrl = `${BASE_URL}/recibo/${recibo.numero_recibo}`;

    // 2. Gerar PDF via serviço externo
    console.log(`[Job ${job.id}] Gerando PDF para ${reciboUrl}...`);
    const pdfBuffer = await generatePdfViaExternalService(
      reciboUrl,
      PDF_SERVICE_CONFIG
    );

    // 3. Calcular hash
    const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    // 4. Atualizar recibo com PDF e hash
    await query(
      `UPDATE recibos 
       SET pdf = $1, hash_pdf = $2, atualizado_em = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [pdfBuffer, hash, recibo.id]
    );

    // 5. Marcar job como completo
    await markJobCompleted(job.id);

    // 6. Criar notificação para o usuário
    await createReciboNotification(recibo.id, recibo.contratante_id);

    console.log(
      `[Job ${job.id}] ✅ PDF gerado com sucesso (hash: ${hash.substring(0, 12)}...)`
    );
  } catch (error) {
    console.error(`[Job ${job.id}] ❌ Erro:`, error.message || error);
    await markJobFailed(job.id, error.message || 'Erro desconhecido');
  }
}

async function main() {
  console.log('🔄 Worker de geração de PDFs iniciado');
  console.log(`Provider: ${PDF_SERVICE_CONFIG.provider}`);
  console.log(`Base URL: ${BASE_URL}`);

  try {
    const jobs = await getNextPendingJobs(5);

    if (jobs.length === 0) {
      console.log('✅ Nenhum job pendente. Aguardando...');
      return;
    }

    console.log(`📋 Processando ${jobs.length} jobs...`);

    for (const job of jobs) {
      await processJob(job);
    }

    console.log('✨ Processamento concluído');
  } catch (error) {
    console.error('❌ Erro fatal no worker:', error);
    process.exit(1);
  }
}

main();
