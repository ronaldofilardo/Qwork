import { query, transaction, TransactionClient } from '@/lib/db';
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

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Calcular hash SHA-256 de um buffer
 */
function calcularHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Validar emissor único no sistema
 */
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
    await query(
      `
      INSERT INTO audit_logs (acao, entidade, dados, user_role, criado_em)
      VALUES ('erro_sistema', 'emissores', $1, 'sistema', NOW())
    `,
      [JSON.stringify({ erro: 'Nenhum emissor ativo no sistema' })]
    );
    return null;
  }

  if (emissor.rows.length > 1) {
    console.error(`[ERROR] Múltiplos emissores ativos no sistema!`);
    await query(
      `
      INSERT INTO audit_logs (acao, entidade, dados, user_role, criado_em)
      VALUES ('erro_sistema', 'emissores', $1, 'sistema', NOW())
    `,
      [JSON.stringify({ erro: 'Múltiplos emissores ativos detectados' })]
    );
    return null;
  }

  return emissor.rows[0];
}

/**
 * Criar laudo padronizado para o template centralizado
 */
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

/**
 * Gerar PDF usando Puppeteer
 */
async function gerarPdfLaudo(
  loteId: number,
  modoEmergencia: boolean = false,
  motivoEmergencia?: string
): Promise<Buffer> {
  let browser = null;

  try {
    console.log(`[DEBUG] Gerando PDF para lote ${loteId}`);

    // Gerar dados do laudo
    const dadosGeraisEmpresa = await gerarDadosGeraisEmpresa(loteId);
    const scoresPorGrupo = await calcularScoresPorGrupo(loteId);
    const interpretacaoRecomendacoes = gerarInterpretacaoRecomendacoes(
      dadosGeraisEmpresa.empresaAvaliada,
      scoresPorGrupo
    );
    const observacoesConclusao = gerarObservacoesConclusao('');

    // Gerar HTML usando o template centralizado
    const laudoPadronizado = criarLaudoPadronizado(
      dadosGeraisEmpresa,
      scoresPorGrupo,
      interpretacaoRecomendacoes,
      observacoesConclusao
    );
    let html = gerarHTMLLaudoCompleto(laudoPadronizado);

    // Adicionar marcação de modo emergência no HTML se necessário
    if (modoEmergencia) {
      const avisoEmergencia = `
        <div style="background-color: #fee; border: 3px solid #c00; padding: 15px; margin: 20px 0; text-align: center;">
          <h3 style="color: #c00; margin: 0 0 10px 0; font-size: 14pt;">⚠️ EMITIDO EM MODO DE EMERGÊNCIA</h3>
          <p style="color: #c00; margin: 0; font-size: 11pt; font-weight: bold;">
            VALIDAÇÃO TÉCNICA IGNORADA - DOCUMENTO EMITIDO SEM VERIFICAÇÕES PADRÃO
          </p>
          ${motivoEmergencia ? `<p style="margin: 10px 0 0 0; font-size: 10pt;"><strong>Motivo:</strong> ${motivoEmergencia}</p>` : ''}
        </div>
      `;
      // Inserir logo após o header
      html = html.replace(
        '</div>\\n\\n      <div class="section">',
        `</div>${avisoEmergencia}\\n\\n      <div class="section">`
      );
    }

    // Gerar PDF (usa chromium otimizado em serverless)
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

    return pdfBuffer;
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
}

// ==========================================
// FUNÇÃO PRINCIPAL DE EMISSÃO (TRANSACIONAL)
// ==========================================

/**
 * Emitir laudo automaticamente para um lote
 * Função transacional que garante atomicidade:
 * 1. Valida estado do lote
 * 2. Marca processamento (feedback efêmero)
 * 3. Gera PDF
 * 4. Insere laudo
 * 5. Atualiza lote para finalizado
 * 6. Cria notificações
 */
export async function emitirLaudosAutomaticamenteParaLote(
  loteId: number,
  emissorCpf?: string,
  modoEmergencia: boolean = false,
  motivoEmergencia?: string
): Promise<number> {
  console.log(
    `[EMISSÃO] Iniciando emissão para lote ${loteId} (emergência: ${modoEmergencia})`
  );

  try {
    return await transaction(async (tx: TransactionClient) => {
      // 1. Validar estado do lote
      const loteResult = await tx.query(
        `
        SELECT 
          id, status, contratante_id, codigo, clinica_id, empresa_id
        FROM lotes_avaliacao 
        WHERE id = $1
      `,
        [loteId]
      );

      if (!loteResult.rows || loteResult.rows.length === 0) {
        throw new Error(`Lote ${loteId} não encontrado`);
      }

      const lote = loteResult.rows[0];

      // Validar status
      if (lote.status !== 'concluido') {
        throw new Error(
          `Lote ${loteId} não está concluído (status: ${lote.status})`
        );
      }

      // Verificar se já existe laudo enviado (previne duplicação)
      const laudoExistenteResult = await tx.query(
        `
        SELECT id FROM laudos WHERE lote_id = $1 AND status = 'enviado'
      `,
        [loteId]
      );

      if (laudoExistenteResult.rows && laudoExistenteResult.rows.length > 0) {
        throw new Error(
          `Lote ${loteId} já possui laudo enviado (ID: ${laudoExistenteResult.rows[0].id})`
        );
      }

      // 2. Marcar início de processamento (feedback efêmero)
      await tx.query(
        `
        UPDATE lotes_avaliacao 
        SET processamento_em = NOW(),
            modo_emergencia = $2,
            motivo_emergencia = $3
        WHERE id = $1
      `,
        [loteId, modoEmergencia, motivoEmergencia || null]
      );

      if (modoEmergencia) {
        console.log(`[EMISSÃO] ⚠️ MODO EMERGÊNCIA ATIVADO para lote ${loteId}`);
        console.log(`[EMISSÃO] Motivo: ${motivoEmergencia}`);
      }

      console.log(`[EMISSÃO] Lote ${loteId} marcado como em processamento`);

      // 3. Gerar PDF (lança erro se falhar - causa rollback)
      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await gerarPdfLaudo(
          loteId,
          modoEmergencia,
          motivoEmergencia
        );
      } catch (error) {
        console.error(
          `[EMISSÃO] Erro ao gerar PDF para lote ${loteId}:`,
          error
        );
        // Limpar flag de processamento antes de lançar erro
        await tx.query(
          `
          UPDATE lotes_avaliacao 
          SET processamento_em = NULL
          WHERE id = $1
        `,
          [loteId]
        );
        throw new Error(
          `Falha ao gerar PDF: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      // Calcular hash
      const hash = calcularHash(pdfBuffer);

      console.log(
        `[EMISSÃO] PDF gerado com sucesso (${pdfBuffer.length} bytes, hash: ${hash.substring(0, 16)}...)`
      );

      // Armazenar buffer e hash para gravação pós-commit
      const pdfDataToSave = { buffer: pdfBuffer, hash };

      // 4. Inserir laudo (sem persistir binário no DB; arquivo é gravado localmente)
      const laudoResult = await tx.query(
        `
        INSERT INTO laudos (
          id,
          lote_id, 
          emissor_cpf,
          status, 
          emitido_em,
          enviado_em,
          criado_em,
          atualizado_em
        )
        VALUES ($1, $1, $2, 'enviado', NOW(), NOW(), NOW(), NOW())
        RETURNING id
      `,
        [loteId, emissorCpf || 'sistema']
      );

      const laudoId = laudoResult.rows[0].id;

      console.log(
        `[EMISSÃO] Laudo ${laudoId} inserido para lote ${loteId} (metadados no DB; arquivo será salvo após commit)`
      );

      // Nota: Arquivos serão gravados APÓS commit para garantir atomicidade

      // 5. Atualizar lote → finalizado
      await tx.query(
        `
        UPDATE lotes_avaliacao
        SET 
          status = 'finalizado',
          laudo_enviado_em = NOW(),
          processamento_em = NULL,
          finalizado_em = NOW()
        WHERE id = $1
      `,
        [loteId]
      );

      console.log(`[EMISSÃO] Lote ${loteId} atualizado para status finalizado`);

      // 6. Auditoria
      await tx.query(
        `
        INSERT INTO audit_logs (
          acao, entidade, entidade_id, dados, user_id, user_role, criado_em
        )
        VALUES (
          $1, 'laudos', $2, $3, $4, 'emissor', NOW()
        )
      `,
        [
          modoEmergencia
            ? 'laudo_emitido_emergencia'
            : 'laudo_emitido_automatico',
          laudoId,
          JSON.stringify({
            lote_id: loteId,
            codigo: lote.codigo,
            modo_emergencia: modoEmergencia,
            motivo_emergencia: motivoEmergencia || null,
            tamanho_pdf: pdfBuffer.length,
            hash: hash.substring(0, 16),
          }),
          emissorCpf || 'sistema',
        ]
      );

      console.log(`[EMISSÃO] Auditoria registrada para laudo ${laudoId}`);

      // 7. Notificações (não bloqueiam transação em caso de erro)
      try {
        // Determinar destinatário
        if (lote.clinica_id) {
          await criarNotificacao({
            tipo: 'laudo_enviado',
            destinatario_id: lote.clinica_id,
            destinatario_tipo: 'clinica',
            titulo: `Laudo do lote ${lote.codigo} disponível`,
            mensagem: `O laudo do lote ${lote.codigo} foi emitido e está disponível para download.`,
            dados_contexto: {
              lote_id: loteId,
              laudo_id: laudoId,
              codigo: lote.codigo,
            },
            link_acao: `/clinica/laudos`,
            botao_texto: 'Ver Laudos',
            prioridade: 'alta',
          });
        } else if (lote.empresa_id) {
          const empresaResult = await tx.query(
            `
          SELECT contratante_id FROM empresas_clientes WHERE id = $1
        `,
            [lote.empresa_id]
          );

          if (
            empresaResult.rows.length > 0 &&
            empresaResult.rows[0].contratante_id
          ) {
            await criarNotificacao({
              tipo: 'laudo_enviado',
              destinatario_id: empresaResult.rows[0].contratante_id,
              destinatario_tipo: 'contratante',
              titulo: `Laudo do lote ${lote.codigo} disponível`,
              mensagem: `O laudo do lote ${lote.codigo} foi emitido e está disponível para download.`,
              dados_contexto: {
                lote_id: loteId,
                laudo_id: laudoId,
                codigo: lote.codigo,
              },
              link_acao: `/entidade/laudos`,
              botao_texto: 'Ver Laudos',
              prioridade: 'alta',
            });
          }
        }
      } catch (notifError) {
        console.error(
          `[EMISSÃO] Erro ao criar notificações (não-crítico):`,
          notifError
        );
        // Não propagar erro - notificação não deve bloquear emissão
      }

      console.log(
        `[EMISSÃO] Laudo ${laudoId} emitido com sucesso para lote ${loteId}`
      );

      // Armazenar laudoId para uso pós-transação
      const finalLaudoId = laudoId;
      const finalPdfData = pdfDataToSave;

      // APÓS commit: gravar arquivos atomicamente (temp + rename)
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const laudosDir = path.join(process.cwd(), 'storage', 'laudos');
        await fs.mkdir(laudosDir, { recursive: true });

        const fileName = `laudo-${finalLaudoId}.pdf`;
        const tempFileName = `laudo-${finalLaudoId}.pdf.tmp`;
        const filePath = path.join(laudosDir, fileName);
        const tempFilePath = path.join(laudosDir, tempFileName);

        // Escrever em arquivo temporário
        await fs.writeFile(tempFilePath, finalPdfData.buffer);

        // Rename atomico
        await fs.rename(tempFilePath, filePath);

        // Gravar metadados
        const metadata = {
          arquivo: fileName,
          hash: finalPdfData.hash,
          criadoEm: new Date().toISOString(),
        };
        const metaTempPath = path.join(
          laudosDir,
          `laudo-${finalLaudoId}.json.tmp`
        );
        const metaPath = path.join(laudosDir, `laudo-${finalLaudoId}.json`);
        await fs.writeFile(metaTempPath, JSON.stringify(metadata));
        await fs.rename(metaTempPath, metaPath);

        console.log(`[EMISSÃO] Arquivo PDF gravado em ${filePath}`);
      } catch (fsError) {
        console.error(`[EMISSÃO] Erro ao gravar arquivo PDF:`, fsError);
        // Registrar erro mas não falhar a transação já comitada
        await query(
          `INSERT INTO audit_logs (acao, entidade, entidade_id, dados, user_role, criado_em)
           VALUES ('emissao_erro_arquivo', 'laudos', $1, $2, 'sistema', NOW())`,
          [
            finalLaudoId,
            JSON.stringify({
              erro:
                fsError instanceof Error ? fsError.message : String(fsError),
            }),
          ]
        );
      }

      return finalLaudoId;
    });
  } catch (error) {
    console.error(`[EMISSÃO] Erro ao emitir laudo para lote ${loteId}:`, error);
    try {
      await query(
        `
        INSERT INTO audit_logs (
          acao, entidade, entidade_id, dados, user_role, criado_em
        ) VALUES ('emissao_erro', 'laudos', $1, $2, 'sistema', NOW())
      `,
        [
          loteId,
          JSON.stringify({
            modo_emergencia: modoEmergencia,
            motivo_emergencia: motivoEmergencia || null,
            emissor_cpf: emissorCpf || null,
            erro: error instanceof Error ? error.message : String(error),
          }),
        ]
      );
      console.log(`[EMISSÃO] Auditoria de erro registrada para lote ${loteId}`);
    } catch (auditError) {
      console.error(
        '[EMISSÃO] Erro ao registrar auditoria de emissão de erro:',
        auditError
      );
    }
    throw error;
  }
}

// ==========================================
// WORKER DE FILA DE EMISSÃO
// ==========================================

/**
 * Processar itens da fila de emissão
 * Deve ser chamado periodicamente (cron job ou endpoint)
 */
export async function processarFilaEmissao(): Promise<void> {
  console.log('[FILA] Iniciando processamento da fila de emissão');

  // Buscar itens prontos para processamento com locking
  const filaResult = await query(`
    SELECT 
      id, lote_id, tentativas, max_tentativas, erro
    FROM fila_emissao
    WHERE proxima_tentativa <= NOW() 
      AND tentativas < max_tentativas
    ORDER BY criado_em ASC
    LIMIT 5
    FOR UPDATE SKIP LOCKED
  `);

  if (!filaResult.rows || filaResult.rows.length === 0) {
    console.log('[FILA] Nenhum item pendente na fila');
    return;
  }

  console.log(`[FILA] ${filaResult.rows.length} itens para processar`);

  const emissor = await validarEmissorUnico();
  if (!emissor) {
    console.error('[FILA] Impossível processar fila sem emissor válido');
    return;
  }

  // Processar cada item
  for (const item of filaResult.rows) {
    try {
      console.log(
        `[FILA] Processando item ${item.id} (lote ${item.lote_id}, tentativa ${item.tentativas + 1}/${item.max_tentativas})`
      );

      await emitirLaudosAutomaticamenteParaLote(item.lote_id, emissor.cpf);

      // Sucesso - remover da fila
      await query(
        `
        DELETE FROM fila_emissao WHERE id = $1
      `,
        [item.id]
      );

      console.log(
        `[FILA] Item ${item.id} processado com sucesso e removido da fila`
      );
    } catch (error) {
      console.error(`[FILA] Erro ao processar item ${item.id}:`, error);

      // Calcular backoff exponencial (minutos)
      const backoffMinutes = Math.pow(2, item.tentativas + 1);

      // Atualizar fila com erro e próxima tentativa
      await query(
        `
        UPDATE fila_emissao
        SET 
          tentativas = tentativas + 1,
          erro = $2,
          proxima_tentativa = NOW() + INTERVAL '${backoffMinutes} minutes',
          atualizado_em = NOW()
        WHERE id = $1
      `,
        [item.id, error instanceof Error ? error.message : String(error)]
      );

      // Registrar auditoria da tentativa com erro (útil para rastreabilidade de reprocessamentos / emergências)
      try {
        // Detectar se a tentativa foi motivada por reprocessamento/manual/emergencia
        const triggerRes = await query(
          `
          SELECT acao, criado_em FROM audit_logs
          WHERE entidade = 'lotes_avaliacao' AND entidade_id = $1
            AND acao IN ('reprocessamento_solicitado','modo_emergencia_solicitado')
          ORDER BY criado_em DESC
          LIMIT 1
        `,
          [item.lote_id]
        );

        const trigger =
          triggerRes.rows && triggerRes.rows.length > 0
            ? triggerRes.rows[0].acao
            : 'fila_worker';

        await query(
          `
          INSERT INTO audit_logs (
            acao, entidade, entidade_id, dados, user_role, criado_em
          )
          VALUES (
            'fila_emissao_tentativa_erro', 'fila_emissao', $1, $2, 'sistema', NOW()
          )
        `,
          [
            item.id,
            JSON.stringify({
              lote_id: item.lote_id,
              tentativa: item.tentativas + 1,
              erro: error instanceof Error ? error.message : String(error),
              trigger,
            }),
          ]
        );

        console.log(
          `[FILA] Auditoria de tentativa com erro registrada para item ${item.id} (trigger: ${trigger})`
        );
      } catch (auditErr) {
        console.error(
          `[FILA] Erro ao registrar auditoria de tentativa:`,
          auditErr
        );
      }

      // Se atingiu max tentativas, notificar admin
      if (item.tentativas + 1 >= item.max_tentativas) {
        console.error(
          `[FILA] Item ${item.id} atingiu número máximo de tentativas`
        );

        await query(
          `
          INSERT INTO audit_logs (
            acao, entidade, entidade_id, dados, user_role, criado_em
          )
          VALUES (
            'fila_emissao_falha_maxima', 'fila_emissao', $1, $2, 'sistema', NOW()
          )
        `,
          [
            item.id,
            JSON.stringify({
              lote_id: item.lote_id,
              tentativas: item.tentativas + 1,
              erro: error instanceof Error ? error.message : String(error),
            }),
          ]
        );
      }
    }
  }

  console.log('[FILA] Processamento da fila concluído');
}

// ==========================================
// FUNÇÃO LEGADA (MANTER COMPATIBILIDADE)
// ==========================================

/**
 * Emitir laudos automaticamente (compatibilidade com cron existente)
 * Busca lotes prontos e insere na fila de emissão
 */
export async function emitirLaudosAutomaticamente(): Promise<void> {
  console.log('[EMISSÃO-AUTO] Verificando lotes prontos para emissão');

  // Buscar lotes concluídos sem laudo enviado
  const lotesResult = await query(`
    SELECT 
      la.id, la.codigo, la.status
    FROM lotes_avaliacao la
    WHERE la.status = 'concluido'
      AND NOT EXISTS (
        SELECT 1 FROM laudos l 
        WHERE l.lote_id = la.id AND l.status = 'enviado'
      )
      AND NOT EXISTS (
        SELECT 1 FROM fila_emissao f
        WHERE f.lote_id = la.id
      )
    ORDER BY la.data_conclusao ASC
    LIMIT 20
  `);

  if (!lotesResult.rows || lotesResult.rows.length === 0) {
    console.log('[EMISSÃO-AUTO] Nenhum lote pronto para emissão');
    return;
  }

  console.log(
    `[EMISSÃO-AUTO] ${lotesResult.rows.length} lotes prontos para emissão`
  );

  // Inserir na fila de emissão
  for (const lote of lotesResult.rows) {
    try {
      await query(
        `
        INSERT INTO fila_emissao (lote_id, tentativas, proxima_tentativa, criado_em, atualizado_em)
        VALUES ($1, 0, NOW(), NOW(), NOW())
        ON CONFLICT DO NOTHING
      `,
        [lote.id]
      );

      console.log(
        `[EMISSÃO-AUTO] Lote ${lote.id} (${lote.codigo}) adicionado à fila`
      );
    } catch (error) {
      console.error(
        `[EMISSÃO-AUTO] Erro ao adicionar lote ${lote.id} à fila:`,
        error
      );
    }
  }

  // Processar fila imediatamente
  await processarFilaEmissao();
}
