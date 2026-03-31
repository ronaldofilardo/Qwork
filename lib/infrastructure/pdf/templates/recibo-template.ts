/**
 * lib/templates/recibo-template.ts
 * Template HTML para recibos de pagamento
 *
 * Gera layout profissional com:
 * - Cabeçalho com logo QWork
 * - Dados do tomador
 * - Detalhes do plano e pagamento
 * - Vigência do contrato
 * - Hash SHA-256 no rodapé para verificação de integridade
 */

import { ReciboCompleto } from '../generators/receipt-generator';

// ============================================================================
// INTERFACE
// ============================================================================

export interface ReciboTemplateData extends ReciboCompleto {
  hash_pdf?: string; // Hash será inserido como {{HASH_PDF}} no template
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarData(data: Date): string {
  // Formatar sempre em UTC para evitar deslocamentos causados por fuso horário
  const d = new Date(data);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function formatarCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatarCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function montarEnderecoCompleto(
  endereco?: string,
  cidade?: string,
  estado?: string,
  cep?: string
): string {
  const partes: string[] = [];
  if (endereco) partes.push(endereco);
  if (cidade && estado) partes.push(`${cidade}/${estado}`);
  if (cep) partes.push(`CEP: ${cep}`);
  return partes.join(' - ');
}

function formatarMetodoPagamento(metodo: string): string {
  const metodos: { [key: string]: string } = {
    avista: 'À Vista',
    parcelado: 'Parcelado',
    pix: 'PIX',
    boleto: 'Boleto Bancário',
    cartao_credito: 'Cartão de Crédito',
    cartao_debito: 'Cartão de Débito',
    transferencia: 'Transferência Bancária',
  };
  return metodos[metodo] || metodo;
}

function montarDetalhamentoPagamento(
  metodo: string,
  parcelas: number,
  valorTotal: number,
  detalhesParcelas?: any,
  plataforma?: string,
  transacaoId?: string
): string {
  let html = `
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Método de Pagamento</div>
        <div class="info-value">${formatarMetodoPagamento(metodo)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Número de Parcelas</div>
        <div class="info-value">${parcelas}x</div>
      </div>
  `;

  if (parcelas > 1) {
    const valorParcela = valorTotal / parcelas;
    html += `
      <div class="info-item">
        <div class="info-label">Valor por Parcela</div>
        <div class="info-value">${formatarMoeda(valorParcela)}</div>
      </div>
    `;
  }

  if (plataforma) {
    html += `
      <div class="info-item">
        <div class="info-label">Plataforma</div>
        <div class="info-value">${plataforma}</div>
      </div>
    `;
  }

  if (transacaoId) {
    html += `
      <div class="info-item">
        <div class="info-label">ID da Transação</div>
        <div class="info-value">${transacaoId}</div>
      </div>
    `;
  }

  html += `</div>`;

  // Detalhamento de parcelas (se disponível)
  if (
    detalhesParcelas &&
    Array.isArray(detalhesParcelas) &&
    detalhesParcelas.length > 0
  ) {
    html += `
      <div style="margin-top: 15px;">
        <div class="info-label" style="margin-bottom: 10px;">Detalhamento das Parcelas</div>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Parcela</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Valor</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Vencimento</th>
            </tr>
          </thead>
          <tbody>
    `;

    function safeParseDate(d: any): Date {
      if (!d) return new Date();
      if (d instanceof Date) return d;
      if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        return new Date(d + 'T00:00:00Z');
      }
      return new Date(d);
    }

    detalhesParcelas.forEach((parcela: any) => {
      const venc = safeParseDate(parcela.vencimento);
      html += `
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${parcela.parcela}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${formatarMoeda(parcela.valor)}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${formatarData(venc)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  return html;
}

// ============================================================================
// FUNÇÃO PRINCIPAL - GERAR HTML DO RECIBO
// ============================================================================

export function gerarHtmlReciboTemplate(recibo: ReciboTemplateData): string {
  const {
    numero_recibo,
    tomador_nome,
    tomador_cnpj,
    tomador_cpf,
    tomador_endereco,
    tomador_cidade,
    tomador_estado,
    tomador_cep,
    valor_total,
    metodo_pagamento,
    numero_parcelas,
    detalhes_parcelas,
    plataforma_pagamento,
    transacao_id,
    data_inicio_vigencia,
    data_fim_vigencia,
    contrato_hash,
  } = recibo;

  // Formatação de valores
  const valorFormatado = formatarMoeda(valor_total);
  const dataInicioFormatada = formatarData(new Date(data_inicio_vigencia));
  const dataFimFormatada = formatarData(new Date(data_fim_vigencia));
  const dataEmissao = formatarData(new Date(recibo.emitido_em || new Date()));

  // Identificação do tomador (CNPJ ou CPF)
  const identificacao = tomador_cnpj
    ? `CNPJ: ${formatarCNPJ(tomador_cnpj)}`
    : `CPF: ${formatarCPF(tomador_cpf || '')}`;

  // Endereço completo
  const enderecoCompleto = montarEnderecoCompleto(
    tomador_endereco,
    tomador_cidade,
    tomador_estado,
    tomador_cep
  );

  // Detalhes do pagamento
  const detalhamentoPagamento = montarDetalhamentoPagamento(
    metodo_pagamento,
    numero_parcelas,
    valor_total,
    detalhes_parcelas,
    plataforma_pagamento,
    transacao_id
  );

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo ${numero_recibo}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: white;
      padding: 0;
      margin: 0;
      font-size: 11pt;
    }

    .container {
      max-width: 100%;
      margin: 0;
      background: white;
      padding: 20mm;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #FF6B00;
    }

    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #FF6B00;
      margin-bottom: 10px;
    }

    .titulo {
      font-size: 24px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 5px;
    }

    .subtitulo {
      font-size: 14px;
      color: #6b7280;
    }

    .numero-recibo {
      font-size: 16px;
      font-weight: bold;
      color: #FF6B00;
      margin-top: 15px;
      padding: 10px;
      background: #fff7ed;
      border-left: 4px solid #FF6B00;
    }

    .secao {
      margin-bottom: 25px;
    }

    .secao-titulo {
      font-size: 14px;
      font-weight: bold;
      color: #FF6B00;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e5e7eb;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .info-item {
      margin-bottom: 10px;
    }

    .info-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }

    .info-value {
      font-size: 12px;
      color: #1f2937;
      font-weight: 500;
    }

    .destaque {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .valor-total {
      font-size: 28px;
      font-weight: bold;
      color: #059669;
      text-align: center;
      margin: 20px 0;
    }

    .vigencia-box {
      background: linear-gradient(135deg, #FF6B00 0%, #ff8534 100%);
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      text-align: center;
    }

    .vigencia-titulo {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
    }

    .vigencia-datas {
      font-size: 18px;
      font-weight: bold;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #6b7280;
    }

    .hash-section {
      margin-top: 30px;
      padding: 15px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .hash-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .hash-value {
      font-family: 'Courier New', monospace;
      font-size: 9px;
      color: #374151;
      word-break: break-all;
      line-height: 1.4;
    }

    .assinatura-section {
      margin-top: 50px;
      text-align: center;
    }

    .assinatura-linha {
      width: 300px;
      margin: 0 auto;
      border-top: 1px solid #1f2937;
      padding-top: 10px;
      font-size: 11px;
      color: #6b7280;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- CABEÇALHO -->
    <div class="header">
      <div class="logo">QWork</div>
      <div class="titulo">Recibo de Pagamento</div>
      <div class="subtitulo">Comprovante de Contratação de Serviços</div>
      <div class="numero-recibo">Nº ${numero_recibo}</div>
    </div>

    <!-- DADOS DO tomador -->
    <div class="secao">
      <div class="secao-titulo">📋 Dados do tomador</div>
      <div class="destaque">
        <div class="info-item">
          <div class="info-label">Nome / Razão Social</div>
          <div class="info-value">${tomador_nome}</div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Identificação</div>
            <div class="info-value">${identificacao}</div>
          </div>
          ${
            enderecoCompleto
              ? `
          <div class="info-item">
            <div class="info-label">Endereço</div>
            <div class="info-value">${enderecoCompleto}</div>
          </div>
          `
              : ''
          }
        </div>
      </div>
    </div>

    <!-- VALOR TOTAL -->
    <div class="secao">
      <div class="secao-titulo">💰 Valor Total</div>
      <div class="valor-total">${valorFormatado}</div>
    </div>

    <!-- DETALHES DO PAGAMENTO -->
    <div class="secao">
      <div class="secao-titulo">💳 Detalhes do Pagamento</div>
      <div class="destaque">
        ${detalhamentoPagamento}
      </div>
    </div>

    <!-- VIGÊNCIA -->
    <div class="vigencia-box">
      <div class="vigencia-titulo">📅 Vigência do Contrato</div>
      <div class="vigencia-datas">
        ${dataInicioFormatada} até ${dataFimFormatada}
      </div>
    </div>

    <!-- HASH DE INTEGRIDADE -->
    <div class="hash-section">
      <div class="hash-label">🔒 Hash de Integridade (SHA-256)</div>
      <div class="hash-value">{{HASH_PDF}}</div>
      <div style="margin-top: 10px; font-size: 9px; color: #6b7280;">
        Este hash garante a autenticidade e integridade do documento. Qualquer alteração no conteúdo resultará em um hash diferente.
      </div>
    </div>

    <!-- ASSINATURA (OPCIONAL) -->
    <div class="assinatura-section">
      <div class="assinatura-linha">
        Assinatura do tomador
      </div>
    </div>

    <!-- RODAPÉ -->
    <div class="footer">
      <p><strong>QWork - Sistema de Avaliação Psicossocial</strong></p>
      <p>Recibo emitido em ${dataEmissao}</p>
      ${contrato_hash ? `<p>Ref. Contrato: ${contrato_hash}</p>` : ''}
      <p style="margin-top: 10px;">
        Este documento é um comprovante de pagamento e contratação de serviços.<br>
        Em caso de dúvidas, entre em contato através dos canais oficiais.
      </p>
    </div>
  </div>
</body>
</html>
`;
}
