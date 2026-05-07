import fs from 'fs';
import path from 'path';
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
import {
  formatarDataApenasData,
  formatarHora,
} from '@/lib/pdf/timezone-helper';


// ─── Tipos de retorno ──────────────────────────────────────────────────────────

export interface ResultadoEmissaoLaudo {
  /** ID do laudo (= lote_id) */
  laudoId: number;
  /** Sempre 'pdf_gerado' após geração local. */
  status: 'pdf_gerado';
  mensagem: string;
}

/**
 * 🔒 PRINCÍPIO DA IMUTABILIDADE DE LAUDOS
 *
 * Fluxo:
 *   rascunho → [gerarPDFLaudo] → pdf_gerado
 *   pdf_gerado → [upload/route] → enviado (hash calculado no upload)
 *
 * ✅ SEMPRE: PDF físico gerado → emissor faz upload → hash calculado no upload
 */
export async function gerarPDFLaudo(
  loteId: number,
  emissorCpf: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session?: any
): Promise<ResultadoEmissaoLaudo> {
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

    // Imutabilidade: bloqueia regeneração após qualquer estágio pós-rascunho
    if (
      status === 'pdf_gerado' ||
      status === 'emitido' ||
      status === 'enviado'
    ) {
      throw new Error(
        `Laudo ${laudoId} já foi gerado (status=${status}) e não pode ser regenerado (princípio da imutabilidade)`
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

    // Footer do PDF: posicionado 8mm acima do fim da página.
    const now = new Date();
    const footerDateStr = `${formatarDataApenasData(now)} ${formatarHora(now)}`;
    const footerHtml = `<div style="position:absolute;bottom:8mm;left:0;right:0;text-align:center;font-size:7pt;color:#6b7280;font-family:'Segoe UI',sans-serif;">Página <span class="pageNumber"></span> de <span class="totalPages"></span> | Lote #${loteId} | Data de Emissão: ${footerDateStr}</div>`;

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: footerHtml,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '22mm',
        left: '15mm',
      },
    });

    await browser.close();
    console.log(
      `[EMISSÃO] PDF gerado com sucesso (${pdfBuffer.byteLength} bytes)`
    );

    // ETAPA 5: Salvar PDF
    const storageDir = path.join(process.cwd(), 'storage', 'laudos');
    const fileName = `laudo-${laudoId}.pdf`;
    const filePath = path.join(storageDir, fileName);

    // Tenta salvar localmente (funciona em dev; em Vercel o FS é read-only)
    try {
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      fs.writeFileSync(filePath, Buffer.from(pdfBuffer));
      console.log(
        `[EMISSÃO] PDF (pré-assinatura) salvo localmente em ${filePath}`
      );
    } catch (fsErr) {
      console.warn(
        `[EMISSÃO] Filesystem indisponível para escrita (esperado em Vercel): ${(fsErr as Error).message}`
      );
    }

    // ─── Caminhar lote: concluido → emissao_solicitada → emissao_em_andamento → laudo_emitido ───
    // ⚠️ ORDEM CRÍTICA: caminhar lote ANTES de setar qualquer campo de emissão.
    // O trigger prevent_modification_lote_when_laudo_emitted bloqueia qualquer
    // UPDATE em lotes_avaliacao quando laudos.emitido_em IS NOT NULL.
    const stateWalk = [
      { from: 'concluido', to: 'emissao_solicitada' },
      { from: 'emissao_solicitada', to: 'emissao_em_andamento' },
      { from: 'emissao_em_andamento', to: 'laudo_emitido' },
    ] as const;
    let ultimoStatusAlcancado = 'rascunho';
    for (const step of stateWalk) {
      try {
        const resultado = await query(
          `UPDATE lotes_avaliacao
           SET status        = $1,
               atualizado_em = NOW()
           WHERE id = $2 AND status = $3
           RETURNING id, status`,
          [step.to, loteId, step.from],
          session
        );
        if (resultado && resultado.rowCount && resultado.rowCount > 0) {
          ultimoStatusAlcancado = step.to;
          console.log(
            `[EMISSÃO] ✅ Lote ${loteId} transicionado ${step.from} → ${step.to}`
          );
        } else {
          console.warn(
            `[EMISSÃO] Lote ${loteId} não estava em status '${step.from}', pulando para próxima transição`
          );
          // Não interromper — lote pode já estar em estado mais avançado
        }
      } catch (e) {
        console.error(
          `[EMISSÃO] ERRO ao transicionar lote ${loteId} ${step.from}→${step.to}:`,
          e instanceof Error ? e.message : e
        );
        break;
      }
    }
    console.log(
      `[EMISSÃO] Lote ${loteId} caminhado até '${ultimoStatusAlcancado}'.`
    );

    const updateResult = await query(
      `UPDATE laudos
       SET status        = 'pdf_gerado',
           pdf_gerado_em = NOW(),
           atualizado_em = NOW()
       WHERE id = $1 AND status = 'rascunho'
       RETURNING id`,
      [laudoId],
      session
    );

    if (!updateResult || updateResult.rowCount === 0) {
      throw new Error(
        'Falha ao atualizar laudo para pdf_gerado. Laudo pode já ter sido processado.'
      );
    }

    try {
      fs.writeFileSync(
        path.join(storageDir, `laudo-${laudoId}.json`),
        JSON.stringify(
          {
            laudo_id: laudoId,
            lote_id: loteId,
            emissor_cpf: emissorCpf,
            gerado_em: new Date().toISOString(),
            arquivo_local: fileName,
            tamanho_bytes: pdfBuffer.byteLength,
            status: 'pdf_gerado',
            observacao: 'Hash calculado no upload do PDF.',
          },
          null,
          2
        )
      );
    } catch {
      // Metadata local não é crítico em ambiente cloud
    }

    console.log(
      `[EMISSÃO] ✅ Laudo ${laudoId} em 'pdf_gerado'. Baixe e use "Enviar ao Bucket".`
    );

    return {
      laudoId,
      status: 'pdf_gerado',
      mensagem:
        'PDF gerado com sucesso. Baixe e clique em "Enviar ao Bucket".',
    };
  } catch (error) {
    // Se falhou, reverter para rascunho
    console.error(`[EMISSÃO] ❌ Erro ao gerar laudo ${laudoId}:`, error);
    await query(
      `UPDATE laudos
       SET status        = 'rascunho',
           hash_pdf      = NULL,
           emitido_em    = NULL,
           pdf_gerado_em = NULL,
           atualizado_em = NOW()
       WHERE id = $1`,

      [laudoId],
      session
    );
    throw error;
  }
}

// ─── ZapSign removido ────────────────────────────────────────────────────────
// enviarParaAssinaturaZapSign, ResultadoEnvioAssinatura e rotas /assinar,
// /confirmar-assinatura, /status-assinatura e /upload-assinado foram removidos.
// Para histórico completo, ver ZAPSIGN-DEPLOYMENT-STATUS.md

// ─── Stubs de compatibilidade (públicos) ────────────────────────────────────

/** @deprecated Use gerarPDFLaudo() */
export async function gerarLaudoCompletoEmitirPDF(
  loteId: number,
  emissorCpf: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session?: any
): Promise<ResultadoEmissaoLaudo> {
  return gerarPDFLaudo(loteId, emissorCpf, session);
}

export function emitirLaudosAutomaticamente(): Promise<void> {
  throw new Error('emitirLaudosAutomaticamente não implementado (stub)');
}

export function emitirLaudoImediato(): Promise<void> {
  throw new Error('emitirLaudoImediato não implementado (stub)');
}

