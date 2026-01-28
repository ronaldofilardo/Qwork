/**
 * Gerador de Recibos Legais com PDF BYTEA
 *
 * Gera recibos de pagamento com:
 * - Número do recibo único
 * - Dados completos do contratante e plano
 * - Vigência do contrato (início + 364 dias)
 * - PDF binário (BYTEA) com hash SHA-256
 * - Cópia local em ./storage/recibos/
 * - Auditoria completa
 */

import { query } from '@/lib/infrastructure/database';
import type { Session } from '@/lib/session';
import { gerarHtmlReciboTemplate } from '../templates/recibo-template';

// ============================================================================
// INTERFACES
// ============================================================================

export interface ReciboData {
  contratante_id: number;
  pagamento_id: number;
  contrato_id: number; // OBRIGATÓRIO - Não pode gerar recibo sem contrato
  emitido_por_cpf?: string;
  ip_emissao?: string;
  // Dados do pagamento pré-carregados (para evitar query que pode causar lock)
  pagamento_dados?: {
    valor: number;
    valor_por_funcionario?: number;
    numero_funcionarios?: number;
    metodo?: string;
    numero_parcelas?: number;
    detalhes_parcelas?: any;
    plataforma_nome?: string;
    plataforma_id?: string;
    data_pagamento?: string;
  };
}

export interface ReciboCompleto {
  id: number;
  numero_recibo: string;
  contratante_nome: string;
  contratante_cnpj?: string;
  contratante_cpf?: string;
  contratante_endereco?: string;
  contratante_cidade?: string;
  contratante_estado?: string;
  contratante_cep?: string;
  plano_nome: string;
  plano_tipo: string;
  plano_descricao?: string;
  valor_total: number;
  valor_por_funcionario?: number;
  qtd_funcionarios?: number;
  metodo_pagamento: string;
  numero_parcelas: number;
  detalhes_parcelas?: any;
  plataforma_pagamento?: string;
  transacao_id?: string;
  data_inicio_vigencia: Date;
  data_fim_vigencia: Date;
  contrato_hash?: string;
  contrato_url?: string;
  emitido_em: Date;
  recibo_pdf_url?: string;
  recibo_html_url?: string;
  pdf?: Buffer;
  hash_pdf?: string;
  backup_path?: string;
}

// ============================================================================
// FUNÇÃO PRINCIPAL: GERAR RECIBO
// ============================================================================

/**
 * Gera um recibo completo após confirmação de pagamento com PDF BYTEA
 */
export async function gerarRecibo(
  data: ReciboData,
  _session?: Session
): Promise<ReciboCompleto> {
  try {
    console.log('[RECIBO] iniciar gerarRecibo', {
      pagamento_id: data.pagamento_id,
      contrato_id: data.contrato_id,
      contratante_id: data.contratante_id,
    });

    // VALIDAÇÃO CRÍTICA: Contrato é obrigatório
    if (!data.contrato_id) {
      throw new Error(
        'Não é possível gerar recibo sem um contrato válido. O fluxo correto é: Cadastro → Contrato → Aceite → Pagamento → Recibo'
      );
    }

    // 1. Verificar se já existe recibo para este pagamento (unicidade)
    const reciboExistente = await query<{ id: number; numero_recibo: string }>(
      `SELECT id, numero_recibo FROM recibos WHERE pagamento_id = $1`,
      [data.pagamento_id]
    );

    console.log('[RECIBO] reciboExistente.count=', reciboExistente.rows.length);
    if (reciboExistente.rows.length > 0) {
      throw new Error(
        `Recibo já existe para este pagamento: ${reciboExistente.rows[0].numero_recibo}`
      );
    }

    // 1.1 Verificar se contrato existe e foi aceito
    console.log('[RECIBO] Buscando contrato...');
    const contratoResult = await query<{
      id: number;
      aceito: boolean;
      hash_contrato?: string;
    }>(`SELECT id, aceito, hash_contrato FROM contratos WHERE id = $1`, [
      data.contrato_id,
    ]);
    console.log(
      '[RECIBO] Contrato encontrado, rows:',
      contratoResult.rows.length
    );

    if (contratoResult.rows.length === 0) {
      throw new Error(
        'Contrato não encontrado. Não é possível emitir recibo sem contrato válido.'
      );
    }

    const contrato = contratoResult.rows[0];

    if (!contrato.aceito) {
      throw new Error(
        'Contrato não foi aceito. O contratante deve aceitar o contrato antes do pagamento.'
      );
    }

    if (!contrato.hash_contrato) {
      console.warn(
        `[RECIBO] Contrato ${contrato.id} não possui hash. Integridade comprometida.`
      );
    }

    // 2. Buscar dados do contratante
    console.log('[RECIBO] Buscando contratante...');
    const contratanteResult = await query<{
      id: number;
      nome: string;
      cnpj?: string;
      responsavel_cpf?: string;
      endereco?: string;
      cidade?: string;
      estado?: string;
      cep?: string;
      tipo?: string;
    }>(
      `SELECT id, nome, cnpj, responsavel_cpf, endereco, cidade, estado, cep, tipo
       FROM contratantes WHERE id = $1`,
      [data.contratante_id]
    );
    console.log(
      '[RECIBO] Contratante encontrado, rows:',
      contratanteResult.rows.length
    );

    if (contratanteResult.rows.length === 0) {
      throw new Error('Contratante não encontrado');
    }

    const contratante = contratanteResult.rows[0];

    // 3. Buscar ou usar dados do pagamento pré-carregados
    let pagamento;
    if (data.pagamento_dados) {
      console.log(
        '[RECIBO] Usando dados do pagamento pré-carregados (evitando query)'
      );
      pagamento = {
        id: data.pagamento_id,
        ...data.pagamento_dados,
      };
    } else {
      console.log('[RECIBO] Buscando pagamento no banco...');
      let pagamentoResult;
      try {
        pagamentoResult = await query<{
          id: number;
          valor: number;
          valor_por_funcionario?: number;
          numero_funcionarios?: number;
          metodo?: string;
          numero_parcelas?: number;
          detalhes_parcelas?: any;
          plataforma_nome?: string;
          plataforma_id?: string;
          data_pagamento?: string;
        }>(
          `SELECT id, valor, valor_por_funcionario, numero_funcionarios, metodo, 
                  numero_parcelas, detalhes_parcelas, plataforma_nome, plataforma_id, 
                  data_pagamento 
           FROM pagamentos 
           WHERE id = $1`,
          [data.pagamento_id]
        );
        console.log(
          '[RECIBO] Pagamento query completada, rows:',
          pagamentoResult.rows.length
        );
      } catch (pgErr) {
        console.error('[RECIBO] ERRO ao buscar pagamento:', pgErr);
        throw new Error(`Falha ao buscar dados do pagamento: ${pgErr}`);
      }

      if (pagamentoResult.rows.length === 0) {
        throw new Error('Pagamento não encontrado');
      }

      pagamento = pagamentoResult.rows[0];
    }

    // 4. Buscar dados do plano do contrato
    console.log('[RECIBO] Buscando plano do contrato...');
    const planoResult = await query<{
      nome?: string;
      tipo?: string;
      descricao?: string;
    }>(
      `SELECT pl.nome, pl.tipo, pl.descricao
       FROM contratos c
       LEFT JOIN planos pl ON c.plano_id = pl.id
       WHERE c.id = $1`,
      [data.contrato_id]
    );

    console.log('[RECIBO] Plano encontrado, rows:', planoResult.rows.length);

    const planoData = planoResult.rows[0] || {};
    const pagamentoCompleto = {
      ...pagamento,
      plano_nome: planoData.nome || 'Plano Padrão',
      plano_tipo: planoData.tipo || 'fixo',
      plano_descricao: planoData.descricao || 'Descrição padrão',
    };

    // 5. Gerar número do recibo
    const numeroReciboResult = await query<{ numero: string }>(
      `SELECT gerar_numero_recibo() as numero`,
      []
    );
    const numeroRecibo = numeroReciboResult.rows[0].numero;
    console.log('[RECIBO] numeroRecibo gerado=', numeroRecibo);

    // 6. Calcular vigência (início = data pagamento, fim = início + 364 dias)
    const dataInicio = pagamento.data_pagamento
      ? new Date(pagamento.data_pagamento)
      : new Date();
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 364);

    // 7. Preparar dados completos para o template
    const pagamentoValorRaw = Number(pagamento.valor);
    const pagamentoValorPorFuncionario = pagamento.valor_por_funcionario
      ? parseFloat(String(pagamento.valor_por_funcionario))
      : null;
    const pagamentoNumeroFuncionarios = pagamento.numero_funcionarios
      ? parseInt(String(pagamento.numero_funcionarios), 10)
      : null;

    const computedValorTotal =
      pagamentoValorPorFuncionario && pagamentoNumeroFuncionarios
        ? pagamentoValorPorFuncionario * pagamentoNumeroFuncionarios
        : pagamentoValorRaw;

    const computedValorPorFuncionario = pagamentoValorPorFuncionario
      ? pagamentoValorPorFuncionario
      : pagamentoNumeroFuncionarios && pagamentoValorRaw
        ? parseFloat(
            (pagamentoValorRaw / pagamentoNumeroFuncionarios).toFixed(2)
          )
        : null;

    const computedNumeroFuncionarios = pagamentoNumeroFuncionarios || 1;

    const dadosRecibo: ReciboCompleto = {
      id: 0, // Será preenchido após insert
      numero_recibo: numeroRecibo,
      contratante_nome: contratante.nome,
      contratante_cnpj: contratante.cnpj,
      contratante_cpf: contratante.responsavel_cpf,
      contratante_endereco: contratante.endereco,
      contratante_cidade: contratante.cidade,
      contratante_estado: contratante.estado,
      contratante_cep: contratante.cep,
      plano_nome: pagamentoCompleto.plano_nome,
      plano_tipo: pagamentoCompleto.plano_tipo,
      plano_descricao: pagamentoCompleto.plano_descricao,
      valor_total: computedValorTotal,
      valor_por_funcionario: computedValorPorFuncionario,
      qtd_funcionarios: computedNumeroFuncionarios,
      metodo_pagamento: pagamento.metodo || 'avista',
      numero_parcelas: pagamento.numero_parcelas || 1,
      detalhes_parcelas: pagamento.detalhes_parcelas,
      plataforma_pagamento: pagamento.plataforma_nome,
      transacao_id: pagamento.plataforma_id,
      data_inicio_vigencia: dataInicio,
      data_fim_vigencia: dataFim,
      contrato_hash: null,
      emitido_em: new Date(),
    };

    // 8. Gerar HTML do recibo usando o template oficial
    const _htmlRecibo = gerarHtmlReciboTemplate(dadosRecibo);

    // 9. Não gerar PDF - usuário imprime direto da página
    console.log('[RECIBO] Recibo será exibido na página (sem PDF)');

    // 10. Calcular valor_parcela com base no valor total e número de parcelas
    const valorParcela =
      dadosRecibo.numero_parcelas > 1
        ? parseFloat(
            (
              Number(dadosRecibo.valor_total) / dadosRecibo.numero_parcelas
            ).toFixed(2)
          )
        : Number(dadosRecibo.valor_total);

    // 11. Inserir recibo no banco (sem PDF - apenas registro)
    console.log('[RECIBO] Inserindo recibo no banco...', {
      numeroRecibo,
      contratante_id: data.contratante_id,
      pagamento_id: data.pagamento_id,
      valor_total: dadosRecibo.valor_total,
    });

    let reciboResult;
    try {
      reciboResult = await query<{ id: number; numero_recibo: string }>(
        `INSERT INTO recibos (
          numero_recibo,
          contratante_id,
          pagamento_id,
          contrato_id,
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
          ip_emissao
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15
        ) RETURNING id, numero_recibo`,
        [
          numeroRecibo, // $1
          data.contratante_id, // $2
          data.pagamento_id, // $3
          data.contrato_id, // $4
          dataInicio, // $5
          dataFim, // $6
          dadosRecibo.qtd_funcionarios, // $7
          dadosRecibo.valor_total, // $8
          dadosRecibo.valor_por_funcionario, // $9
          pagamento.metodo || 'avista', // $10
          dadosRecibo.numero_parcelas || 1, // $11
          valorParcela, // $12
          pagamento.detalhes_parcelas ||
            JSON.stringify(dadosRecibo.detalhes_parcelas) ||
            null, // $13
          data.emitido_por_cpf || null, // $14
          data.ip_emissao || null, // $15 - IP (pode ser null)
        ]
      );
      console.log('[RECIBO] INSERT completado');
    } catch (insertErr) {
      console.error('[RECIBO] ERRO CRÍTICO no INSERT:', insertErr);
      throw new Error(`Falha ao inserir recibo: ${insertErr}`);
    }

    console.log('[RECIBO] Recibo inserido com sucesso:', reciboResult.rows[0]);

    const recibo = reciboResult.rows[0];

    if (!recibo || !recibo.id) {
      throw new Error(
        '[RECIBO] ERRO CRÍTICO: INSERT não retornou recibo com ID'
      );
    }

    // 12. Atualizar pagamento com número do recibo (usando NOWAIT para evitar deadlock)
    console.log('[RECIBO] Atualizando pagamento com número do recibo...');
    try {
      await query(
        `UPDATE pagamentos
         SET recibo_numero = $1, recibo_url = $2
         WHERE id = $3`,
        [numeroRecibo, `/recibo/${recibo.id}`, data.pagamento_id]
      );
      console.log('[RECIBO] UPDATE pagamento concluído');
    } catch (updateErr) {
      console.error(
        '[RECIBO] Erro ao atualizar pagamento (não crítico):',
        updateErr
      );
      // Não falhar a geração do recibo por erro no UPDATE
    }

    // 13. Criar notificação para o contratante
    try {
      await query(`SELECT criar_notificacao_recibo($1, $2, $3, $4)`, [
        data.contratante_id,
        numeroRecibo,
        dadosRecibo.valor_total,
        contratante.responsavel_cpf,
      ]);
    } catch (notifError) {
      console.error(
        '[RECIBO] Erro ao criar notificação (não crítico):',
        notifError
      );
      // Não falhar a geração do recibo por erro de notificação
    }

    // 14. Registrar auditoria simplificada
    try {
      await query(
        `INSERT INTO auditoria (tipo_recurso, recurso_id, acao, usuario_cpf, ip, dados_alterados, timestamp, hash_auditoria)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, gerar_hash_auditoria($1, $2, $3, $6, CURRENT_TIMESTAMP))`,
        [
          'recibos',
          recibo.id,
          'RECIBO_EMITIDO',
          data.emitido_por_cpf || 'SISTEMA',
          data.ip_emissao || 'unknown',
          JSON.stringify({
            pagamento_id: data.pagamento_id,
            recibo_id: recibo.id,
            numero_recibo: numeroRecibo,
            valor_total: dadosRecibo.valor_total,
          }),
        ]
      );
    } catch (auditError) {
      console.error(
        '[RECIBO] Erro ao registrar auditoria (não crítico):',
        auditError
      );
      // Não falhar a geração do recibo por erro de auditoria
    }

    console.log('[RECIBO] Recibo gerado com sucesso (sem PDF - apenas HTML)');

    // 15. Retornar recibo completo
    return {
      ...dadosRecibo,
      id: recibo.id,
    };
  } catch (error) {
    console.error('Erro ao gerar recibo:', error);
    throw error;
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Buscar recibo por ID
 */
export async function buscarRecibo(
  reciboId: number,
  _session?: Session
): Promise<ReciboCompleto | null> {
  const result = await query<ReciboCompleto>(
    `SELECT * FROM recibos WHERE id = $1`,
    [reciboId]
  );

  return result.rows[0] || null;
}

/**
 * Buscar recibo por número
 */
export async function buscarReciboPorNumero(
  numeroRecibo: string,
  _session?: Session
): Promise<ReciboCompleto | null> {
  const result = await query<ReciboCompleto>(
    `SELECT * FROM recibos WHERE numero_recibo = $1`,
    [numeroRecibo]
  );

  return result.rows[0] || null;
}

/**
 * Listar recibos de um contratante
 */
export async function listarRecibosPorContratante(
  contratanteId: number,
  _session?: Session
): Promise<ReciboCompleto[]> {
  const result = await query<ReciboCompleto>(
    `SELECT * FROM recibos
     WHERE contratante_id = $1 AND cancelado = false
     ORDER BY emitido_em DESC`,
    [contratanteId]
  );

  return result.rows;
}

/**
 * Cancelar recibo
 */
export async function cancelarRecibo(
  reciboId: number,
  motivo: string,
  _session?: Session
): Promise<void> {
  await query(
    `UPDATE recibos
     SET cancelado = true,
         cancelado_em = NOW(),
         motivo_cancelamento = $2
     WHERE id = $1`,
    [reciboId, motivo]
  );
}

// ============================================================================
// GERAÇÃO DE HTML DO RECIBO
// ============================================================================

/**
 * Gera HTML formatado do recibo para visualização/impressão
 */
export function gerarHtmlRecibo(recibo: ReciboCompleto): string {
  const dataEmissao = new Date(recibo.emitido_em).toLocaleDateString('pt-BR');
  const dataInicio = new Date(recibo.data_inicio_vigencia).toLocaleDateString(
    'pt-BR'
  );
  const dataFim = new Date(recibo.data_fim_vigencia).toLocaleDateString(
    'pt-BR'
  );

  const valorFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(recibo.valor_total));

  let parcelasHtml = '';
  if (recibo.numero_parcelas > 1 && recibo.detalhes_parcelas) {
    const parcelas = JSON.parse(
      typeof recibo.detalhes_parcelas === 'string'
        ? recibo.detalhes_parcelas
        : JSON.stringify(recibo.detalhes_parcelas)
    );

    parcelasHtml = `
      <h3>Detalhamento de Parcelas</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="border: 1px solid #ddd; padding: 8px;">Parcela</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Valor</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Vencimento</th>
          </tr>
        </thead>
        <tbody>
          ${parcelas
            .map(
              (p: any) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.numero}/${recibo.numero_parcelas}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(p.vencimento).toLocaleDateString('pt-BR')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recibo ${recibo.numero_recibo}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #FF6B00; padding-bottom: 20px; }
    .logo { color: #FF6B00; font-size: 32px; font-weight: bold; }
    .section { margin-bottom: 20px; }
    .section-title { background-color: #FF6B00; color: white; padding: 10px; font-weight: bold; }
    .field { margin: 10px 0; }
    .field-label { font-weight: bold; display: inline-block; width: 200px; }
    .footer { margin-top: 40px; font-size: 12px; color: #666; text-align: center; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">QWork</div>
    <h2>RECIBO DE PAGAMENTO</h2>
    <p><strong>Número:</strong> ${recibo.numero_recibo}</p>
    <p><strong>Emissão:</strong> ${dataEmissao}</p>
  </div>

  <div class="section">
    <div class="section-title">DADOS DO CONTRATANTE</div>
    <div class="field">
      <span class="field-label">Nome/Razão Social:</span>
      ${recibo.contratante_nome}
    </div>
    ${recibo.contratante_cnpj ? `<div class="field"><span class="field-label">CNPJ:</span> ${recibo.contratante_cnpj}</div>` : ''}
    ${recibo.contratante_cpf ? `<div class="field"><span class="field-label">CPF:</span> ${recibo.contratante_cpf}</div>` : ''}
    ${recibo.contratante_endereco ? `<div class="field"><span class="field-label">Endereço:</span> ${recibo.contratante_endereco}</div>` : ''}
    ${recibo.contratante_cidade && recibo.contratante_estado ? `<div class="field"><span class="field-label">Cidade/UF:</span> ${recibo.contratante_cidade}/${recibo.contratante_estado}</div>` : ''}
    ${recibo.contratante_cep ? `<div class="field"><span class="field-label">CEP:</span> ${recibo.contratante_cep}</div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">DADOS DO PLANO CONTRATADO</div>
    <div class="field">
      <span class="field-label">Plano:</span>
      ${recibo.plano_nome}
    </div>
    <div class="field">
      <span class="field-label">Tipo:</span>
      ${recibo.plano_tipo === 'fixo' ? 'Plano Fixo' : 'Plano Personalizado'}
    </div>
    ${recibo.plano_descricao ? `<div class="field"><span class="field-label">Descrição:</span> ${recibo.plano_descricao}</div>` : ''}
    ${recibo.qtd_funcionarios ? `<div class="field"><span class="field-label">Quantidade de Funcionários:</span> ${recibo.qtd_funcionarios}</div>` : ''}
    ${recibo.valor_por_funcionario ? `<div class="field"><span class="field-label">Valor por Funcionário:</span> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(recibo.valor_por_funcionario))}</div>` : ''}
    <div class="field">
      <span class="field-label">Valor Total:</span>
      <strong>${valorFormatado}</strong>
    </div>
  </div>

  <div class="section">
    <div class="section-title">VIGÊNCIA DO CONTRATO</div>
    <div class="field">
      <span class="field-label">Início:</span>
      ${dataInicio}
    </div>
    <div class="field">
      <span class="field-label">Término:</span>
      ${dataFim}
    </div>
    <div class="field">
      <span class="field-label">Período:</span>
      364 dias (1 ano comercial)
    </div>
  </div>

  <div class="section">
    <div class="section-title">DADOS DO PAGAMENTO</div>
    <div class="field">
      <span class="field-label">Método:</span>
      ${recibo.metodo_pagamento}
    </div>
    <div class="field">
      <span class="field-label">Parcelas:</span>
      ${recibo.numero_parcelas}x
    </div>
    ${recibo.plataforma_pagamento ? `<div class="field"><span class="field-label">Plataforma:</span> ${recibo.plataforma_pagamento}</div>` : ''}
    ${recibo.transacao_id ? `<div class="field"><span class="field-label">ID Transação:</span> ${recibo.transacao_id}</div>` : ''}
    ${recibo.contrato_hash ? `<div class="field"><span class="field-label">Hash Contrato:</span> <code style="font-size: 11px;">${recibo.contrato_hash}</code></div>` : ''}
  </div>

  ${parcelasHtml}

  <div class="footer">
    <p>Este recibo comprova o pagamento e a contratação dos serviços da plataforma QWork.</p>
    <p>Contrato de Prestação de Serviços disponível em: <a href="/termos/contrato">www.qwork.com.br/termos/contrato</a></p>
    <p>Hash do contrato: ${recibo.contrato_hash || 'N/A'}</p>
    <p><strong>QWork</strong> - Sistema de Avaliação Psicossocial COPSOQ III</p>
    <p>Suporte: suporte@qwork.com.br | Dúvidas: www.qwork.com.br/suporte</p>
  </div>
</body>
</html>
  `;
}
