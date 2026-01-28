#!/usr/bin/env node
/**
 * Script de Backfill de Recibos Retroativos
 *
 * Gera recibos para todos os pagamentos confirmados até 30/12/2025
 * que não possuem recibo associado.
 *
 * Características:
 * - Idempotente: pode ser executado múltiplas vezes sem duplicar recibos
 * - Gera PDF completo com hash SHA-256
 * - Salva cópia em disco
 * - Cria notificações retroativas
 * - Registra auditoria agregada
 *
 * Uso:
 *   node scripts/backfill-recibos-2025.mjs
 *   node scripts/backfill-recibos-2025.mjs --dry-run  # Apenas simula
 */

import { query } from '../lib/db.js';
import { gerarPdfRecibo } from '../lib/pdf-generator.js';
import { gerarHtmlReciboTemplate } from '../lib/templates/recibo-template.js';
import { logAudit } from '../lib/audit-logger.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// CONFIGURAÇÕES
// ============================================================================

const DRY_RUN = process.argv.includes('--dry-run');
const DATA_LIMITE = '2025-12-31';
const PREFIXO_RETROATIVO = 'REC-RETRO-2025-';

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function calcularHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function gerarNumeroReciboRetroativo(anoAtual, sequenciaGlobal) {
  // Formato: REC-RETRO-2025-NNNNN
  return `${PREFIXO_RETROATIVO}${String(sequenciaGlobal).padStart(5, '0')}`;
}

async function gerarReciboRetroativo(pagamentoId, sequencia) {
  try {
    // 1. Buscar dados do contratante
    const contratanteResult = await query(
      `SELECT c.id, c.nome, c.cnpj, c.responsavel_cpf, c.endereco, c.cidade, c.estado, c.cep, c.tipo
       FROM contratantes c
       INNER JOIN pagamentos p ON p.contratante_id = c.id
       WHERE p.id = $1`,
      [pagamentoId]
    );

    if (contratanteResult.rows.length === 0) {
      console.error(
        `❌ Contratante não encontrado para pagamento ${pagamentoId}`
      );
      return null;
    }

    const contratante = contratanteResult.rows[0];

    // 2. Buscar dados do pagamento
    const pagamentoResult = await query(
      `SELECT p.id, p.valor, p.metodo, p.numero_parcelas, p.detalhes_parcelas,
              p.plataforma_nome, p.plataforma_id, p.data_pagamento, p.numero_funcionarios,
              p.valor_por_funcionario,
              pl.id as plano_id, pl.nome as plano_nome, pl.tipo as plano_tipo,
              pl.descricao as plano_descricao
       FROM pagamentos p
       LEFT JOIN contratos ctr ON p.contrato_id = ctr.id
       LEFT JOIN planos pl ON ctr.plano_id = pl.id
       WHERE p.id = $1`,
      [pagamentoId]
    );

    if (pagamentoResult.rows.length === 0) {
      console.error(`❌ Pagamento não encontrado: ${pagamentoId}`);
      return null;
    }

    const pagamento = pagamentoResult.rows[0];

    // 3. Gerar número do recibo retroativo
    const numeroRecibo = await gerarNumeroReciboRetroativo(2025, sequencia);

    // 4. Calcular vigência (início = data pagamento, fim = início + 364 dias)
    const dataInicio = pagamento.data_pagamento
      ? new Date(pagamento.data_pagamento)
      : new Date();
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 364);

    // 5. Gerar hash do contrato padrão
    let contratoHash = null;
    if (pagamento.plano_id) {
      const hashResult = await query(
        `SELECT MD5(
          CONCAT(
            $1::TEXT, '|',
            $2::TEXT, '|',
            $3::TEXT, '|',
            $4::TEXT
          )
        ) as hash`,
        [
          contratante.nome,
          pagamento.plano_nome,
          pagamento.valor,
          dataInicio.toISOString(),
        ]
      );
      contratoHash = hashResult.rows[0].hash;
    }

    // 6. Preparar dados para o template
    const dadosRecibo = {
      id: 0,
      numero_recibo: numeroRecibo,
      contratante_nome: contratante.nome,
      contratante_cnpj: contratante.cnpj,
      contratante_cpf: contratante.responsavel_cpf,
      contratante_endereco: contratante.endereco,
      contratante_cidade: contratante.cidade,
      contratante_estado: contratante.estado,
      contratante_cep: contratante.cep,
      plano_nome: pagamento.plano_nome || 'Plano Personalizado',
      plano_tipo: pagamento.plano_tipo || 'personalizado',
      plano_descricao: pagamento.plano_descricao,
      valor_total: parseFloat(pagamento.valor),
      valor_por_funcionario: pagamento.valor_por_funcionario
        ? parseFloat(pagamento.valor_por_funcionario)
        : null,
      qtd_funcionarios: pagamento.numero_funcionarios || 0,
      metodo_pagamento: pagamento.metodo || 'avista',
      numero_parcelas: pagamento.numero_parcelas || 1,
      detalhes_parcelas: pagamento.detalhes_parcelas,
      plataforma_pagamento: pagamento.plataforma_nome,
      transacao_id: pagamento.plataforma_id,
      data_inicio_vigencia: dataInicio,
      data_fim_vigencia: dataFim,
      contrato_hash: contratoHash,
      emitido_em: new Date(),
    };

    // 7. Gerar HTML do recibo
    const htmlRecibo = gerarHtmlReciboTemplate(dadosRecibo);

    // 8. Gerar PDF com hash
    const pdfResult = await gerarPdfRecibo(htmlRecibo, numeroRecibo);

    // 9. Inserir recibo no banco (com ON CONFLICT DO NOTHING para idempotência)
    if (!DRY_RUN) {
      const reciboResult = await query(
        `INSERT INTO recibos (
          numero_recibo,
          contratante_id,
          pagamento_id,
          vigencia_inicio,
          vigencia_fim,
          numero_funcionarios_cobertos,
          valor_total_anual,
          valor_por_funcionario,
          forma_pagamento,
          numero_parcelas,
          valor_parcela,
          detalhes_parcelas,
          emitido_por_cpf,
          pdf,
          hash_pdf,
          ip_emissao,
          emitido_por,
          hash_incluso,
          backup_path
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) 
        ON CONFLICT (pagamento_id) DO NOTHING
        RETURNING id`,
        [
          numeroRecibo,
          contratante.id,
          pagamentoId,
          dataInicio,
          dataFim,
          pagamento.numero_funcionarios || 1,
          pagamento.valor,
          pagamento.valor_por_funcionario || null,
          pagamento.metodo || 'avista',
          pagamento.numero_parcelas || 1,
          pagamento.valor,
          pagamento.detalhes_parcelas || null,
          null, // emitido_por_cpf (sistema)
          pdfResult.pdfBuffer,
          pdfResult.hash,
          null, // ip_emissao
          'SISTEMA_BACKFILL',
          true,
          pdfResult.localPath || null,
        ]
      );

      if (reciboResult.rows.length === 0) {
        console.log(
          `   ⏭️  Recibo já existe para pagamento ${pagamentoId}, pulando...`
        );
        return { skipped: true };
      }

      const reciboId = reciboResult.rows[0].id;

      // 10. Criar notificação retroativa
      try {
        await query(
          `SELECT criar_notificacao_recibo($1, $2, 'recibo_gerado_retroativo')`,
          [reciboId, contratante.id]
        );
      } catch (notifError) {
        console.error(
          `⚠️  Erro ao criar notificação para recibo ${numeroRecibo}:`,
          notifError.message
        );
      }

      // 11. Atualizar pagamento com número do recibo
      await query(
        `UPDATE pagamentos
         SET recibo_numero = $1, recibo_url = $2
         WHERE id = $3`,
        [numeroRecibo, `/recibo/${reciboId}`, pagamentoId]
      );

      return {
        recibo_id: reciboId,
        numero_recibo: numeroRecibo,
        hash: pdfResult.hash,
        tamanho_pdf: pdfResult.size,
        backup_path: pdfResult.localPath,
      };
    } else {
      // Modo dry-run
      return {
        numero_recibo: numeroRecibo,
        hash: pdfResult.hash.substring(0, 16) + '...',
        tamanho_pdf: pdfResult.size,
        dry_run: true,
      };
    }
  } catch (error) {
    console.error(
      `❌ Erro ao gerar recibo retroativo para pagamento ${pagamentoId}:`,
      error
    );
    return null;
  }
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   BACKFILL DE RECIBOS RETROATIVOS - 2025                  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('');

  if (DRY_RUN) {
    console.log('🔍 MODO DRY-RUN: Simulação sem persistência no banco');
    console.log('');
  }

  try {
    // 1. Listar pagamentos elegíveis
    console.log(`📋 Buscando pagamentos até ${DATA_LIMITE} sem recibo...`);

    const pagamentosResult = await query(
      `SELECT p.id, p.contratante_id, c.tipo, p.valor, p.data_pagamento
       FROM pagamentos p
       JOIN contratantes c ON p.contratante_id = c.id
       WHERE p.data_pagamento <= $1
         AND p.status = 'pago'
         AND NOT EXISTS (
           SELECT 1 FROM recibos r WHERE r.pagamento_id = p.id
         )
       ORDER BY p.data_pagamento ASC`,
      [DATA_LIMITE]
    );

    const pagamentos = pagamentosResult.rows;
    console.log(`✅ Encontrados ${pagamentos.length} pagamentos sem recibo`);
    console.log('');

    if (pagamentos.length === 0) {
      console.log('✨ Nenhum pagamento necessita de backfill. Tudo ok!');
      return;
    }

    // 2. Processar cada pagamento
    const resultados = {
      total: pagamentos.length,
      sucesso: 0,
      falhas: 0,
      pulados: 0,
      erros: [],
    };

    console.log(
      `🚀 Iniciando processamento de ${pagamentos.length} recibos...`
    );
    console.log('');

    for (let i = 0; i < pagamentos.length; i++) {
      const pag = pagamentos[i];
      const sequencia = i + 1;

      process.stdout.write(
        `   [${sequencia}/${pagamentos.length}] Pagamento ${pag.id}... `
      );

      const resultado = await gerarReciboRetroativo(pag.id, sequencia);

      if (resultado === null) {
        console.log('❌ FALHA');
        resultados.falhas++;
        resultados.erros.push({
          pagamento_id: pag.id,
          erro: 'Falha na geração',
        });
      } else if (resultado.skipped) {
        console.log('⏭️  PULADO (já existe)');
        resultados.pulados++;
      } else {
        console.log(
          `✅ OK - ${resultado.numero_recibo} (${Math.round(resultado.tamanho_pdf / 1024)}KB)`
        );
        resultados.sucesso++;
      }
    }

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMO DO BACKFILL');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total processados:  ${resultados.total}`);
    console.log(`✅ Sucesso:          ${resultados.sucesso}`);
    console.log(`⏭️  Pulados:          ${resultados.pulados}`);
    console.log(`❌ Falhas:           ${resultados.falhas}`);
    console.log('');

    if (resultados.erros.length > 0) {
      console.log('Erros detalhados:');
      resultados.erros.forEach((e) => {
        console.log(`  - Pagamento ${e.pagamento_id}: ${e.erro}`);
      });
      console.log('');
    }

    // 3. Registrar auditoria agregada
    if (!DRY_RUN && resultados.sucesso > 0) {
      try {
        await logAudit({
          acao: 'BACKFILL_RECIBOS_RETROATIVOS',
          recurso: 'recibos',
          recurso_id: null,
          usuario_cpf: 'SISTEMA',
          ip: 'localhost',
          detalhes: JSON.stringify({
            data_limite: DATA_LIMITE,
            total_processados: resultados.total,
            recibos_gerados: resultados.sucesso,
            pulados: resultados.pulados,
            falhas: resultados.falhas,
            prefixo_usado: PREFIXO_RETROATIVO,
            executado_em: new Date().toISOString(),
          }),
        });
        console.log('📝 Auditoria registrada com sucesso');
      } catch (auditError) {
        console.error('⚠️  Erro ao registrar auditoria:', auditError.message);
      }
    }

    console.log('');
    console.log('✨ Backfill concluído!');
    console.log('');

    process.exit(resultados.falhas > 0 ? 1 : 0);
  } catch (error) {
    console.error('');
    console.error('❌ ERRO FATAL:', error);
    console.error('');
    process.exit(1);
  }
}

// Executar
main();
