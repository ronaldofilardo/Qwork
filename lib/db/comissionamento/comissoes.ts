/**
 * lib/db/comissionamento/comissoes.ts
 *
 * Gestão de comissões: listagem, criação (admin/automática),
 * atualização de status e ativação de parcelas.
 */

import { query } from '../query';
import type {
  StatusComissao,
  MotivoCongelamento,
} from '../../types/comissionamento';
import { registrarAuditoria } from './auditoria';
import {
  calcularValoresComissao,
  determinarStatusInicialComissao,
  calcularMesesComissao,
} from './comissoes-calculos';

/** Lista comissões de um representante com resumo */
export async function getComissoesByRepresentante(
  representanteId: number,
  opts?: { status?: string; mes?: string; page?: number; limit?: number }
) {
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 30;
  const offset = (page - 1) * limit;

  const wheres = [`c.representante_id = $1`];
  const params: unknown[] = [representanteId];
  let i = 2;

  const statusValidos: StatusComissao[] = [
    'retida',
    'congelada_aguardando_admin',
    'liberada',
    'paga',
    'cancelada',
  ];
  if (opts?.status && statusValidos.includes(opts.status as StatusComissao)) {
    wheres.push(`c.status = $${i++}`);
    params.push(opts.status);
  }

  if (opts?.mes) {
    wheres.push(`c.mes_emissao = $${i++}::date`);
    params.push(`${opts.mes}-01`);
  }

  const where = `WHERE ${wheres.join(' AND ')}`;

  const resumo = await query(
    `SELECT
       COUNT(*) FILTER (WHERE c.status::text = 'retida')                                        AS pendentes,
       COUNT(*) FILTER (WHERE c.status::text = 'liberada')                                      AS liberadas,
       COUNT(*) FILTER (WHERE c.status::text = 'paga')                                          AS pagas,
       -- valor_pendente: comissões retidas com parcela já paga
       COALESCE(SUM(c.valor_comissao) FILTER (WHERE
         c.status::text = 'retida' AND c.parcela_confirmada_em IS NOT NULL
       ), 0) AS valor_pendente,
       -- valor_futuro: comissões provisionadas aguardando pagamento da parcela
       COALESCE(SUM(c.valor_comissao) FILTER (WHERE
         c.status::text = 'retida' AND c.parcela_confirmada_em IS NULL
       ), 0) AS valor_futuro,
       COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text = 'liberada'), 0)            AS valor_liberado,
       COALESCE(SUM(c.valor_comissao) FILTER (WHERE c.status::text = 'paga'), 0)                AS valor_pago_total
     FROM comissoes_laudo c
     WHERE c.representante_id = $1`,
    [representanteId]
  );

  const countResult = await query<{ total: string }>(
    `SELECT COUNT(*) as total FROM comissoes_laudo c ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

  params.push(limit, offset);
  const rows = await query(
    `SELECT
       c.*,
       COALESCE(e.nome, cl.nome) AS entidade_nome
     FROM comissoes_laudo c
     LEFT JOIN entidades e  ON e.id  = c.entidade_id
     LEFT JOIN clinicas  cl ON cl.id = c.clinica_id
     ${where}
     ORDER BY c.criado_em DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    params
  );

  return { comissoes: rows.rows, total, page, limit, resumo: resumo.rows[0] };
}

/** Atualiza status de comissão (admin) */
export async function atualizarStatusComissao(
  comissaoId: number,
  novoStatus: StatusComissao,
  extras?: {
    motivo_congelamento?: MotivoCongelamento;
    comprovante_pagamento_path?: string;
  }
) {
  const setClauses: string[] = [`status = $2`, `atualizado_em = NOW()`];
  const params: unknown[] = [comissaoId, novoStatus];
  let i = 3;

  if (novoStatus === 'liberada') {
    setClauses.push(`data_liberacao = NOW()`);
  }
  if (novoStatus === 'paga') setClauses.push(`data_pagamento = NOW()`);

  if (
    novoStatus === 'congelada_aguardando_admin' &&
    extras?.motivo_congelamento
  ) {
    setClauses.push(`motivo_congelamento = $${i++}`);
    params.push(extras.motivo_congelamento);
  }

  if (extras?.comprovante_pagamento_path) {
    setClauses.push(`comprovante_pagamento_path = $${i++}`);
    params.push(extras.comprovante_pagamento_path);
  }

  // Limpar motivo ao descongelar
  if (novoStatus === 'retida') {
    setClauses.push(`motivo_congelamento = NULL`);
  }

  const result = await query(
    `UPDATE comissoes_laudo SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0] ?? null;
}

/**
 * Cria comissão para um lote pago, associada a uma parcela específica.
 * Pode ser chamada manualmente pelo admin ou automaticamente via webhook.
 * Fórmula: valor_comissao = base_calculo × percentual_comissao / 100
 *   base_calculo = valor_parcela (se informado) OU valor_laudo / total_parcelas
 * Previne duplicata por (lote_pagamento_id, parcela_numero).
 */
export async function criarComissaoAdmin(params: {
  lote_pagamento_id: number;
  vinculo_id: number;
  representante_id: number;
  entidade_id?: number | null;
  clinica_id?: number | null;
  laudo_id?: number | null;
  valor_laudo: number;
  /** Valor líquido da parcela (ex: netValue do Asaas). Usado diretamente no cálculo. */
  valor_parcela?: number | null;
  /** Número da parcela 1-based. Padrão 1 (à vista). */
  parcela_numero?: number;
  /** Total de parcelas. Padrão 1 (à vista). */
  total_parcelas?: number;
  admin_cpf?: string;
  /**
   * Quando true, força status inicial = 'retida' mesmo que o rep seja 'apto'.
   * Usado no provisionamento antecipado de parcelas futuras de lotes parcelados.
   */
  forcar_retida?: boolean;
  /**
   * Timestamp em que a parcela foi confirmada como paga.
   * NULL (padrão) = provisionada para parcela futura.
   * Date = parcela efetivamente paga (ex: à vista confirmado pelo admin).
   */
  parcela_confirmada_em?: Date | null;
}): Promise<{ comissao: Record<string, unknown> | null; erro?: string }> {
  const {
    lote_pagamento_id,
    vinculo_id,
    representante_id,
    entidade_id,
    clinica_id,
    laudo_id,
    valor_laudo,
    valor_parcela: _valor_parcela = null,
    parcela_numero = 1,
    total_parcelas = 1,
    admin_cpf,
    forcar_retida = false,
    parcela_confirmada_em = undefined,
  } = params;

  const parcelaNum = Math.max(1, Math.min(parcela_numero, total_parcelas));
  const totalParc = Math.max(1, total_parcelas);

  // Exige ao menos entidade_id ou clinica_id
  const entId = entidade_id && entidade_id > 0 ? entidade_id : null;
  const clinId = clinica_id && clinica_id > 0 ? clinica_id : null;
  if (!entId && !clinId) {
    return {
      comissao: null,
      erro: 'É necessário informar entidade_id ou clinica_id para gerar comissão.',
    };
  }

  // Verificar duplicata: uma comissão por (lote, parcela)
  const dup = await query(
    `SELECT id FROM comissoes_laudo WHERE lote_pagamento_id = $1 AND parcela_numero = $2 LIMIT 1`,
    [lote_pagamento_id, parcelaNum]
  );
  if (dup.rows.length > 0) {
    return {
      comissao: null,
      erro: `Comissão já gerada para este lote (parcela ${parcelaNum}/${totalParc}).`,
    };
  }

  // Verificar vínculo ativo
  const vinculoResult = await query(
    `SELECT id, status, data_expiracao FROM vinculos_comissao WHERE id = $1 LIMIT 1`,
    [vinculo_id]
  );
  if (vinculoResult.rows.length === 0) {
    return { comissao: null, erro: 'Vínculo de comissão não encontrado.' };
  }
  const vinculo = vinculoResult.rows[0];
  if (!['ativo', 'inativo'].includes(vinculo.status)) {
    return {
      comissao: null,
      erro: `Vínculo com status '${vinculo.status}' não permite geração de comissão.`,
    };
  }

  // Verificar representante — buscar modelo_comissionamento e campos custo_fixo
  const repResult = await query(
    `SELECT id, status, percentual_comissao, modelo_comissionamento,
            valor_custo_fixo_entidade, valor_custo_fixo_clinica, asaas_wallet_id
     FROM representantes WHERE id = $1 LIMIT 1`,
    [representante_id]
  );
  if (repResult.rows.length === 0) {
    return { comissao: null, erro: 'Representante não encontrado.' };
  }
  const rep = repResult.rows[0];
  if (['desativado', 'rejeitado'].includes(rep.status)) {
    return {
      comissao: null,
      erro: `Representante com status '${rep.status}' não pode receber comissão.`,
    };
  }

  // Buscar valor_negociado do vínculo (para custo_fixo), percentual e % comercial
  const vinculoPercResult = await query(
    `SELECT percentual_comissao_representante, valor_negociado, percentual_comissao_comercial
     FROM vinculos_comissao WHERE id = $1 LIMIT 1`,
    [vinculo_id]
  );

  // Calcular valores de comissão via função pura extraída
  const calculoResult = calcularValoresComissao({
    rep,
    vinculoPerc: vinculoPercResult.rows[0] ?? {
      percentual_comissao_representante: null,
      valor_negociado: null,
      percentual_comissao_comercial: null,
    },
    entidadeId: entId,
    valorLaudo: valor_laudo,
    totalParcelas: totalParc,
    valorParcela: _valor_parcela,
  });

  if ('erro' in calculoResult) {
    return { comissao: null, erro: calculoResult.erro };
  }

  const {
    valorComissao,
    percentualRep,
    percComercialVinculo,
    valorComissaoComercial,
  } = calculoResult.resultado;

  // Determinar status inicial via função pura extraída
  const statusInicial = determinarStatusInicialComissao({
    forcarRetida: forcar_retida,
    parcelaConfirmadaEm: parcela_confirmada_em ?? null,
    repApto: rep.status === 'apto',
  });

  // Mês de emissão e pagamento via função pura extraída
  const { mesEmissao, mesPagamento: mes_pagamento } =
    calcularMesesComissao(parcelaNum);

  const result = await query(
    `INSERT INTO comissoes_laudo (
       vinculo_id, representante_id, entidade_id, clinica_id, laudo_id, lote_pagamento_id,
       valor_laudo, percentual_comissao, valor_comissao,
       percentual_comissao_comercial, valor_comissao_comercial,
       status, mes_emissao, mes_pagamento, data_emissao_laudo,
       data_aprovacao, parcela_numero, total_parcelas, parcela_confirmada_em,
       data_pagamento, asaas_split_executado, asaas_split_confirmado_em
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9,
       $10, $11,
       $12::status_comissao, $13::date, $14::date, NOW(),
       NULL,
       $15, $16, $17,
       $18, $19, $20
     ) RETURNING *`,
    [
      vinculo_id,
      representante_id,
      entId,
      clinId,
      laudo_id ?? null,
      lote_pagamento_id,
      valor_laudo,
      percentualRep,
      valorComissao,
      percComercialVinculo,
      valorComissaoComercial,
      statusInicial,
      mesEmissao,
      mes_pagamento,
      parcelaNum,
      totalParc,
      parcela_confirmada_em != null
        ? parcela_confirmada_em.toISOString()
        : null,
      // L10: quando paga, gravar data_pagamento e flags de split executado
      statusInicial === 'paga' ? new Date().toISOString() : null,
      statusInicial === 'paga',
      statusInicial === 'paga' ? new Date().toISOString() : null,
    ]
  );

  const comissaoCriada = result.rows[0];

  // Registrar auditoria
  if (comissaoCriada) {
    await registrarAuditoria({
      tabela: 'comissoes_laudo',
      registro_id: comissaoCriada.id,
      status_anterior: null,
      status_novo: statusInicial,
      triggador: 'admin_action',
      motivo:
        admin_cpf === 'WEBHOOK'
          ? `Comissão automática parcela ${parcelaNum}/${totalParc} via webhook — lote ${lote_pagamento_id} — base bruta R$${(valor_laudo / totalParc).toFixed(2)}`
          : `Comissão parcela ${parcelaNum}/${totalParc} gerada pelo admin — lote ${lote_pagamento_id}`,
      dados_extras: {
        valor_laudo,
        base_calculo_bruto: valor_laudo / totalParc,
        percentual_comissao: percentualRep,
        valor_comissao: valorComissao,
        percentual_comissao_comercial: percComercialVinculo,
        valor_comissao_comercial: valorComissaoComercial,
        status_inicial: statusInicial,
      },
      criado_por_cpf: admin_cpf ?? null,
    });

    // Atualizar ultimo_laudo_em no vínculo
    await query(
      `UPDATE vinculos_comissao SET ultimo_laudo_em = NOW(), status = CASE WHEN status = 'inativo' THEN 'ativo' ELSE status END WHERE id = $1`,
      [vinculo_id]
    );

  }

  return { comissao: comissaoCriada };
}

// ---------------------------------------------------------------------------
// Ativação de parcela paga (retida → paga)
// ---------------------------------------------------------------------------

/**
 * Ativa a comissão de uma parcela específica ao confirmar o seu pagamento.
 * Transição: retida → paga (se rep apto/apto_bloqueado) ou apenas parcela_confirmada_em (se rep não apto).
 *
 * Idempotente: se parcela_confirmada_em já está preenchida, retorna ok:true/ja_ativada.
 * Nunca lança exceção.
 */
export async function ativarComissaoParcelaPaga(params: {
  lote_id: number;
  parcela_numero: number;
}): Promise<{ ok: boolean; motivo?: string }> {
  const { lote_id, parcela_numero } = params;

  try {
    const result = await query(
      `SELECT cl.id, cl.status, cl.parcela_confirmada_em,
              r.status AS rep_status, r.asaas_wallet_id
       FROM comissoes_laudo cl
       JOIN representantes r ON r.id = cl.representante_id
       WHERE cl.lote_pagamento_id = $1 AND cl.parcela_numero = $2
       LIMIT 1`,
      [lote_id, parcela_numero]
    );

    if (result.rows.length === 0) {
      console.warn(
        `[Comissionamento] Comissão não encontrada para lote ${lote_id} parcela ${parcela_numero}`
      );
      return { ok: false, motivo: 'comissao_nao_encontrada' };
    }

    const comissao = result.rows[0];

    // Idempotente: parcela já foi ativada anteriormente
    if (comissao.parcela_confirmada_em !== null) {
      console.log(
        `[Comissionamento] Parcela ${parcela_numero} do lote ${lote_id} já ativada — ignorando (idempotente)`
      );
      return { ok: true, motivo: 'ja_ativada' };
    }

    // Retida = rep não tem wallet_id configurada no Asaas
    // Se tem wallet, comissão é paga (split já executado pelo Asaas)
    const repTemWallet = !!comissao.asaas_wallet_id;
    const statusAnterior: string = comissao.status;
    const statusNovo: StatusComissao = repTemWallet ? 'paga' : 'retida';

    if (repTemWallet) {
      await query(
        `UPDATE comissoes_laudo
         SET parcela_confirmada_em = NOW(),
             status = 'paga'::status_comissao,
             data_pagamento = NOW(),
             asaas_split_executado = TRUE,
             asaas_split_confirmado_em = NOW(),
             atualizado_em = NOW(),
             data_aprovacao = NOW()
         WHERE id = $1`,
        [comissao.id]
      );

    } else {
      // Rep sem wallet: registra confirmação da parcela, mantém retida
      await query(
        `UPDATE comissoes_laudo
         SET parcela_confirmada_em = NOW(),
             atualizado_em = NOW(),
             data_aprovacao = NOW()
         WHERE id = $1`,
        [comissao.id]
      );
    }

    await registrarAuditoria({
      tabela: 'comissoes_laudo',
      registro_id: comissao.id,
      status_anterior: statusAnterior,
      status_novo: statusNovo,
      triggador: 'sistema',
      motivo: repTemWallet
        ? `Parcela ${parcela_numero} paga via webhook — status paga (split Asaas executado)`
        : `Parcela ${parcela_numero} confirmada via webhook — rep sem wallet Asaas, mantida retida`,
    });

    console.log(
      `[Comissionamento] ✅ Parcela ${parcela_numero} do lote ${lote_id} ativada — status: ${statusNovo}`
    );
    return { ok: true };
  } catch (err) {
    console.error(
      `[Comissionamento] Erro ao ativar parcela ${parcela_numero} do lote ${lote_id}:`,
      err
    );
    return { ok: false, motivo: 'erro_interno' };
  }
}

/**
 * Gerencia comissões automaticamente ao confirmar pagamento via webhook Asaas.
 *
 * FLUXO PARCELADO (total_parcelas > 1):
 *   - 1ª chamada (nenhuma comissão no lote): provisiona TODAS as N comissões
 *     como 'retida' com parcela_confirmada_em=NULL (parcelas futuras).
 *   - Toda chamada: ativa a parcela_numero recém-paga via ativarComissaoParcelaPaga
 *
 * FLUXO À VISTA (total_parcelas = 1):
 *   - Comportamento original: cria 1 comissão com parcela_confirmada_em=NOW().
 *
 * Nunca lança exceção. Idempotente.
 */
export async function criarComissaoAutomatica(params: {
  lote_id: number;
  entidade_id: number | null;
  clinica_id: number | null;
  valor_total_lote: number;
  /** Valor líquido da parcela recebido do Asaas (netValue). */
  valor_parcela_liquida: number;
  parcela_numero: number;
  total_parcelas: number;
}): Promise<{
  ok: boolean;
  motivo?: string;
  comissao?: Record<string, unknown>;
}> {
  const {
    lote_id,
    entidade_id,
    clinica_id,
    valor_total_lote,
    valor_parcela_liquida,
    parcela_numero,
    total_parcelas,
  } = params;

  try {
    const entId = entidade_id && entidade_id > 0 ? entidade_id : null;
    const clinId = clinica_id && clinica_id > 0 ? clinica_id : null;

    if (!entId && !clinId) {
      console.log(
        `[Comissionamento] Sem entidade_id nem clinica_id para lote ${lote_id} — sem comissão`
      );
      return { ok: false, motivo: 'sem_entidade_clinica' };
    }

    // Buscar vínculo ativo ou inativo para a entidade ou clínica
    // Aceita 'inativo' também: alinhado com criarComissaoAdmin (90 dias sem laudo não bloqueia comissão)
    const vinculoResult = await query(
      `SELECT vc.id, vc.representante_id, vc.entidade_id, vc.clinica_id, vc.num_vidas_estimado
       FROM vinculos_comissao vc
       WHERE vc.status IN ('ativo', 'inativo')
         AND vc.data_expiracao > CURRENT_DATE
         AND (
           ($1::int IS NOT NULL AND vc.entidade_id = $1)
           OR
           ($2::int IS NOT NULL AND vc.clinica_id = $2)
         )
       ORDER BY vc.criado_em DESC
       LIMIT 1`,
      [entId, clinId]
    );

    if (vinculoResult.rows.length === 0) {
      console.log(
        `[Comissionamento] Nenhum vínculo ativo para entidade_id=${entId}, clinica_id=${clinId} — sem comissão para lote ${lote_id}`
      );
      return { ok: false, motivo: 'sem_vinculo' };
    }

    const vinculo = vinculoResult.rows[0];

    // Recálculo por volume real vs estimado
    const numVidasEstimado =
      vinculo.num_vidas_estimado != null
        ? parseInt(vinculo.num_vidas_estimado, 10)
        : null;
    if (numVidasEstimado != null && numVidasEstimado > 0) {
      try {
        const avalResult = await query<{ num_avaliacoes: string }>(
          `SELECT COUNT(a.id) AS num_avaliacoes
           FROM avaliacoes a
           JOIN lotes_avaliacao la ON la.id = a.lote_id
           WHERE la.id = $1 AND a.status = 'concluida'`,
          [lote_id]
        );
        const numAvaliacoesReal = parseInt(
          avalResult.rows[0]?.num_avaliacoes ?? '0',
          10
        );
        if (numAvaliacoesReal > 0 && numAvaliacoesReal !== numVidasEstimado) {
          const variacao = (
            ((numAvaliacoesReal - numVidasEstimado) / numVidasEstimado) *
            100
          ).toFixed(1);
          console.log(
            `[Comissionamento] Volume real (${numAvaliacoesReal}) difere do estimado (${numVidasEstimado}): ${variacao}% — lote ${lote_id}, vínculo ${vinculo.id}`
          );
          await registrarAuditoria({
            tabela: 'vinculos_comissao',
            registro_id: vinculo.id,
            status_anterior: null,
            status_novo: null,
            triggador: 'sistema',
            motivo: `Divergência de volume: estimado=${numVidasEstimado}, real=${numAvaliacoesReal} (${variacao}%) — lote ${lote_id}`,
            dados_extras: {
              lote_id,
              num_vidas_estimado: numVidasEstimado,
              num_avaliacoes_real: numAvaliacoesReal,
              variacao_percentual: parseFloat(variacao),
            },
          });
        }
      } catch (volErr) {
        console.warn(
          `[Comissionamento] Erro ao comparar volume real vs estimado:`,
          volErr
        );
      }
    }

    // Verificar quantas comissões já existem para este lote
    const existingResult = await query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM comissoes_laudo WHERE lote_pagamento_id = $1`,
      [lote_id]
    );
    const existingCount = parseInt(existingResult.rows[0]?.total ?? '0', 10);

    if (existingCount === 0) {
      if (total_parcelas > 1) {
        // PARCELADO: primeira chamada — provisionar TODAS as N parcelas como retida
        console.log(
          `[Comissionamento] Lote ${lote_id}: provisionando ${total_parcelas} comissões antecipadamente`
        );
        for (let p = 1; p <= total_parcelas; p++) {
          const res = await criarComissaoAdmin({
            lote_pagamento_id: lote_id,
            vinculo_id: vinculo.id,
            representante_id: vinculo.representante_id,
            entidade_id: vinculo.entidade_id ?? null,
            clinica_id: vinculo.clinica_id ?? null,
            laudo_id: null,
            valor_laudo: valor_total_lote,
            valor_parcela: p === parcela_numero ? valor_parcela_liquida : null,
            parcela_numero: p,
            total_parcelas,
            admin_cpf: 'WEBHOOK',
            forcar_retida: true,
            parcela_confirmada_em: null,
          });
          if (res.erro && !res.erro.includes('já gerada')) {
            console.warn(
              `[Comissionamento] Erro ao provisionar parcela ${p}/${total_parcelas} do lote ${lote_id}: ${res.erro}`
            );
          }
        }
        console.log(
          `[Comissionamento] ✅ ${total_parcelas} comissões provisionadas para lote ${lote_id}`
        );
      } else {
        // À VISTA: comportamento original — cria 1 comissão com parcela_confirmada_em=NOW()
        const result = await criarComissaoAdmin({
          lote_pagamento_id: lote_id,
          vinculo_id: vinculo.id,
          representante_id: vinculo.representante_id,
          entidade_id: vinculo.entidade_id ?? null,
          clinica_id: vinculo.clinica_id ?? null,
          laudo_id: null,
          valor_laudo: valor_total_lote,
          valor_parcela: valor_parcela_liquida,
          parcela_numero: 1,
          total_parcelas: 1,
          admin_cpf: 'WEBHOOK',
          parcela_confirmada_em: new Date(),
        });

        if (result.erro) {
          if (result.erro.includes('já gerada')) {
            return { ok: false, motivo: 'duplicata' };
          }
          console.warn(
            `[Comissionamento] Erro ao gerar comissão à vista para lote ${lote_id}: ${result.erro}`
          );
          return { ok: false, motivo: result.erro };
        }

        console.log(
          `[Comissionamento] ✅ Comissão à vista criada: lote=${lote_id} valor_comissao=${String(result.comissao?.valor_comissao)}`
        );

        return { ok: true, comissao: result.comissao ?? undefined };
      }
    }

    // Ativar a parcela recém-paga
    const ativacao = await ativarComissaoParcelaPaga({
      lote_id,
      parcela_numero,
    });
    if (!ativacao.ok && ativacao.motivo !== 'ja_ativada') {
      console.warn(
        `[Comissionamento] Aviso ao ativar parcela ${parcela_numero}/${total_parcelas} do lote ${lote_id}: ${ativacao.motivo}`
      );
    }

    return { ok: true };
  } catch (err) {
    console.error(
      `[Comissionamento] Erro inesperado ao criar comissão automática para lote ${lote_id}:`,
      err
    );
    return { ok: false, motivo: 'erro_interno' };
  }
}

/** Atualiza o percentual de comissão individual de um representante */
export async function atualizarPercentualComissaoRep(
  representanteId: number,
  percentual: number
): Promise<{ representante: Record<string, unknown> | null; erro?: string }> {
  if (percentual < 0 || percentual > 100) {
    return {
      representante: null,
      erro: 'Percentual deve estar entre 0 e 100.',
    };
  }
  const result = await query(
    `UPDATE representantes
     SET percentual_comissao = $2, atualizado_em = NOW()
     WHERE id = $1
     RETURNING id, nome, percentual_comissao`,
    [representanteId, percentual]
  );
  if (result.rows.length === 0) {
    return { representante: null, erro: 'Representante não encontrado.' };
  }
  return { representante: result.rows[0] };
}
