/**
 * Módulo de Contratos — Aceite e Gerenciamento
 *
 * Fluxo ativo: aceite do contrato de prestação de serviços pelo tomador.
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
  console.log('[obterContrato] Buscando contrato com ID:', contrato_id);

  const result = await query(
    `SELECT c.*,
            CASE 
              WHEN c.tipo_tomador = 'clinica' THEN cl.nome
              WHEN c.tipo_tomador = 'entidade' THEN e.nome
              ELSE NULL
            END AS tomador_nome,
            CASE 
              WHEN c.tipo_tomador = 'clinica' THEN cl.cnpj
              WHEN c.tipo_tomador = 'entidade' THEN e.cnpj
              ELSE NULL
            END AS tomador_cnpj,
            c.tipo_tomador AS tomador_tipo
     FROM contratos c
     LEFT JOIN clinicas cl ON c.tipo_tomador = 'clinica' AND c.tomador_id = cl.id
     LEFT JOIN entidades e ON c.tipo_tomador = 'entidade' AND c.tomador_id = e.id
     WHERE c.id = $1`,
    [contrato_id]
  );

  console.log(
    '[obterContrato] Resultado da query:',
    result.rows.length,
    'linhas'
  );

  if (!result.rows[0]) {
    console.log('[obterContrato] Contrato não encontrado!');
    return null;
  }

  const contrato = result.rows[0];
  console.log('[obterContrato] Contrato encontrado:', {
    id: contrato.id,
    tipo_tomador: contrato.tipo_tomador,
    tomador_id: contrato.tomador_id,
    temConteudo: !!contrato.conteudo,
  });

  // Se não houver conteúdo, carregar conteúdo padrão
  if (!contrato.conteudo) {
    try {
      const { obterContratopadrao } = await import('./contratos-content');
      const conteudoPadrao = await obterContratopadrao();

      // Atualizar no banco e retornar com conteúdo
      await query(
        'UPDATE contratos SET conteudo = $1, atualizado_em = NOW() WHERE id = $2',
        [conteudoPadrao, contrato_id]
      );

      contrato.conteudo = conteudoPadrao;
      console.log('[obterContrato] Conteúdo padrão carregado e persistido');
    } catch (err) {
      console.error('Erro ao carregar conteúdo padrão do contrato:', err);
      // Fallback: usar conteúdo vazio em vez de falhar
      contrato.conteudo =
        'Contrato de Prestação de Serviços - Plataforma QWork';
    }
  }

  return contrato;
}
