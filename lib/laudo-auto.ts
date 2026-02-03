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

  // Validar que emissor foi fornecido
  if (!emissorCPF) {
    console.warn(
      `[WARN] Emissor não fornecido; tentando selecionar emissor válido automaticamente`
    );
    const selecionado = await selecionarEmissorParaLote(loteId);
    if (selecionado?.cpf) {
      console.log(`[INFO] Emissor selecionado: ${selecionado.cpf}`);
      emissorCPF = selecionado.cpf;
    } else {
      await safeNotificacaoAdmin(
        'sem_emissor_valido',
        `Tentativa de gerar laudo para lote ${loteId} falhou: emissor ausente`
      ).catch(() => {});
      throw new Error(
        'Emissor inválido: não é possível gerar laudo sem emissor válido'
      );
    }
  }

  let browser = null;

  try {
    // Verificar se já existe laudo para este lote (não dependemos de coluna `arquivo_pdf` que foi removida)
    const laudoExistente = await query(
      `
      SELECT id, status, emitido_em FROM laudos WHERE lote_id = $1
    `,
      [loteId]
    );

    let laudoId: number;
    let needsGeneration = true;
    let laudoAlreadyEmitted = false;

    if (laudoExistente.rows.length > 0) {
      laudoId = laudoExistente.rows[0].id;
      laudoAlreadyEmitted = Boolean(laudoExistente.rows[0].emitido_em);
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

        // Tentativa com retry para lidar com instabilidades eventuais do navegador
        const maxAttempts = 2;
        let attempt = 0;
        let lastErr: any = null;

        while (attempt < maxAttempts) {
          attempt += 1;
          try {
            console.log(
              `[DEBUG] Puppeteer: tentativa ${attempt} para gerar PDF (lote ${loteId})`
            );
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
            // Aumentar timeout de navegação para evitar falhas por páginas complexas
            try {
              if (
                typeof (page as any).setDefaultNavigationTimeout === 'function'
              ) {
                (page as any).setDefaultNavigationTimeout(120000);
              } else if (
                typeof (page as any).setDefaultTimeout === 'function'
              ) {
                (page as any).setDefaultTimeout(120000);
              }
            } catch {}

            await page.setContent(html, {
              waitUntil: 'networkidle0',
              timeout: 120000,
            });

            const pdfUint8Array = await page.pdf({
              format: 'A4',
              printBackground: true,
            });
            pdfBuffer = Buffer.from(pdfUint8Array);

            await browser.close();
            browser = null;

            console.log(
              `[DEBUG] Puppeteer: PDF gerado com sucesso na tentativa ${attempt} (lote ${loteId})`
            );
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            console.error(
              `[WARN] Falha na geração de PDF com Puppeteer na tentativa ${attempt} para lote ${loteId}:`,
              err instanceof Error ? err.message : String(err)
            );
            if (browser) {
              try {
                await (browser as any).close();
              } catch {}
              browser = null;
            }
            // Espera curta antes de tentar novamente
            if (attempt < maxAttempts)
              await new Promise((r) => setTimeout(r, 1000 * attempt));
          }
        }

        if (lastErr) {
          // Registrar notificação administrativa e propagar erro para que o caller trate
          await safeNotificacaoAdmin(
            'erro_geracao_pdf',
            `Falha ao gerar PDF para lote ${loteId}: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`,
            loteId
          ).catch(() => {});
          throw lastErr;
        }
      }

      // Calcular hash e salvar arquivo temporário
      const shouldSkipHash =
        process.env.SKIP_LAUDO_HASH === '1' ||
        process.env.SKIP_LAUDO_HASH === 'true';
      const hash = shouldSkipHash
        ? ''
        : crypto.createHash('sha256').update(pdfBuffer).digest('hex');
      const fs = await import('fs/promises');
      const pathMod = await import('path');
      const laudosDir = pathMod.join(process.cwd(), 'storage', 'laudos');
      await fs.mkdir(laudosDir, { recursive: true });
      const tempName = `laudo-temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
      const tempPath = pathMod.join(laudosDir, tempName);
      await fs.writeFile(tempPath, pdfBuffer);
      const metadata: any = {
        arquivo: tempName,
        criadoEm: new Date().toISOString(),
      };
      if (!shouldSkipHash) metadata.hash = hash;
      await fs.writeFile(
        pathMod.join(laudosDir, `${tempName}.json`),
        JSON.stringify(metadata)
      );

      // Inserir laudo já com timestamps (status 'enviado') USANDO CONEXÃO ISOLADA
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
          // Configurar contexto RLS para o cliente isolado (SET LOCAL não aceita parâmetros)
          await client.query(
            `SET LOCAL app.current_user_cpf = '${emissorCPF}'`
          );
          await client.query(`SET LOCAL app.current_user_perfil = 'emissor'`);
          await client.query(`SET LOCAL app.system_bypass = 'true'`);

          // Flag para indicar que fizemos ROLLBACK manualmente (evitar COMMIT)
          let rolledBack = false;

          try {
            if (shouldSkipHash) {
              laudoInsert = await client.query(
                `INSERT INTO laudos (id, lote_id, emissor_cpf, status, observacoes, emitido_em, criado_em, atualizado_em)
                 VALUES ($1, $1, $2, 'emitido', 'Laudo gerado pelo emissor', NOW(), NOW(), NOW()) RETURNING id`,
                [loteId, emissorCPF]
              );
            } else {
              laudoInsert = await client.query(
                `INSERT INTO laudos (id, lote_id, emissor_cpf, status, observacoes, emitido_em, hash_pdf, criado_em, atualizado_em)
                 VALUES ($1, $1, $2, 'emitido', 'Laudo gerado pelo emissor', NOW(), $3, NOW(), NOW()) RETURNING id`,
                [loteId, emissorCPF, hash]
              );
            }
          } catch (insertErr: any) {
            // Tratar duplicates / condições de corrida onde outro processo inseriu o laudo simultaneamente
            const errMsg = String(insertErr?.message || '');

            if (
              (insertErr && insertErr.code === '42703') ||
              errMsg.includes('column "hash_pdf" does not exist')
            ) {
              // Coluna hash_pdf ausente ou incompatibilidade — inserir sem hash
              console.warn(
                `[WARN] Coluna hash_pdf ausente no DB; inserindo laudo sem hash (lote ${loteId})`
              );
              laudoInsert = await client.query(
                `INSERT INTO laudos (id, lote_id, emissor_cpf, status, observacoes, emitido_em, criado_em, atualizado_em)
                 VALUES ($1, $1, $2, 'emitido', 'Laudo gerado pelo emissor', NOW(), NOW(), NOW()) RETURNING id`,
                [loteId, emissorCPF]
              );
            } else if (
              errMsg.includes('Laudo with id') ||
              (insertErr &&
                (insertErr.code === '23505' || insertErr.code === 'P0001'))
            ) {
              // Outro processo já criou o laudo simultaneamente — recuperar o id existente
              console.warn(
                `[WARN] Inserção do laudo falhou por duplicidade; buscando laudo existente para lote ${loteId}`
              );

              // Reverter a transação atual antes de executar selects (evitar estado 'aborted')
              try {
                await client.query('ROLLBACK');
                rolledBack = true;
              } catch (rbErr) {
                console.error(
                  '[ERROR] Falha ao executar ROLLBACK após duplicidade:',
                  rbErr
                );
                throw insertErr; // não podemos continuar sem rollback
              }

              const existing = await client.query(
                `SELECT id FROM laudos WHERE id = $1 OR lote_id = $1 LIMIT 1`,
                [loteId]
              );
              if (existing.rows.length > 0) {
                laudoInsert = existing;
                console.log(
                  ` [INFO] Encontrado laudo existente com id ${existing.rows[0].id} para lote ${loteId}`
                );
              } else {
                // Se não encontrado, não sabemos o que aconteceu — propagar
                throw insertErr;
              }

              // Se encontramos um laudo existente, podemos tentar garantir que
              // o arquivo temporário seja movido para o local definitivo, se possível.
              // Isso melhora UX quando um processo concorrente criou o registro mas nós
              // ainda temos o PDF gerado localmente.
              try {
                const existingId = existing.rows[0].id;
                const finalName = `laudo-${existingId}.pdf`;
                const _finalPath = pathMod.join(laudosDir, finalName);

                // IMPORTANT: To preserve laudo immutability, do NOT write or overwrite
                // the existing final file or DB. We generated a temp file, but if the
                // laudo already exists, we should remove our temp and return existing id.
                await fs.unlink(tempPath).catch(() => {});
                await fs
                  .unlink(pathMod.join(laudosDir, `${tempName}.json`))
                  .catch(() => {});

                console.log(
                  `[INFO] Laudo já existente (id ${existingId}); temp removido e mantendo imutabilidade`
                );
              } catch (cleanupErr) {
                console.warn(
                  `[WARN] Falha ao remover arquivos temporários após detectar laudo existente: ${cleanupErr instanceof Error ? cleanupErr.message : String(cleanupErr)}`
                );
              }

              laudoInsert = existing;
            } else {
              throw insertErr;
            }
          }

          if (!rolledBack) {
            await client.query('COMMIT');
          }
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
      try {
        await fs.rename(tempPath, finalPath);
      } catch (renameMainErr: any) {
        console.warn(
          `[WARN] Falha ao renomear temp → final (${renameMainErr?.code}). Tentando fallback por cópia...`
        );
        try {
          await fs.copyFile(tempPath, finalPath);
          await fs.unlink(tempPath).catch(() => {});
          console.log(`[INFO] Arquivo copiado para ${finalPath} como fallback`);
        } catch (copyErr) {
          console.error(
            `[ERROR] Não foi possível mover nem copiar o PDF temporário para destino: ${copyErr instanceof Error ? copyErr.message : String(copyErr)}`
          );
          // Não propagar: o laudo foi criado no DB e iremos confiar no registro existente
        }
      }

      await fs
        .rename(
          pathMod.join(laudosDir, `${tempName}.json`),
          pathMod.join(laudosDir, `laudo-${laudoId}.json`)
        )
        .catch(() => {});

      console.log(
        `[DEBUG] Laudo criado com ID: ${laudoId} (status emitido - aguardando envio manual)`
      );

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

          if (laudoAlreadyEmitted) {
            console.log(
              `[DEBUG] Laudo ${laudoId} já foi emitido anteriormente; pulando atualização de hash no DB por imutabilidade.`
            );
          } else {
            // Criar session para o emissor
            const emissorSession = {
              cpf: emissorCPF,
              nome: 'Emissor',
              perfil: 'emissor' as const,
              clinica_id: null,
              contratante_id: null,
            };

            // Persistir no banco de dados (trigger/constraint-friendly)
            await query(
              `UPDATE laudos SET hash_pdf = $2, atualizado_em = NOW() WHERE id = $1 AND (hash_pdf IS NULL OR hash_pdf = '')`,
              [laudoId, recalculatedHash],
              emissorSession
            );

            console.log(
              `[DEBUG] Laudo ${laudoId} possuía PDF mas sem hash; hash recalculado e persistido (${recalculatedHash.substring(0, 8)}...)`
            );
          }
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
        if (!laudoAlreadyEmitted) {
          // Executar um bloco DO que captura exceções localmente para evitar abortar a transação
          // caso triggers (como imutabilidade) lancem erro.
          try {
            const safeId = Number(laudoId);
            await query(
              `DO $do$\nBEGIN\n  UPDATE laudos\n  SET emitido_em = COALESCE(emitido_em, NOW()), status = COALESCE(NULLIF(status, 'rascunho'), 'emitido'), atualizado_em = NOW()\n  WHERE id = ${safeId};\nEXCEPTION WHEN OTHERS THEN\n  RAISE NOTICE 'Ignored failure updating laudo ${safeId}: %', SQLERRM;\nEND $do$;`
            );
          } catch (innerErr) {
            console.warn(
              `[WARN] Falha inesperada ao tentar marcar laudo ${laudoId} como 'enviado' (ignorando): ${innerErr instanceof Error ? innerErr.message : String(innerErr)}`
            );
          }
          console.log(
            `[DEBUG] Laudo ${laudoId} marcado como 'emitido' em DB (fallback para PDF existente) - operação isolada`
          );
        } else {
          console.log(
            `[DEBUG] Laudo ${laudoId} já emitido; pulando atualização no DB (fallback).`
          );
        }
      } catch (innerErr) {
        console.warn(
          `[WARN] Falha inesperada ao tentar marcar laudo ${laudoId} como 'emitido' (ignorando): ${innerErr instanceof Error ? innerErr.message : String(innerErr)}`
        );
      }

      // Se não existe informação de arquivo remoto nos metadados, tentar upload assíncrono
      try {
        const fsUpload = await import('fs/promises');
        const pathUpload = await import('path');
        const metaPathUpload = pathUpload.join(
          process.cwd(),
          'storage',
          'laudos',
          `laudo-${laudoId}.json`
        );
        let metadataUpload: any = null;
        try {
          const metaRaw = await fsUpload.readFile(metaPathUpload, 'utf-8');
          metadataUpload = JSON.parse(metaRaw);
        } catch {}
        if (!metadataUpload?.arquivo_remoto) {
          const filePathUpload = pathUpload.join(
            process.cwd(),
            'storage',
            'laudos',
            `laudo-${laudoId}.pdf`
          );
          try {
            const fileBufferUpload = await fsUpload.readFile(filePathUpload);
            uploadLaudoToBackblaze(laudoId, loteId, fileBufferUpload)
              .then(() =>
                console.log(
                  `[DEBUG] Upload para Backblaze iniciado para laudo ${laudoId} (fallback)`
                )
              )
              .catch((err) =>
                console.error(
                  `[WARN] Erro no upload para Backblaze (laudo ${laudoId}):`,
                  err
                )
              );
          } catch (readErr) {
            console.warn(
              `[WARN] Não foi possível ler arquivo local para upload do laudo ${laudoId}:`,
              readErr
            );
          }
        }
      } catch (uploadErr) {
        console.warn(
          `[WARN] Falha ao tentar disparar upload para laudo ${laudoId}:`,
          uploadErr
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

      // SEMPRE usar Puppeteer para geração de PDF
      // Removida lógica de teste com PDF fictício - geração deve ser consistente
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
      const pdfBuffer = Buffer.from(pdfUint8Array);

      await browser.close();
      browser = null;

      console.log(
        `[DEBUG] PDF gerado com sucesso, tamanho: ${pdfBuffer.length} bytes`
      );

      // Calcular hash SHA-256 (opcional - SKIP_LAUDO_HASH)
      const shouldSkipHash =
        process.env.SKIP_LAUDO_HASH === '1' ||
        process.env.SKIP_LAUDO_HASH === 'true';
      const hash = shouldSkipHash
        ? ''
        : crypto.createHash('sha256').update(pdfBuffer).digest('hex');

      if (!shouldSkipHash) {
        console.log(`
        [DEBUG] Hash SHA-256 calculado: ${hash.substring(0, 16)}...`);
      } else {
        console.log(
          '[DEBUG] SKIP_LAUDO_HASH ativo — hash não calculado para geração do laudo'
        );
      }

      // Salvar PDF localmente em storage/laudos e salvar metadados locais
      console.log(`[DEBUG] Gravando PDF localmente em storage/laudos...`);
      const fs = await import('fs/promises');
      const path = await import('path');

      const fileName = `laudo-${laudoId}.pdf`;
      const metadata: any = {
        arquivo: fileName,
        criadoEm: new Date().toISOString(),
      };
      if (!shouldSkipHash) metadata.hash = hash;

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

      // Verificar se o laudo já foi emitido (imutabilidade)
      if (laudoAlreadyEmitted) {
        console.log(
          `[INFO] Laudo ${laudoId} já foi emitido anteriormente; PDF regerado mas registro no DB não será atualizado (imutabilidade)`
        );
      } else {
        // Criar objeto session para o emissor
        const emissorSession = {
          cpf: emissorCPF,
          nome: 'Emissor',
          perfil: 'emissor' as const,
          clinica_id: null,
          contratante_id: null,
        };

        try {
          if (shouldSkipHash) {
            await query(
              `
      UPDATE laudos
      SET emitido_em = NOW(), status = 'emitido', emissor_cpf = $2, atualizado_em = NOW()
      WHERE id = $1
    `,
              [laudoId, emissorCPF],
              emissorSession
            );
          } else {
            await query(
              `
      UPDATE laudos
      SET emitido_em = NOW(), status = 'emitido', hash_pdf = $2, emissor_cpf = $3, atualizado_em = NOW()
      WHERE id = $1
    `,
              [laudoId, hash, emissorCPF],
              emissorSession
            );
          }
        } catch (updateErr: any) {
          // Se erro de imutabilidade (código 23506), logar e continuar
          if (updateErr && updateErr.code === '23506') {
            console.warn(
              `[WARN] Laudo ${laudoId} protegido por imutabilidade; PDF regerado mas metadados no DB não atualizados`
            );
          }
          // Se o banco não tem a coluna hash_pdf (código 42703), tentar atualizar sem o hash
          else if (updateErr && updateErr.code === '42703') {
            console.warn(
              `[WARN] Coluna hash_pdf ausente no DB; atualizando metadados do laudo sem hash (laudo ${laudoId})`
            );
            try {
              await query(
                `UPDATE laudos SET emitido_em = NOW(), status = 'emitido', emissor_cpf = $2, atualizado_em = NOW() WHERE id = $1`,
                [laudoId, emissorCPF],
                emissorSession
              );
            } catch (fallbackErr: any) {
              // Se também pegar imutabilidade aqui, logar e continuar
              if (fallbackErr && fallbackErr.code === '23506') {
                console.warn(
                  `[WARN] Laudo ${laudoId} protegido por imutabilidade (fallback); continuando...`
                );
              } else {
                console.error(
                  `[ERROR] Falha ao atualizar metadados do laudo ${laudoId} (fallback):`,
                  fallbackErr
                );
                throw fallbackErr;
              }
            }
          } else {
            // outros erros críticos
            throw updateErr;
          }
        }
      }

      // Tentar upload assíncrono para Backblaze (não bloqueia o fluxo)
      try {
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
      } catch (e) {
        console.warn(`[WARN] uploadLaudoToBackblaze não pôde ser iniciado:`, e);
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

// Função emitirLaudoImediato REMOVIDA - Emissão automática foi descontinuada.
// Use o fluxo manual: RH/Entidade solicita → Emissor revisa → Emissor emite.

// Função emitirLaudosAutomaticamente REMOVIDA - Emissão automática foi descontinuada.
// Use o fluxo manual: RH/Entidade solicita → Emissor revisa → Emissor emite.

// ==========================================
// FASE 2: ENVIO AUTOMÁTICO (10 min após emissão)
// ==========================================
async function _enviarLaudoAutomatico(laudo: any) {
  try {
    console.log(
      `[FASE 2] Enviando laudo do lote ${laudo.id} (ID: ${laudo.lote_id})`
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
          titulo: `Laudo do lote ${laudo.id} disponível`,
          mensagem: `O laudo do lote ${laudo.id} foi emitido e está disponível para download.`,
          dados_contexto: {
            lote_id: laudo.lote_id,
            laudo_id: laudo.laudo_id,
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
          titulo: `Laudo do lote ${laudo.id} disponível`,
          mensagem: `O laudo do lote ${laudo.id} foi emitido e está disponível para download.`,
          dados_contexto: {
            lote_id: laudo.lote_id,
            laudo_id: laudo.laudo_id,
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
            titulo: `Laudo do lote ${laudo.id} disponível`,
            mensagem: `O laudo do lote ${laudo.id} foi emitido e está disponível para download.`,
            dados_contexto: {
              lote_id: laudo.lote_id,
              laudo_id: laudo.laudo_id,
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

// =====================================================
// FUNÇÕES DE EMISSÃO/ENVIO AUTOMÁTICO - REMOVIDAS
// =====================================================
//
// As funções abaixo eram parte do fluxo de emissão automática que foi
// descontinuado. Emissão agora é 100% MANUAL pelo emissor.
//
// Funções removidas:
// - emitirLaudosAutomaticamente()
// - enviarLaudosAutomaticamente()
// - processarFilaEmissao()
// - emitirLaudoImediato()
//
// Fluxo atual:
// 1. RH/Entidade solicita emissão (POST /api/lotes/[loteId]/solicitar-emissao)
// 2. Emissor vê lote no dashboard
// 3. Emissor clica manualmente (POST /api/emissor/laudos/[loteId])
// 4. Sistema chama gerarLaudoCompletoEmitirPDF() diretamente
//
// =====================================================
