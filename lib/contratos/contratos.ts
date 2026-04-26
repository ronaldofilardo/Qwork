/**
 * Módulo de Contratos — Aceite e Gerenciamento
 *
 * Fluxo ativo: aceite do contrato de prestação de serviços pelo tomador.
 * Mecanismo de proposta comercial (plano fixo/personalizado) foi removido.
 */

import { query } from '../db';
import { registrarAuditoria } from '../auditoria/auditoria';

export interface AceitarContratoInput {
  contrato_id: number;
  cpf_aceite: string;
  ip_aceite?: string;
  user_agent?: string;
}

export interface ContratoAceito {
  id: number;
  entidade_id: number;
  aceito: boolean;
  data_aceite: string;
  ip_aceite?: string;
}

/**
 * Registra o aceite de um contrato de prestação de serviços.
 */
export async function aceitarContrato(
  input: AceitarContratoInput
): Promise<ContratoAceito> {
  const contratoResult = await query<{
    id: number;
    entidade_id: number;
    aceito: boolean;
  }>(`SELECT id, entidade_id, aceito FROM contratos WHERE id = $1`, [
    input.contrato_id,
  ]);

  if (contratoResult.rows.length === 0) {
    throw new Error('Contrato não encontrado');
  }

  const contrato = contratoResult.rows[0];

  if (contrato.aceito) {
    throw new Error('Contrato já foi aceito anteriormente');
  }

  const updateResult = await query<ContratoAceito>(
    `UPDATE contratos
     SET aceito = true,
         data_aceite = CURRENT_TIMESTAMP,
         ip_aceite = $1
     WHERE id = $2
     RETURNING id, entidade_id, aceito, data_aceite, ip_aceite`,
    [input.ip_aceite ?? null, input.contrato_id]
  );

  const contratoAceito = updateResult.rows[0];

  await registrarAuditoria({
    entidade_tipo: 'contrato',
    entidade_id: input.contrato_id,
    acao: 'aceitar_contrato',
    usuario_cpf: input.cpf_aceite,
    ip_address: input.ip_aceite,
    user_agent: input.user_agent,
    metadados: { entidade_id: contrato.entidade_id },
  });

  // Avançar status da entidade se ainda em etapa de contrato
  await query(
    `UPDATE entidades
     SET status = 'aguardando_pagamento'
     WHERE id = $1 AND status = 'contrato_gerado'`,
    [contrato.entidade_id]
  );

  return contratoAceito;
}

/**
 * Obtém detalhes completos de um contrato com dados do tomador.
 * Usa a view `tomadores` para compatibilidade com entidades e clínicas.
 */
export async function obterContrato(contrato_id: number) {
  const result = await query(
    `SELECT c.*,
            t.nome  AS tomador_nome,
            t.cnpj  AS tomador_cnpj,
            t.tipo  AS tomador_tipo
     FROM contratos c
     LEFT JOIN tomadores t ON c.tomador_id = t.id
     WHERE c.id = $1`,
    [contrato_id]
  );

  return result.rows[0] ?? null;
}
