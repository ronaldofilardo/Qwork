#!/usr/bin/env node
import { query } from '../../lib/db.js';
import { gerarPdfRecibo, gerarPdfFromUrl } from '../../lib/pdf-generator.js';
import { gerarHtmlReciboTemplate } from '../../lib/templates/recibo-template.js';

(async function main() {
  console.log('Gerando PDFs para recibos sem PDF...');
  const res = await query(
    `SELECT r.id as recibo_id, r.numero_recibo, r.contratante_id, r.pagamento_id, r.vigencia_inicio, r.vigencia_fim,
            r.valor_total_anual, r.valor_por_funcionario, r.numero_parcelas, r.detalhes_parcelas, r.forma_pagamento,
            ct.nome as contratante_nome, ct.cnpj as contratante_cnpj, ct.responsavel_cpf as contratante_cpf,
            ct.endereco as contratante_endereco, ct.cidade as contratante_cidade, ct.estado as contratante_estado, ct.cep as contratante_cep,
            p.metodo as pagamento_metodo, p.plataforma_nome, p.plataforma_id
     FROM recibos r
     JOIN contratantes ct ON r.contratante_id = ct.id
     LEFT JOIN pagamentos p ON r.pagamento_id = p.id
     WHERE r.pdf IS NULL AND r.ativo = true
     ORDER BY r.id`
  );

  const rows = res.rows;
  console.log(`Encontrados ${rows.length} recibos sem PDF.`);
  for (const r of rows) {
    try {
      console.log(
        `Gerando PDF para recibo ${r.recibo_id} (pagamento ${r.pagamento_id})...`
      );

      const dadosRecibo = {
        id: r.recibo_id,
        numero_recibo: r.numero_recibo || `REC-REGEN-${r.recibo_id}`,
        contratante_nome: r.contratante_nome,
        contratante_cnpj: r.contratante_cnpj,
        contratante_cpf: r.contratante_cpf,
        contratante_endereco: r.contratante_endereco,
        contratante_cidade: r.contratante_cidade,
        contratante_estado: r.contratante_estado,
        contratante_cep: r.cep,
        plano_nome: 'Plano (regerado)',
        plano_tipo: 'regerado',
        plano_descricao: null,
        valor_total: parseFloat(r.valor_total_anual),
        valor_por_funcionario: r.valor_por_funcionario
          ? parseFloat(r.valor_por_funcionario)
          : null,
        qtd_funcionarios: r.numero_funcionarios_cobertos || 0,
        metodo_pagamento: r.forma_pagamento || r.pagamento_metodo || 'avista',
        numero_parcelas: r.numero_parcelas || 1,
        detalhes_parcelas: r.detalhes_parcelas || null,
        plataforma_pagamento: r.plataforma_nome || null,
        transacao_id: r.plataforma_id || null,
        data_inicio_vigencia: r.vigencia_inicio || new Date(),
        data_fim_vigencia: r.vigencia_fim || new Date(),
        contrato_hash: null,
        emitido_em: new Date(),
      };

      // Preferência: tentar imprimir a página pública do recibo (localhost), se disponível
      const numero = dadosRecibo.numero_recibo;
      const localUrl = `http://localhost:3000/recibo/${encodeURIComponent(numero)}`;
      let pdfResult;
      try {
        pdfResult = await gerarPdfFromUrl(
          localUrl,
          dadosRecibo.numero_recibo + '.pdf'
        );
      } catch (err) {
        console.warn(
          `Falha ao gerar PDF via URL ${localUrl}, usando template como fallback:`,
          err.message || err
        );
        const html = gerarHtmlReciboTemplate(dadosRecibo);
        pdfResult = await gerarPdfRecibo(html, dadosRecibo.numero_recibo);
      }

      // Atualizar recibo com PDF e hash
      await query(
        `UPDATE recibos SET pdf = $1, hash_pdf = $2, backup_path = $3, atualizado_em = CURRENT_TIMESTAMP WHERE id = $4`,
        [
          pdfResult.pdfBuffer,
          pdfResult.hash,
          pdfResult.localPath || null,
          r.recibo_id,
        ]
      );

      console.log(
        `✅ PDF gerado para recibo ${r.recibo_id} (hash ${pdfResult.hash})`
      );
    } catch (error) {
      console.error(
        `❌ Erro ao gerar PDF para recibo ${r.recibo_id}:`,
        error.message || error
      );
    }
  }

  console.log('Geração de PDFs finalizada.');
})();
