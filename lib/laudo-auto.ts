import crypto from 'crypto';
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
  criarDocumentoZapSign,
  isZapSignHabilitado,
} from '@/lib/integrations/zapsign/client';

// ─── Tipos de retorno ──────────────────────────────────────────────────────────

export interface ResultadoEmissaoLaudo {
  /** ID do laudo (= lote_id) */
  laudoId: number;
  /**
   * ZapSign: 'pdf_gerado' após geração local.
   * ZapSign após assinar: 'aguardando_assinatura'.
   * Legado: 'emitido' — hash calculado imediatamente.
   */
  status: 'pdf_gerado' | 'emitido' | 'aguardando_assinatura';
  /** Link direto de assinatura ZapSign */
  signUrl?: string;
  mensagem: string;
}

/**
 * 🔒 PRINCÍPIO DA IMUTABILIDADE DE LAUDOS
 *
 * Fluxo ZapSign (DISABLE_ZAPSIGN ≠ '1'):
 *   rascunho → [gerarPDFLaudo] → pdf_gerado
 *   pdf_gerado → [enviarParaAssinaturaZapSign] → aguardando_assinatura
 *   aguardando_assinatura → [webhook ZapSign] → enviado
 *
 * Fluxo legado (DISABLE_ZAPSIGN=1):
 *   rascunho → [gerarPDFLaudo] → emitido (hash calculado do PDF local)
 *
 * ❌ NUNCA calcular hash antes da assinatura digital (quando ZapSign habilitado)
 * ✅ SEMPRE: PDF físico → [opcional: ZapSign → assinatura] → hash → status final
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
      status === 'aguardando_assinatura' ||
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
    console.log(`[EMISSÃO] PDF (pré-assinatura) salvo em ${filePath}`);

    // ─── FORK: ZapSign ou legado ───────────────────────────────────────────
    if (isZapSignHabilitado()) {
      // ─── FLUXO ZAPSIGN ─────────────────────────────────────────────────
      // Não calcula hash aqui — hash calculado no webhook do PDF ASSINADO.
      // Não envia para ZapSign ainda — emissor clicará em "Assinar Digitalmente".

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

      const metaZap = {
        laudo_id: laudoId,
        lote_id: loteId,
        emissor_cpf: emissorCpf,
        gerado_em: new Date().toISOString(),
        arquivo_local: fileName,
        tamanho_bytes: pdfBuffer.byteLength,
        status: 'pdf_gerado',
      };
      fs.writeFileSync(
        path.join(storageDir, `laudo-${laudoId}.json`),
        JSON.stringify(metaZap, null, 2)
      );

      console.log(
        `[EMISSÃO] ✅ Laudo ${laudoId} com status 'pdf_gerado'. Clique em "Assinar Digitalmente" para enviar ao ZapSign.`
      );

      return {
        laudoId,
        status: 'pdf_gerado',
        mensagem:
          'PDF gerado com sucesso. Clique em "Assinar Digitalmente" para prosseguir.',
      };
    } else {
      // ─── FLUXO LEGADO (DISABLE_ZAPSIGN=1) ─────────────────────────────
      console.log(
        `[EMISSÃO] ZapSign desabilitado — fluxo legado (DISABLE_ZAPSIGN=1).`
      );

      const hashReal = crypto
        .createHash('sha256')
        .update(Buffer.from(pdfBuffer))
        .digest('hex');
      console.log(`[EMISSÃO] Hash SHA-256 calculado: ${hashReal}`);

      // ⚠️ ORDEM CRÍTICA (legado): caminhar lote ANTES de setar emitido_em.
      // O trigger prevent_modification_lote_when_laudo_emitted bloqueia qualquer
      // UPDATE em lotes_avaliacao quando laudos.emitido_em IS NOT NULL.
      // Portanto, o state walk deve ocorrer enquanto emitido_em ainda é NULL.
      const legadoStateWalk = [
        { from: 'concluido', to: 'emissao_solicitada' },
        { from: 'emissao_solicitada', to: 'emissao_em_andamento' },
        { from: 'emissao_em_andamento', to: 'laudo_emitido' },
      ] as const;
      for (const step of legadoStateWalk) {
        try {
          await query(
            `UPDATE lotes_avaliacao
             SET status        = $1,
                 atualizado_em = NOW()
             WHERE id = $2 AND status = $3`,
            [step.to, loteId, step.from],
            session
          );
        } catch (e) {
          console.warn(
            `[EMISSÃO] Aviso ao transicionar lote ${loteId} ${step.from}→${step.to}:`,
            e
          );
        }
      }
      console.log(
        `[EMISSÃO] Lote ${loteId} caminhado até 'laudo_emitido' (legado).`
      );

      const updateLegado = await query(
        `UPDATE laudos
         SET hash_pdf      = $1,
             status        = 'emitido',
             emitido_em    = NOW(),
             atualizado_em = NOW()
         WHERE id = $2 AND status = 'rascunho'
         RETURNING id`,
        [hashReal, laudoId],
        session
      );

      if (!updateLegado || updateLegado.rowCount === 0) {
        throw new Error(
          'Falha ao salvar hash do laudo. Laudo pode já ter sido emitido.'
        );
      }

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
            hash_sha256: hashReal,
            status: 'emitido',
          },
          null,
          2
        )
      );

      console.log(
        `[EMISSÃO] ✅ Laudo ${laudoId} emitido (legado). Use /api/emissor/laudos/[loteId]/upload para enviar ao bucket.`
      );

      return {
        laudoId,
        status: 'emitido',
        mensagem: 'Laudo gerado e emitido com sucesso.',
      };
    }
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

// ─── Função auxiliar: enviar PDF já gerado para assinatura ZapSign ────────────

export interface ResultadoEnvioAssinatura {
  laudoId: number;
  status: 'aguardando_assinatura';
  signUrl: string;
  mensagem: string;
}

/**
 * Envia o PDF já gerado (status='pdf_gerado') para assinatura digital via ZapSign.
 * Chamado via POST /api/emissor/laudos/[loteId]/assinar
 */
export async function enviarParaAssinaturaZapSign(
  loteId: number,
  emissorCpf: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session?: any
): Promise<ResultadoEnvioAssinatura> {
  const laudoId = loteId;

  const laudoResult = await query(
    `SELECT id, status FROM laudos WHERE lote_id = $1 LIMIT 1`,
    [loteId],
    session
  );

  if (laudoResult.rows.length === 0) {
    throw new Error(`Laudo para lote ${loteId} não encontrado`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const laudoStatus = (laudoResult.rows[0] as any).status as string;

  if (laudoStatus !== 'pdf_gerado') {
    throw new Error(
      `Laudo ${laudoId} está em status '${laudoStatus}' — esperado 'pdf_gerado'. ` +
        `Gere o PDF primeiro antes de assinar.`
    );
  }

  const storageDir = path.join(process.cwd(), 'storage', 'laudos');
  const pdfPath = path.join(storageDir, `laudo-${laudoId}.pdf`);

  if (!fs.existsSync(pdfPath)) {
    throw new Error(
      `Arquivo PDF não encontrado em ${pdfPath}. Regenere o laudo.`
    );
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64Pdf = pdfBuffer.toString('base64');

  // Buscar dados do emissor: primeiro em funcionarios, depois em usuarios (conta de sistema)
  const emissorFuncResult = await query(
    `SELECT nome, email FROM funcionarios 
     WHERE cpf = $1 AND ativo = true 
     AND perfil IN ('admin', 'rh', 'gestor', 'emissor', 'funcionario')
     LIMIT 1`,
    [emissorCpf],
    session
  );

  let emissorNome: string = emissorCpf;
  let emissorEmail: string | null = null;

  if (emissorFuncResult.rows.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row = emissorFuncResult.rows[0] as any;
    emissorNome = row.nome;
    emissorEmail = row.email || null;
    console.log(
      `[ASSINATURA] Emissor encontrado em funcionarios: ${emissorNome}`
    );
  } else {
    // Tentar na tabela usuarios (emissores são contas de sistema, não funcionários)
    const emissorUsuarioResult = await query(
      `SELECT nome, email FROM usuarios WHERE cpf = $1 AND ativo = true LIMIT 1`,
      [emissorCpf],
      session
    );
    if (emissorUsuarioResult.rows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = emissorUsuarioResult.rows[0] as any;
      emissorNome = row.nome;
      emissorEmail = row.email || null;
      console.log(
        `[ASSINATURA] Emissor encontrado em usuarios: ${emissorNome}`
      );
    }
  }

  // Fallback final: email da sessão (ex.: sessão criada com email)
  if (!emissorEmail && session?.email) {
    emissorEmail = session.email;
    if (session.nome) emissorNome = session.nome;
    console.log(
      `[ASSINATURA] Usando email da sessão: ${emissorNome} <${emissorEmail}>`
    );
  }

  if (!emissorEmail) {
    throw new Error(
      `Emissor ${emissorNome} (CPF ${emissorCpf}) não possui email cadastrado — necessário para ZapSign`
    );
  }

  const emissor = { nome: emissorNome, email: emissorEmail };

  console.log(
    `[ASSINATURA] Enviando laudo ${laudoId} ao ZapSign para assinatura por ${emissor.nome} <${emissor.email}>`
  );

  const { docToken, signerToken, signUrl } = await criarDocumentoZapSign({
    nome: `Laudo NR — Lote ${loteId}`,
    base64Pdf,
    nomeAssinante: emissor.nome,
    emailAssinante: emissor.email,
    enviarEmailAutomatico: true,
  });

  console.log(
    `[ASSINATURA] Documento criado no ZapSign: doc_token=${docToken}`
  );

  const updateResult = await query(
    `UPDATE laudos
     SET status               = 'aguardando_assinatura',
         zapsign_doc_token    = $1,
         zapsign_signer_token = $2,
         zapsign_sign_url     = $3,
         zapsign_status       = 'pending',
         atualizado_em        = NOW()
     WHERE id = $4 AND status = 'pdf_gerado'
     RETURNING id`,
    [docToken, signerToken, signUrl, laudoId],
    session
  );

  if (!updateResult || updateResult.rowCount === 0) {
    throw new Error(
      'Falha ao atualizar laudo para aguardando_assinatura. O laudo pode ter mudado de status.'
    );
  }

  // Atualizar metadata JSON
  const metaPath = path.join(storageDir, `laudo-${laudoId}.json`);
  try {
    const existing = fs.existsSync(metaPath)
      ? (JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as Record<
          string,
          unknown
        >)
      : {};
    fs.writeFileSync(
      metaPath,
      JSON.stringify(
        {
          ...existing,
          zapsign_doc_token: docToken,
          zapsign_signer_token: signerToken,
          sign_url: signUrl,
          status: 'aguardando_assinatura',
          enviado_zapsign_em: new Date().toISOString(),
        },
        null,
        2
      )
    );
  } catch {
    // Falha no metadata não é crítica
  }

  console.log(
    `[ASSINATURA] ✅ Laudo ${laudoId} enviado ao ZapSign. Aguardando assinatura digital.`
  );

  return {
    laudoId,
    status: 'aguardando_assinatura',
    signUrl,
    mensagem:
      'Laudo enviado para assinatura digital. Um email foi enviado ao emissor com o link para assinar.',
  };
}

// ─── Stubs de compatibilidade ─────────────────────────────────────────────────

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
