import crypto from 'crypto';
import { query } from '@/lib/db';
import { getPuppeteerInstance } from '@/lib/infrastructure/pdf/generators/pdf-generator';
import {
  gerarDadosGeraisEmpresa,
  calcularScoresPorGrupo,
  gerarInterpretacaoRecomendacoes,
  gerarObservacoesConclusao,
} from '@/lib/laudo-calculos';
import {
  gerarHTMLLaudoCompleto,
  LaudoDadosCompletos,
} from '@/lib/templates/laudo-html';

/**
 * 🔒 PRINCÍPIO DA IMUTABILIDADE DE LAUDOS
 *
 * Esta função implementa o fluxo CORRETO de emissão de laudos:
 * 1. Criar/atualizar registro do laudo como 'rascunho'
 * 2. Gerar PDF físico com Puppeteer
 * 3. Salvar PDF em storage/laudos/laudo-{id}.pdf
 * 4. Calcular hash SHA-256 do arquivo físico
 * 5. SOMENTE ENTÃO marcar como 'emitido' com hash
 * 6. Salvar metadata JSON
 *
 * ❌ NUNCA marcar como 'emitido' sem arquivo PDF físico
 * ❌ NUNCA calcular hash de string aleatória
 * ✅ SEMPRE: PDF físico → Hash → Status 'emitido'
 *
 * SEMPRE usar Puppeteer para geração de PDF
 */
export async function gerarLaudoCompletoEmitirPDF(
  loteId: number,
  emissorCpf: string,
  session?: any
): Promise<number> {
  const fs = await import('fs');
  const path = await import('path');

  console.log(
    `[EMISSÃO] Iniciando emissão de laudo para lote ${loteId} por emissor ${emissorCpf}`
  );

  // ETAPA 1: Verificar se laudo já existe
  const laudoExistente = await query(
    `SELECT id, status FROM laudos WHERE lote_id = $1`,
    [loteId],
    session
  );

  const laudoId = loteId; // Por design, laudos.id = lote_id

  if (laudoExistente.rows.length > 0) {
    const status = laudoExistente.rows[0].status;

    // Se laudo já está emitido ou enviado, não permitir regeração (imutabilidade)
    if (status === 'emitido' || status === 'enviado') {
      throw new Error(
        `Laudo ${laudoId} já foi emitido e não pode ser regenerado (princípio da imutabilidade)`
      );
    }

    // Se está em rascunho, podemos atualizar
    if (status === 'rascunho') {
      console.log(
        `[EMISSÃO] Laudo ${laudoId} já existe em rascunho, atualizando emissor...`
      );
      await query(
        `UPDATE laudos 
         SET emissor_cpf = $1, atualizado_em = NOW()
         WHERE id = $2`,
        [emissorCpf, laudoId],
        session
      );
    }
  } else {
    // Laudo não existe, criar novo em rascunho
    console.log(`[EMISSÃO] Criando novo laudo ${laudoId} em rascunho...`);
    await query(
      `INSERT INTO laudos (id, lote_id, status, criado_em, emissor_cpf)
       VALUES ($1, $1, 'rascunho', NOW(), $2)`,
      [loteId, emissorCpf],
      session
    );
  }

  console.log(`[EMISSÃO] Laudo ${laudoId} preparado como rascunho`);

  try {
    // ETAPA 2: Gerar dados completos do laudo
    console.log(`[EMISSÃO] Gerando dados do laudo ${laudoId}...`);
    const dadosGeraisEmpresa = await gerarDadosGeraisEmpresa(loteId, session);
    const scoresPorGrupo = await calcularScoresPorGrupo(loteId, session);
    const interpretacaoRecomendacoes = gerarInterpretacaoRecomendacoes(
      dadosGeraisEmpresa.empresaAvaliada,
      scoresPorGrupo
    );

    // Buscar observações do laudo
    const laudoObsResult = await query(
      `SELECT observacoes FROM laudos WHERE id = $1`,
      [laudoId],
      session
    );
    const observacoes = laudoObsResult.rows[0]?.observacoes || '';
    const observacoesConclusao = gerarObservacoesConclusao(observacoes);

    const laudoPadronizado: LaudoDadosCompletos = {
      loteId,
      etapa1: dadosGeraisEmpresa,
      etapa2: scoresPorGrupo,
      etapa3: interpretacaoRecomendacoes,
      etapa4: observacoesConclusao,
    };

    // ETAPA 3: Gerar HTML do laudo
    console.log(`[EMISSÃO] Gerando HTML do laudo ${laudoId}...`);
    const html = gerarHTMLLaudoCompleto({ loteId, ...laudoPadronizado });

    // ETAPA 4: Gerar PDF com Puppeteer
    // SEMPRE usar Puppeteer para geração de PDF
    console.log(`[EMISSÃO] Gerando PDF do laudo ${laudoId}...`);
    const puppeteer = await getPuppeteerInstance();
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
    });

    const page = await (browser as any).newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();
    console.log(
      `[EMISSÃO] PDF gerado com sucesso (${pdfBuffer.byteLength} bytes)`
    );

    // ETAPA 5: Salvar PDF em storage/laudos/
    const storageDir = path.join(process.cwd(), 'storage', 'laudos');
    const fileName = `laudo-${laudoId}.pdf`;
    const filePath = path.join(storageDir, fileName);

    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
      console.log(`[EMISSÃO] Diretório ${storageDir} criado`);
    }

    fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
    console.log(`[EMISSÃO] PDF salvo em ${filePath}`);

    // ETAPA 6: Calcular hash SHA-256 do arquivo físico
    const hashReal = crypto
      .createHash('sha256')
      .update(Buffer.from(pdfBuffer))
      .digest('hex');
    console.log(`[EMISSÃO] Hash SHA-256 calculado: ${hashReal}`);

    // ETAPA 7: Salvar hash E marcar como 'emitido'
    // ✅ CORREÇÃO: O laudo é considerado 'emitido' quando o PDF é gerado localmente
    // O status mudará para 'enviado' quando for feito upload ao bucket
    console.log(`[EMISSÃO] Salvando hash do PDF e marcando como emitido...`);
    const updateResult = await query(
      `UPDATE laudos 
       SET hash_pdf = $1,
           status = 'emitido',
           emitido_em = NOW(),
           atualizado_em = NOW()
       WHERE id = $2 AND status = 'rascunho'
       RETURNING id`,
      [hashReal, laudoId],
      session
    );

    if (!updateResult || updateResult.rowCount === 0) {
      throw new Error(
        'Falha ao salvar hash do laudo. Laudo pode já ter sido emitido.'
      );
    }

    // ETAPA 8: Salvar metadata JSON
    const metaFileName = `laudo-${laudoId}.json`;
    const metaFilePath = path.join(storageDir, metaFileName);
    const metadata = {
      laudo_id: laudoId,
      lote_id: loteId,
      emissor_cpf: emissorCpf,
      gerado_em: new Date().toISOString(),
      arquivo_local: fileName,
      tamanho_bytes: pdfBuffer.byteLength,
      hash_sha256: hashReal,
    };
    fs.writeFileSync(metaFilePath, JSON.stringify(metadata, null, 2));
    console.log(`[EMISSÃO] Metadata salvo em ${metaFilePath}`);

    console.log(
      `[EMISSÃO] ✅ Laudo ${laudoId} emitido com sucesso! PDF gerado localmente e marcado como 'emitido'. Use /api/emissor/laudos/[loteId]/upload para enviar ao bucket.`
    );
    return laudoId;
  } catch (error) {
    // Se falhou, reverter para rascunho
    console.error(`[EMISSÃO] ❌ Erro ao gerar laudo ${laudoId}:`, error);
    await query(
      `UPDATE laudos 
       SET status = 'rascunho',
           hash_pdf = NULL,
           emitido_em = NULL,
           atualizado_em = NOW()
       WHERE id = $1`,
      [laudoId],
      session
    );
    throw error;
  }
}

export function emitirLaudosAutomaticamente(): Promise<void> {
  throw new Error('emitirLaudosAutomaticamente não implementado (stub)');
}

export function emitirLaudoImediato(): Promise<void> {
  throw new Error('emitirLaudoImediato não implementado (stub)');
}
