/**
 * Módulo de Contratos - Aceite e Gerenciamento
 */

import { query } from '../db';
import crypto from 'crypto';
import { registrarAuditoria } from '../auditoria/auditoria';

export interface AceitarContratoInput {
  contrato_id: number;
  cpf_aceite: string;
  ip_aceite?: string;
  user_agent?: string;
}

export interface ContratoAceito {
  id: number;
  contratante_id: number;
  aceito: boolean;
  data_aceite: string;
  ip_aceite?: string;
  hash_contrato: string;
}

/**
 * Gera hash SHA-256 do conteúdo do contrato para integridade
 */
function gerarHashContrato(conteudo: string): string {
  return crypto.createHash('sha256').update(conteudo).digest('hex');
}

/**
 * Aceita um contrato e persiste o hash para validação de integridade
 */
export async function aceitarContrato(
  input: AceitarContratoInput
): Promise<ContratoAceito> {
  // 1. Buscar contrato
  const contratoResult = await query<{
    id: number;
    contratante_id: number;
    conteudo: string;
    aceito: boolean;
    hash_contrato?: string;
  }>(
    `SELECT id, contratante_id, conteudo, aceito, hash_contrato 
     FROM contratos 
     WHERE id = $1`,
    [input.contrato_id]
  );

  if (contratoResult.rows.length === 0) {
    throw new Error('Contrato não encontrado');
  }

  const contrato = contratoResult.rows[0];

  if (contrato.aceito) {
    throw new Error('Contrato já foi aceito anteriormente');
  }

  // 2. Gerar hash do conteúdo do contrato
  const hashContrato = gerarHashContrato(contrato.conteudo);

  // 3. Atualizar contrato com aceite e hash
  const updateResult = await query<ContratoAceito>(
    `UPDATE contratos 
     SET 
       aceito = true,
       data_aceite = CURRENT_TIMESTAMP,
       ip_aceite = $1,
       hash_contrato = $2
     WHERE id = $3
     RETURNING id, contratante_id, aceito, data_aceite, ip_aceite, hash_contrato`,
    [input.ip_aceite || null, hashContrato, input.contrato_id]
  );

  const contratoAceito = updateResult.rows[0];

  // 4. Registrar auditoria
  await registrarAuditoria({
    entidade_tipo: 'contrato',
    entidade_id: input.contrato_id,
    acao: 'aceitar_contrato',
    usuario_cpf: input.cpf_aceite,
    ip_address: input.ip_aceite,
    user_agent: input.user_agent,
    metadados: {
      hash_contrato: hashContrato,
      contratante_id: contrato.contratante_id,
    },
  });

  // 5. Atualizar status do contratante para aguardando_pagamento
  await query(
    `UPDATE contratantes 
     SET status = 'aguardando_pagamento'
     WHERE id = $1 AND status = 'contrato_gerado'`,
    [contrato.contratante_id]
  );

  return contratoAceito;
}

/**
 * Verifica integridade de um contrato comparando hash
 */
export async function verificarIntegridadeContrato(
  contrato_id: number
): Promise<{
  integro: boolean;
  hash_esperado?: string;
  hash_atual?: string;
}> {
  const contratoResult = await query<{
    conteudo: string;
    hash_contrato?: string;
  }>(`SELECT conteudo, hash_contrato FROM contratos WHERE id = $1`, [
    contrato_id,
  ]);

  if (contratoResult.rows.length === 0) {
    throw new Error('Contrato não encontrado');
  }

  const contrato = contratoResult.rows[0];

  if (!contrato.hash_contrato) {
    return {
      integro: false,
      hash_esperado: undefined,
      hash_atual: undefined,
    };
  }

  const hashCalculado = gerarHashContrato(contrato.conteudo);

  return {
    integro: hashCalculado === contrato.hash_contrato,
    hash_esperado: hashCalculado,
    hash_atual: contrato.hash_contrato,
  };
}

/**
 * Obtém detalhes completos de um contrato
 */
export async function obterContrato(contrato_id: number) {
  const result = await query(
    `SELECT c.*, 
            ct.nome as contratante_nome,
            ct.cnpj as contratante_cnpj,
            ct.tipo as contratante_tipo,
            p.nome as plano_nome,
            p.tipo as plano_tipo,
            p.preco as plano_preco
     FROM contratos c
     LEFT JOIN contratantes ct ON c.contratante_id = ct.id
     LEFT JOIN planos p ON c.plano_id = p.id
     WHERE c.id = $1`,
    [contrato_id]
  );

  return result.rows[0] || null;
}
