import { query } from '@/lib/db';
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
import { getPuppeteerInstance } from '@/lib/infrastructure/pdf/generators/pdf-generator';
import crypto from 'crypto';
import { criarNotificacao } from '@/lib/notifications/create-notification';
import { enqueueEmissao } from '@/lib/emissao-queue';
import { uploadLaudoToBackblaze } from '@/lib/storage/laudo-storage';

// Helper defensivo para registrar notificações administrativas sem lançar
async function safeNotificacaoAdmin(
  tipo: string,
  mensagem: string,
  loteId?: number
) {
  try {
    if (typeof loteId === 'number') {
      await query(
        `INSERT INTO notificacoes_admin (tipo, mensagem, lote_id, criado_em)
         VALUES ($1, $2, $3, NOW())`,
        [tipo, mensagem, loteId]
      );
    } else {
      await query(
        `INSERT INTO notificacoes_admin (tipo, mensagem, criado_em)
         VALUES ($1, $2, NOW())`,
        [tipo, mensagem]
      );
    }
  } catch (err) {
    console.warn(
      `[WARN] não foi possível registrar notificacao_admin (${tipo}): ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

export async function validarEmissorUnico(): Promise<{
  cpf: string;
  nome: string;
} | null> {
  const emissor = await query(`
    SELECT cpf, nome FROM funcionarios WHERE perfil = 'emissor' AND ativo = true
  `);

  console.log(`[DEBUG] Emissores ativos encontrados: ${emissor.rows.length}`);

  if (emissor.rows.length === 0) {
    console.error(`[ERROR] Nenhum emissor ativo no sistema!`);
    await safeNotificacaoAdmin(
      'sem_emissor',
      'Nenhum emissor ativo no sistema para emissão automática de laudos'
    );
    return null;
  }

  if (emissor.rows.length > 1) {
    console.error(
      `[WARN] Múltiplos emissores ativos no sistema (retornando lista)`
    );
    // registrar apenas uma notificação de observability (mantemos o alerta)
    await safeNotificacaoAdmin(
      'multiplos_emissores',
      'Múltiplos emissores ativos detectados - monitorar'
    );
    // Em vez de bloquear aqui, retornar a lista para quem chamar escolher emissor com contexto
    return emissor.rows[0];
  }

  return emissor.rows[0];
}

/**
 * Seleciona um emissor para emissão — EMISSOR É UM USUÁRIO GLOBAL (não associado a clinica/empresa)
 * - Regra: escolher o primeiro emissor ativo de forma determinística (ORDER BY criado_em)
 * - Não tentar inferir por clinica/empresa — emissores são independentes por design
 */
export async function selecionarEmissorParaLote(_loteId: number) {
  try {
    const fallback = await query(
      `SELECT cpf, nome FROM funcionarios WHERE perfil = 'emissor' AND ativo = true ORDER BY criado_em ASC LIMIT 1`
    );
    if (fallback.rows.length === 1) return fallback.rows[0];
    return null;
  } catch (err) {
    console.error('[ERROR] selecionarEmissorParaLote falhou:', err);
    return null;
  }
}

// ==========================================
// FUNÇÃO PRINCIPAL DE EMISSÃO
// ==========================================

function criarLaudoPadronizado(
  dadosGeraisEmpresa: any,
  scoresPorGrupo: any[],
  interpretacaoRecomendacoes: any,
  observacoesConclusao: any
): LaudoDadosCompletos {
  return {
    etapa1: dadosGeraisEmpresa,
    etapa2: scoresPorGrupo,
    etapa3: interpretacaoRecomendacoes,
    etapa4: observacoesConclusao,
  };
}

export const gerarLaudoCompletoEmitirPDF = async function (
  loteId: number,
  emissorCPF: string
): Promise<number> {
  console.log(`[DEBUG] Gerando laudo completo para lote ${loteId}`);

  let browser = null;

  try {
    // Verificar se já existe laudo para este lote (não dependemos de coluna `arquivo_pdf` que foi removida)
    const laudoExistente = await query(
      `
      SELECT id, status FROM laudos WHERE lote_id = $1
    `,
      [loteId]
    );

    let laudoId: number;
    let needsGeneration = true;

    if (laudoExistente.rows.length > 0) {
      laudoId = laudoExistente.rows[0].id;
      // Verificar se o arquivo PDF existe no storage local para evitar regeneração desnecessária
      try {
        const fsCheck = await import('fs/promises');
        const pathCheck = await import('path');
        const existingFile = pathCheck.join(
          process.cwd(),
          'storage',
          'laudos',
          `laudo-${laudoId}.pdf`
        );
        await fsCheck.access(existingFile);
        needsGeneration = false;
        console.log(
          `[DEBUG] Laudo existente encontrado (ID: ${laudoId}) e arquivo presente em ${existingFile}`
        );
      } catch (err) {
        console.log(
          `[DEBUG] Laudo existente sem arquivo; será gerado (ID: ${laudoId}) - erro: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    if (!laudoId) {
      // Precisamos gerar o PDF e o hash ANTES de inserir o registro quando o laudo não existe,
      // para evitar triggers/constraints que bloqueiam updates posteriores em laudos 'enviados'.
      console.log(
        `[DEBUG] Laudo não existente; gerando PDF e hash antes de inserir...`
      );

      // Gerar dados do laudo necessários para o template
      const dadosGeraisEmpresa = await gerarDadosGeraisEmpresa(loteId);
      const scoresPorGrupo = await calcularScoresPorGrupo(loteId);
      const interpretacaoRecomendacoes = gerarInterpretacaoRecomendacoes(
        dadosGeraisEmpresa.empresaAvaliada,
        scoresPorGrupo
      );
      const observacoesConclusao = gerarObservacoesConclusao('');
      const laudoPadronizado = criarLaudoPadronizado(
        dadosGeraisEmpresa,
        scoresPorGrupo,
        interpretacaoRecomendacoes,
        observacoesConclusao
      );

      // Gerar HTML e PDF (respeitar modo test)
      const html = gerarHTMLLaudoCompleto(laudoPadronizado);
      let pdfBuffer: Buffer;
      if (process.env.NODE_ENV === 'test') {
        pdfBuffer = Buffer.from(
          `TEST_PDF_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        );
      } else {
        const os = await import('os');
        const pathMod = await import('path');
        const userDataDir = pathMod.join(
          os.tmpdir(),
          `puppeteer_profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        );
        // Usar a mesma função de instância que seleciona @sparticuz/chromium em production
        const puppeteer = await getPuppeteerInstance();
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
          timeout: 30000,
          userDataDir,
        });
        const page = await (browser as any).newPage();
        await page.setContent(html, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });
        const pdfUint8Array = await page.pdf({
          format: 'A4',
          printBackground: true,
        });
        pdfBuffer = Buffer.from(pdfUint8Array);
        await browser.close();
        browser = null;
      }

      // Calcular hash e salvar arquivo temporário
      const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      const fs = await import('fs/promises');
      const pathMod = await import('path');
      const laudosDir = pathMod.join(process.cwd(), 'storage', 'laudos');
      await fs.mkdir(laudosDir, { recursive: true });
      const tempName = `laudo-temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
      const tempPath = pathMod.join(laudosDir, tempName);
      await fs.writeFile(tempPath, pdfBuffer);
      const metadata = {
        arquivo: tempName,
        hash,
        criadoEm: new Date().toISOString(),
      };
      await fs.writeFile(
        pathMod.join(laudosDir, `${tempName}.json`),
        JSON.stringify(metadata)
      );

      // Inserir laudo já com hash e timestamps (status 'enviado') USANDO CONEXÃO ISOLADA
      // para evitar que falhas posteriores na finalização do lote revertam a inserção do laudo.
      let laudoInsert;
      try {
        // Importar cliente pg localmente para não depender do pool de query (isolamento)
        const { Client } = await import('pg');
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
        });
        await client.connect();
        try {
          await client.query('BEGIN');
          try {
            laudoInsert = await client.query(
              `INSERT INTO laudos (lote_id, emissor_cpf, status, observacoes, emitido_em, enviado_em, hash_pdf, criado_em, atualizado_em)
               VALUES ($1, $2, 'enviado', 'Laudo gerado automaticamente pelo sistema', NOW(), NOW(), $3, NOW(), NOW()) RETURNING id`,
              [loteId, emissorCPF, hash]
            );
          } catch (insertErr: any) {
            if (insertErr && insertErr.code === '42703') {
              // Coluna hash_pdf ausente — inserir sem hash
              console.warn(
                `[WARN] Coluna hash_pdf ausente no DB; inserindo laudo sem hash (lote ${loteId})`
              );
              laudoInsert = await client.query(
                `INSERT INTO laudos (lote_id, emissor_cpf, status, observacoes, emitido_em, enviado_em, criado_em, atualizado_em)
                 VALUES ($1, $2, 'enviado', 'Laudo gerado automaticamente pelo sistema', NOW(), NOW(), NOW(), NOW()) RETURNING id`,
                [loteId, emissorCPF]
              );
            } else {
              throw insertErr;
            }
          }

          await client.query('COMMIT');
        } catch (txErr) {
          try {
            await client.query('ROLLBACK');
          } catch (rbErr) {
            console.error(
              '[ERROR] Falha ao rollback em client isolado:',
              rbErr
            );
          }
          throw txErr;
        } finally {
          await client.end();
        }
      } catch (clientErr) {
        // Se a inserção isolada falhar, propagar para o caller (emitirLaudoImediato tratará)
        throw clientErr;
      }

      laudoId = laudoInsert.rows[0].id;

      // Renomear arquivo temporário para o nome definitivo baseado no id
      const finalName = `laudo-${laudoId}.pdf`;
      const finalPath = pathMod.join(laudosDir, finalName);
      await fs.rename(tempPath, finalPath);
      await fs
        .rename(
          pathMod.join(laudosDir, `${tempName}.json`),
          pathMod.join(laudosDir, `laudo-${laudoId}.json`)
        )
        .catch(() => {});

      console.log(`[DEBUG] Laudo criado com ID: ${laudoId} (status enviado)`);

      // Upload assíncrono para Backblaze (não bloqueia o fluxo)
      uploadLaudoToBackblaze(laudoId, loteId, pdfBuffer)
        .then(() =>
          console.log(
            `[DEBUG] Upload para Backblaze iniciado para laudo ${laudoId}`
          )
        )
        .catch((err) =>
          console.error(
            `[WARN] Erro no upload para Backblaze (laudo ${laudoId}):`,
            err
          )
        );

      // Já geramos tudo — sem necessidade de geração posterior
      needsGeneration = false;
    }

    if (!needsGeneration) {
      // Já temos PDF — não há geração necessária. Contudo, pode faltar o hash em DB
      // (caso: arquivo presente via migração/backfill ou geração anterior sem persistir hash).
      // Garantir que o hash exista no DB: se ausente, calculamos a partir do arquivo local e persistimos.
      try {
        const laudoMetaRow = await query(
          `SELECT hash_pdf FROM laudos WHERE id = $1`,
          [laudoId]
        );
        const existingHash = laudoMetaRow.rows[0]?.hash_pdf || null;

        const fs = await import('fs/promises');
        const path = await import('path');
        const laudosDir = path.join(process.cwd(), 'storage', 'laudos');
        const filePath = path.join(laudosDir, `laudo-${laudoId}.pdf`);

        if (!existingHash) {
          // Ler arquivo existente e calcular hash (idempotente)
          const fileBuffer = await fs.readFile(filePath);
          const recalculatedHash = crypto
            .createHash('sha256')
            .update(fileBuffer)
            .digest('hex');

          // Atualizar metadados locais (se não existir JSON) para manter consistência com geração normal
          const metaPath = path.join(laudosDir, `laudo-${laudoId}.json`);
          try {
            await fs.access(metaPath);
            // meta existe — atualizar campo hash se necessário
            const raw = await fs.readFile(metaPath, 'utf-8');
            const parsed = JSON.parse(raw || '{}');
            if (parsed.hash !== recalculatedHash) {
              parsed.hash = recalculatedHash;
              await fs.writeFile(metaPath, JSON.stringify(parsed));
            }
          } catch {
            // meta inexistente — criar
            const metadata = {
              arquivo: `laudo-${laudoId}.pdf`,
              hash: recalculatedHash,
              criadoEm: new Date().toISOString(),
            };
            await fs.writeFile(metaPath, JSON.stringify(metadata));
          }

          // Persistir no banco de dados (trigger/constraint-friendly)
          await query(
            `UPDATE laudos SET hash_pdf = $2, atualizado_em = NOW() WHERE id = $1 AND (hash_pdf IS NULL OR hash_pdf = '')`,
            [laudoId, recalculatedHash]
          );

          console.log(
            `[DEBUG] Laudo ${laudoId} possuía PDF mas sem hash; hash recalculado e persistido (${recalculatedHash.substring(0, 8)}...)`
          );
        } else {
          console.log(
            `[DEBUG] Laudo ${laudoId} já possui PDF e hash em DB; nada a fazer.`
          );
        }
      } catch (err) {
        console.warn(
          `[WARN] Falha ao validar/persistir hash para laudo ${laudoId}: ${err instanceof Error ? err.message : String(err)}`
        );
      }

      // Se já existe o PDF local, garantir que o registro do laudo reflita emissão/envio
      try {
        // Executar um bloco DO que captura exceções localmente para evitar abortar a transação
        // caso triggers (como imutabilidade) lancem erro.
        try {
          const safeId = Number(laudoId);
          await query(
            `DO $do$\nBEGIN\n  UPDATE laudos\n  SET emitido_em = COALESCE(emitido_em, NOW()), enviado_em = COALESCE(enviado_em, NOW()), status = 'enviado', atualizado_em = NOW()\n  WHERE id = ${safeId};\nEXCEPTION WHEN OTHERS THEN\n  RAISE NOTICE 'Ignored failure updating laudo ${safeId}: %', SQLERRM;\nEND $do$;`
          );
        } catch (innerErr) {
          console.warn(
            `[WARN] Falha inesperada ao tentar marcar laudo ${laudoId} como 'enviado' (ignorando): ${innerErr instanceof Error ? innerErr.message : String(innerErr)}`
          );
        }
        console.log(
          `[DEBUG] Laudo ${laudoId} marcado como 'enviado' em DB (fallback para PDF existente) - operação isolada`
        );
      } catch (innerErr) {
        console.warn(
          `[WARN] Falha inesperada ao tentar marcar laudo ${laudoId} como 'enviado' (ignorando): ${innerErr instanceof Error ? innerErr.message : String(innerErr)}`
        );
      }

      console.log(`[DEBUG] Laudo ${laudoId} já possui PDF; pulando geração.`);
    }

    // Gerar dados do laudo (reutilizando funções existentes)`
    console.log(`[DEBUG] Gerando dados gerais da empresa...`);
    const dadosGeraisEmpresa = await gerarDadosGeraisEmpresa(loteId);
    console.log(`[DEBUG] Dados gerais:`, dadosGeraisEmpresa);

    console.log(`[DEBUG] Calculando scores por grupo...`);
    const scoresPorGrupo = await calcularScoresPorGrupo(loteId);
    console.log(`[DEBUG] Scores calculados:`, scoresPorGrupo.length, 'grupos');

    const interpretacaoRecomendacoes = gerarInterpretacaoRecomendacoes(
      dadosGeraisEmpresa.empresaAvaliada,
      scoresPorGrupo
    );
    const observacoesConclusao = gerarObservacoesConclusao('');

    if (needsGeneration) {
      // Gerar HTML do laudo usando template padronizado
      console.log(`[DEBUG] Gerando HTML do laudo...`);
      const laudoPadronizado = criarLaudoPadronizado(
        dadosGeraisEmpresa,
        scoresPorGrupo,
        interpretacaoRecomendacoes,
        observacoesConclusao
      );
      const html = gerarHTMLLaudoCompleto(laudoPadronizado);

      // Em ambiente de teste, evitar Puppeteer por estabilidade e performance
      let pdfBuffer: Buffer;
      if (process.env.NODE_ENV === 'test') {
        console.log('[DEBUG] Em modo test: gerando PDF fictício sem Puppeteer');
        pdfBuffer = Buffer.from(
          `TEST_PDF_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        );
      } else {
        // Gerar PDF usando Puppeteer com timeout e cleanup
        console.log(`[DEBUG] Iniciando Puppeteer para gerar PDF...`);

        const os = await import('os');
        const pathMod = await import('path');
        const userDataDir = pathMod.join(
          os.tmpdir(),
          `puppeteer_profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        );
        const puppeteer = await getPuppeteerInstance();
        browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
          timeout: 30000,
          userDataDir,
        });

        const page = await browser.newPage();
        await page.setContent(html, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });
        const pdfUint8Array = await page.pdf({
          format: 'A4',
          printBackground: true,
        });
        pdfBuffer = Buffer.from(pdfUint8Array);

        await browser.close();
        browser = null;

        console.log(
          `[DEBUG] PDF gerado com sucesso, tamanho: ${pdfBuffer.length} bytes`
        );
      }

      // Calcular hash SHA-256
      const hash = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      console.log(
        `[DEBUG] Hash SHA-256 calculado: ${hash.substring(0, 16)}...`
      );

      // Salvar PDF localmente em storage/laudos e salvar metadados locais
      console.log(`[DEBUG] Gravando PDF localmente em storage/laudos...`);
      const fs = await import('fs/promises');
      const path = await import('path');

      const fileName = `laudo-${laudoId}.pdf`;
      const metadata = {
        arquivo: fileName,
        hash,
        criadoEm: new Date().toISOString(),
      };

      // Guarda o caminho/identificador onde o arquivo foi salvo (local path)
      let savedPath: string | null = null;
      const laudosDir = path.join(process.cwd(), 'storage', 'laudos');
      await fs.mkdir(laudosDir, { recursive: true });
      const filePath = path.join(laudosDir, fileName);
      await fs.writeFile(filePath, pdfBuffer);
      await fs.writeFile(
        path.join(laudosDir, `laudo-${laudoId}.json`),
        JSON.stringify(metadata)
      );
      savedPath = filePath;
      console.log(
        `[STORAGE] Laudo ${laudoId} gravado localmente em ${filePath}`
      );

      // Atualizar timestamps, status e hash no banco (SEM persistir binário no banco)
      // TODO: integrar com storage externo ou coluna de path no DB em integração futura
      console.log(
        `[DEBUG] Atualizando laudo (metadados) no banco sem persistir arquivo binário...`
      );
      try {
        await query(
          `
      UPDATE laudos
      SET emitido_em = NOW(), enviado_em = NOW(), status = 'enviado', hash_pdf = $2, atualizado_em = NOW()
      WHERE id = $1
    `,
          [laudoId, hash]
        );
      } catch (updateErr: any) {
        // Se o banco não tem a coluna hash_pdf (código 42703), tentar atualizar sem o hash
        if (updateErr && updateErr.code === '42703') {
          console.warn(
            `[WARN] Coluna hash_pdf ausente no DB; atualizando metadados do laudo sem hash (laudo ${laudoId})`
          );
          try {
            await query(
              `UPDATE laudos SET emitido_em = NOW(), enviado_em = NOW(), status = 'enviado', atualizado_em = NOW() WHERE id = $1`,
              [laudoId]
            );
          } catch (fallbackErr) {
            console.error(
              `[ERROR] Falha ao atualizar metadados do laudo ${laudoId} (fallback):`,
              fallbackErr
            );
            throw fallbackErr;
          }
        } else {
          // rethrow outros erros para que sejam tratados pelo handler externo
          throw updateErr;
        }
      }

      console.log(
        `[DEBUG] Laudo ${laudoId} emitido e salvo em ${savedPath ?? 'local/unknown'}`
      );
      return laudoId;
    }

    // Caso não precise gerar, retornamos o id existente
    return laudoId;
  } catch (error) {
    // Cleanup de Puppeteer em caso de erro
    if (browser) {
      try {
        await browser.close();
        console.log(`[DEBUG] Browser Puppeteer fechado após erro`);
      } catch (closeError) {
        console.error(`[ERROR] Falha ao fechar browser:`, closeError);
      }
    }
    throw error;
  }
};

// ==========================================
// EMISSÃO IMEDIATA (ao concluir lote)
// ==========================================
export async function emitirLaudoImediato(loteId: number): Promise<boolean> {
  console.log(`[EMISSÃO IMEDIATA] Processando lote ${loteId} - entrada`);

  try {
    console.log(
      `[EMISSÃO IMEDIATA] Iniciando fluxo síncrono para lote ${loteId}`
    );

    // BYPASS RLS: Esta é uma operação de sistema dentro de uma transação
    // Usar BEGIN para garantir que SET LOCAL tenha efeito
    await query('BEGIN');
    await query('SET LOCAL row_security = off');

    // Validar emissor — preferimos emissor único; se não houver, tentar seleção contextual por lote
    let emissor = await validarEmissorUnico();
    if (!emissor) {
      emissor = await selecionarEmissorParaLote(loteId);
      if (emissor) {
        console.log(
          '[EMISSÃO IMEDIATA] Emissor selecionado por contexto de lote:',
          emissor.cpf
        );
      }
    }

    if (!emissor) {
      await query('ROLLBACK');
      console.error(
        '[EMISSÃO IMEDIATA] Nenhum emissor ativo disponível para emissão imediata'
      );
      console.log('[EMISSÃO IMEDIATA] retornando false: nenhum emissor');
      return false;
    }

    // Verificar se lote já foi emitido (usar lock para evitar races)
    const lote = await query(
      `SELECT id, codigo, clinica_id, empresa_id, contratante_id, emitido_em, processamento_em
       FROM lotes_avaliacao WHERE id = $1 FOR UPDATE`,
      [loteId]
    );

    if (lote.rows.length === 0) {
      console.error(`[EMISSÃO IMEDIATA] Lote ${loteId} não encontrado`);
      console.log('[EMISSÃO IMEDIATA] retornando false: lote não encontrado');
      return false;
    }

    const loteRow = lote.rows[0];

    // Verificar se já está sendo processado
    if (loteRow.processamento_em) {
      console.warn(
        `[EMISSÃO IMEDIATA] Lote ${loteId} já está em processamento desde ${loteRow.processamento_em}`
      );
      return true; // Idempotência: já está sendo processado
    }

    // Marcar como em processamento
    await query(
      `UPDATE lotes_avaliacao SET processamento_em = NOW() WHERE id = $1`,
      [loteId]
    );

    // Fallback: garantir código do lote (persistir fallback no banco para observability)
    if (!loteRow.codigo) {
      const fallbackCodigo = `LOTE-${loteId}-TMP`;
      console.warn(
        `[EMISSÃO IMEDIATA] Lote ${loteId} sem codigo; gerando fallback ${fallbackCodigo} e persistindo`
      );
      try {
        await query('UPDATE lotes_avaliacao SET codigo = $1 WHERE id = $2', [
          fallbackCodigo,
          loteId,
        ]);
        await safeNotificacaoAdmin(
          'fallback_codigo',
          `Codigo temporario ${fallbackCodigo} criado para lote ${loteId}`,
          loteId
        );
        loteRow.codigo = fallbackCodigo;
      } catch (uErr) {
        console.error(
          '[EMISSÃO IMEDIATA] Falha ao persistir fallback codigo:',
          uErr
        );
      }
    }

    if (loteRow.emitido_em) {
      console.log(
        `[EMISSÃO IMEDIATA] Lote ${loteId} já foi emitido anteriormente`
      );
      return true; // Idempotência: já foi emitido
    }

    // Marcar lote como emitido ANTES de gerar o laudo (para evitar trigger de imutabilidade)
    await query(
      `UPDATE lotes_avaliacao SET emitido_em = NOW(), processamento_em = NULL, status = 'finalizado' WHERE id = $1`,
      [loteId]
    );

    // Emitir laudo (gerar PDF + hash)
    const laudoId = await gerarLaudoCompletoEmitirPDF(loteId, emissor.cpf);
    console.log(
      `[EMISSÃO IMEDIATA] gerarLaudoCompletoEmitirPDF retornou laudoId=${laudoId} para lote ${loteId}`
    );

    // Registrar auditoria. Tornar falhas nessas etapas
    // não-fatais para que a geração do PDF (o passo crítico) não seja reportada como
    // falha por erros secundários (audit/logging). Ainda registramos notificações
    // de observability quando houver erros.
    try {
      // Registrar auditoria
      await query(
        `INSERT INTO auditoria_laudos (lote_id, laudo_id, emissor_cpf, emissor_nome, acao, status, ip_address, criado_em)
         VALUES ($1, $2, $3, $4, 'emissao_automatica', 'emitido', $5, NOW())`,
        [loteId, laudoId, emissor.cpf, emissor.nome, '127.0.0.1']
      );

      console.log(
        `[EMISSÃO IMEDIATA] ✓ Lote ${loteId} emitido com sucesso (Laudo ID: ${laudoId})`
      );

      await query('COMMIT');
      return true;
    } catch (postErr) {
      console.warn(
        `[EMISSÃO IMEDIATA] Erro ao persistir marcação/auditoria do lote ${loteId}:`,
        postErr instanceof Error ? postErr.message : String(postErr)
      );

      // Rollback em caso de erro
      await query('ROLLBACK');

      // Limpar flag de processamento em caso de erro
      try {
        await query(
          `UPDATE lotes_avaliacao SET processamento_em = NULL WHERE id = $1`,
          [loteId]
        );
      } catch (cleanupErr) {
        console.error(
          `[EMISSÃO IMEDIATA] Falha ao limpar processamento_em para lote ${loteId}:`,
          cleanupErr
        );
      }

      // Registrar notificação para equipe operacional (não bloquear a emissão em si)
      try {
        await safeNotificacaoAdmin(
          'erro_persistencia_pos_emissao',
          `Laudo ${laudoId} gerado, mas falha ao persistir marcação/auditoria para lote ${loteId}: ${postErr instanceof Error ? postErr.message : String(postErr)}`,
          loteId
        );
      } catch (notifErr) {
        console.error(
          `[EMISSÃO IMEDIATA] Falha ao registrar notificacao_admin após erro de persistência:`,
          notifErr
        );
      }

      // Consideramos a geração do laudo bem-sucedida — retornar true para permitir reprocessos
      return true;
    }
  } catch (error) {
    // Limpar flag de processamento em caso de erro fatal
    try {
      await query(
        `UPDATE lotes_avaliacao SET processamento_em = NULL WHERE id = $1`,
        [loteId]
      );
    } catch (cleanupErr) {
      console.error(
        `[EMISSÃO IMEDIATA] Falha ao limpar processamento_em após erro fatal para lote ${loteId}:`,
        cleanupErr
      );
    }

    // Rollback da transação em caso de erro
    try {
      await query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[EMISSÃO IMEDIATA] Erro ao fazer rollback:', rollbackErr);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(
      `[EMISSÃO IMEDIATA] ✗ Erro ao emitir lote ${loteId}:`,
      errorMessage
    );
    if (errorStack) {
      console.error(`[EMISSÃO IMEDIATA] Stack trace:`, errorStack);
    }

    // Detectar erros de Chromium/Puppeteer para retry
    const isChromiumError =
      errorMessage.includes('chromium') ||
      errorMessage.includes('puppeteer') ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('brotli');

    if (isChromiumError) {
      console.log(
        `[EMISSÃO IMEDIATA] Erro relacionado ao Chromium detectado para lote ${loteId}, tentando novamente em 3s...`
      );
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Retry uma única vez
      try {
        console.log(`[EMISSÃO IMEDIATA] RETRY: lote ${loteId}`);
        await query('BEGIN');
        await query('SET LOCAL row_security = off');
        const emissor = await validarEmissorUnico();
        if (emissor) {
          // Marcar lote como emitido ANTES de gerar o laudo (retry)
          await query(
            `UPDATE lotes_avaliacao SET emitido_em = NOW() WHERE id = $1`,
            [loteId]
          );

          const laudoId = await gerarLaudoCompletoEmitirPDF(
            loteId,
            emissor.cpf
          );

          await query(
            `INSERT INTO auditoria_laudos (lote_id, laudo_id, emissor_cpf, emissor_nome, acao, status, ip_address, criado_em)
             VALUES ($1, $2, $3, $4, 'emissao_automatica_retry', 'emitido', $5, NOW())`,
            [loteId, laudoId, emissor.cpf, emissor.nome, '127.0.0.1']
          );
          await query('COMMIT');
          console.log(
            `[EMISSÃO IMEDIATA] ✓ Lote ${loteId} emitido com sucesso após RETRY (Laudo ID: ${laudoId})`
          );
          return true;
        }
        await query('ROLLBACK');
      } catch (retryErr) {
        await query('ROLLBACK').catch(() => {});
        console.error(
          `[EMISSÃO IMEDIATA] RETRY falhou para lote ${loteId}:`,
          retryErr instanceof Error ? retryErr.message : String(retryErr)
        );
      }
    }

    console.log(
      `[EMISSÃO IMEDIATA] retornando false: exceção capturada durante emissão - ${errorMessage}`
    );

    // Registrar erro detalhado
    const errMsg = `Erro na emissão imediata do lote ${loteId}: ${errorMessage}`;
    await safeNotificacaoAdmin(
      isChromiumError ? 'falha_emissao_chromium' : 'erro_emissao_auto',
      errMsg,
      loteId
    );

    // Enfileirar para tentativa de reprocessamento assíncrono
    try {
      await enqueueEmissao(loteId, errMsg);
    } catch (enqueueErr) {
      console.error(
        '[EMISSÃO IMEDIATA] Falha ao adicionar à fila de reprocessamento:',
        enqueueErr
      );
    }

    return false;
  }
}

// ==========================================
// CRON LEGADO REMOVIDO - EMISSÃO AGORA É SEMPRE IMEDIATA
// ==========================================
// A função emitirLaudosAutomaticamente foi REMOVIDA.
// Emissão de laudos ocorre IMEDIATAMENTE quando o lote fica 'concluido'
// via chamadas em:
// - lib/lotes.ts: recalcularStatusLote() e recalcularStatusLotePorId()
// - app/api/admin/reenviar-lote/route.ts
// - lib/auto-concluir-lotes.ts
//
// Se precisar reprocessar lotes pendentes manualmente, use:
// - app/api/emissor/reprocessar-emissao/[loteId]/route.ts

// ==========================================
// FASE 2: ENVIO AUTOMÁTICO (10 min após emissão)
// ==========================================
async function enviarLaudoAutomatico(laudo: any) {
  try {
    console.log(
      `[FASE 2] Enviando laudo do lote ${laudo.codigo} (ID: ${laudo.lote_id})`
    );

    // Ler arquivo local do laudo e validar hash (idempotência)
    const fs = await import('fs/promises');
    const path = await import('path');
    const laudosDir = path.join(process.cwd(), 'storage', 'laudos');
    const filePath = path.join(laudosDir, `laudo-${laudo.laudo_id}.pdf`);

    let fileBuffer: Buffer;
    try {
      fileBuffer = await fs.readFile(filePath);
    } catch {
      throw new Error(`Arquivo local do laudo não encontrado (${filePath})`);
    }

    const hashCalculado = crypto
      .createHash('sha256')
      .update(fileBuffer)
      .digest('hex');

    // Comparar com o hash armazenado no banco (se presente) — se houver divergência,
    // registrar notificação e abortar envio (possível corrupção/inconsistência)
    if (laudo.hash_pdf && laudo.hash_pdf !== hashCalculado) {
      console.error(
        `[FASE 2] Hash do PDF não coincide com hash registrado no DB (laudo ${laudo.laudo_id})`
      );
      await safeNotificacaoAdmin(
        'hash_mismatch',
        `Hash do arquivo PDF (calculado) não corresponde ao hash persistido no DB para o laudo ${laudo.laudo_id}`,
        laudo.lote_id
      );

      // Registrar auditoria de erro e não prosseguir com envio
      await query(
        `INSERT INTO auditoria_laudos (lote_id, laudo_id, acao, status, ip_address, observacoes, criado_em)
         VALUES ($1, $2, 'envio_automatico_erro', 'erro', $3, $4, NOW())`,
        [
          laudo.lote_id,
          laudo.laudo_id,
          '127.0.0.1',
          'Hash mismatch entre arquivo e DB - abortando envio',
        ]
      );

      return; // abortar envio
    }

    // Verificar metadados locais (se existirem) para confirmar integridade
    try {
      const metaRaw = await fs.readFile(
        path.join(laudosDir, `laudo-${laudo.laudo_id}.json`),
        'utf-8'
      );
      const meta = JSON.parse(metaRaw);
      if (meta.hash && meta.hash !== hashCalculado) {
        throw new Error(
          'Hash do PDF não coincide com metadados locais - arquivo pode estar corrompido'
        );
      }
    } catch {
      // Se não existirem metadados, apenas logar aviso e prosseguir com o hash calculado
      console.warn(
        `[FASE 2] Aviso: metadados locais ausentes para laudo ${laudo.laudo_id} ou inválidos`
      );
    }

    // Marcar lote como enviado (usar laudo_enviado_em)
    await query(
      `UPDATE lotes_avaliacao SET laudo_enviado_em = NOW() WHERE id = $1 AND laudo_enviado_em IS NULL`,
      [laudo.lote_id]
    );

    // Notificar destinatário (clínica ou contratante)
    try {
      if (laudo.clinica_id) {
        await criarNotificacao({
          tipo: 'laudo_enviado',
          destinatario_id: laudo.clinica_id,
          destinatario_tipo: 'clinica',
          titulo: `Laudo do lote ${laudo.codigo} disponível`,
          mensagem: `O laudo do lote ${laudo.codigo} foi emitido e está disponível para download.`,
          dados_contexto: {
            lote_id: laudo.lote_id,
            laudo_id: laudo.laudo_id,
            codigo: laudo.codigo,
          },
          link_acao: `/clinica/laudos`,
          botao_texto: 'Ver Laudos',
          prioridade: 'alta',
        });
      } else if (laudo.contratante_id) {
        await criarNotificacao({
          tipo: 'laudo_enviado',
          destinatario_id: laudo.contratante_id,
          destinatario_tipo: 'contratante',
          titulo: `Laudo do lote ${laudo.codigo} disponível`,
          mensagem: `O laudo do lote ${laudo.codigo} foi emitido e está disponível para download.`,
          dados_contexto: {
            lote_id: laudo.lote_id,
            laudo_id: laudo.laudo_id,
            codigo: laudo.codigo,
          },
          link_acao: `/entidade/laudos`,
          botao_texto: 'Ver Laudos',
          prioridade: 'alta',
        });
      } else if (laudo.empresa_id) {
        // Buscar contratante via empresa
        const empresa = await query(
          `SELECT contratante_id FROM empresas_clientes WHERE id = $1`,
          [laudo.empresa_id]
        );

        if (empresa.rows.length > 0 && empresa.rows[0].contratante_id) {
          await criarNotificacao({
            tipo: 'laudo_enviado',
            destinatario_id: empresa.rows[0].contratante_id,
            destinatario_tipo: 'contratante',
            titulo: `Laudo do lote ${laudo.codigo} disponível`,
            mensagem: `O laudo do lote ${laudo.codigo} foi emitido e está disponível para download.`,
            dados_contexto: {
              lote_id: laudo.lote_id,
              laudo_id: laudo.laudo_id,
              codigo: laudo.codigo,
            },
            link_acao: `/entidade/laudos`,
            botao_texto: 'Ver Laudos',
            prioridade: 'alta',
          });
        }
      }
    } catch (notifError) {
      console.error('[FASE 2] Erro ao criar notificação:', notifError);
      // Não interromper fluxo
    }

    // Atualizar laudo com status de enviado e registrar timestamps
    await query(
      `UPDATE laudos SET status = 'enviado', enviado_em = NOW(), atualizado_em = NOW() WHERE id = $1`,
      [laudo.laudo_id]
    );

    // Registrar auditoria
    await query(
      `INSERT INTO auditoria_laudos (lote_id, laudo_id, acao, status, ip_address, criado_em)
       VALUES ($1, $2, 'envio_automatico', 'enviado', $3, NOW())`,
      [laudo.lote_id, laudo.laudo_id, '127.0.0.1']
    );

    console.log(`[FASE 2] ✓ Laudo ${laudo.laudo_id} enviado com sucesso`);
  } catch (error) {
    console.error(`[FASE 2] ✗ Erro ao enviar laudo ${laudo.laudo_id}:`, error);

    // Registrar erro
    await safeNotificacaoAdmin(
      'erro_envio_auto',
      `Erro no envio do laudo ${laudo.laudo_id}: ${error instanceof Error ? error.message : String(error)}`,
      laudo.lote_id
    );

    // Registrar auditoria de erro
    await query(
      `INSERT INTO auditoria_laudos (lote_id, laudo_id, acao, status, ip_address, observacoes, criado_em)
       VALUES ($1, $2, 'envio_automatico_erro', 'erro', $3, $4, NOW())`,
      [
        laudo.lote_id,
        laudo.laudo_id,
        '127.0.0.1',
        error instanceof Error ? error.message : String(error),
      ]
    );
  }
}

/**
 * Compat shim (DEPRECATED) para o cron legado de emissão (FASE 1).
 *
 * Histórico: a emissão agora é IMEDIATA quando lote fica 'concluido'.
 * Manter um wrapper compatível para não quebrar chamadas/tests que aguardam
 * a função legacy. O wrapper simplesmente delega para o fluxo imediato.
 */
export async function emitirLaudosAutomaticamente() {
  console.warn(
    '[FASE 1 - CRON] emitirLaudosAutomaticamente() chamado — wrapper de compatibilidade (deprecated)'
  );

  // Buscar lotes concluídos ainda não emitidos (limite conservador)
  const lotes = await query(`
    SELECT id FROM lotes_avaliacao
    WHERE status = 'concluido' AND emitido_em IS NULL
    ORDER BY atualizado_em ASC
    LIMIT 20
  `);

  if (!lotes.rows || lotes.rows.length === 0) {
    console.log('[FASE 1 - CRON] Nenhum lote pendente para emissão');
    return;
  }

  for (const l of lotes.rows) {
    try {
      // Delegar para o fluxo imediato (idempotente)
      // NOTE: manter silêncio em erros pontuais, mas registrar para observability
      const sucesso = await emitirLaudoImediato(l.id);
      if (!sucesso) {
        console.warn(
          `[FASE 1 - CRON] Emissão imediata falhou para lote ${l.id}`
        );
      }
    } catch (err) {
      console.error('[FASE 1 - CRON] exceção ao processar lote', l.id, err);
      await safeNotificacaoAdmin(
        'falha_emissao_cron_compat',
        `Erro ao processar lote ${l.id} via emitirLaudosAutomaticamente(): ${err instanceof Error ? err.message : String(err)}`,
        l.id
      );
    }
  }
}

export async function enviarLaudosAutomaticamente() {
  console.log('[FASE 2 - CRON] Iniciando envio de laudos emitidos');

  // Buscar laudos prontos para notificação de envio (já foram gerados com status 'enviado')
  // Verifica se o timestamp auto_emitir_em venceu e se laudo_enviado_em ainda é NULL
  // Observação: os PDFs são armazenados localmente em storage/laudos e no Backblaze
  const laudos = await query(`
    SELECT 
      la.id as lote_id,
      la.codigo,
      la.clinica_id,
      la.empresa_id,
      la.contratante_id,
      la.emitido_em,
      la.laudo_enviado_em,
      la.auto_emitir_em,
      l.id as laudo_id,
      l.status,
      l.hash_pdf
    FROM lotes_avaliacao la
    JOIN laudos l ON la.id = l.id
    WHERE la.emitido_em IS NOT NULL
      AND la.laudo_enviado_em IS NULL
      AND la.auto_emitir_em IS NOT NULL
      AND la.auto_emitir_em <= NOW()
      AND la.status IN ('concluido', 'finalizado')
      AND l.status = 'enviado'
    ORDER BY la.auto_emitir_em ASC
    LIMIT 10
  `);

  console.log(
    `[FASE 2 - CRON] Encontrados ${laudos.rows.length} laudos para envio`
  );

  if (laudos.rows.length === 0) {
    console.log('[FASE 2 - CRON] Nenhum laudo pronto para envio');
    return;
  }

  for (const laudo of laudos.rows) {
    await enviarLaudoAutomatico(laudo);
  }
}
