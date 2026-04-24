// lib/manutencao-taxa.ts
// Funções auxiliares para o sistema de Taxa de Manutenção R$250
//
// Regras de negócio:
//   - Entidade: prazo inicia na data_aceite do contrato + 90 dias
//   - Empresa de clínica: prazo inicia na data de criação (criado_em) + 90 dias
//   - Se atingido o prazo sem laudo emitido → deve cobrar R$250
//   - Uma cobrança por entidade (manutencao_ja_cobrada = false)
//   - Uma cobrança por empresa (manutencao_ja_cobrada = false)

import { query } from '@/lib/db';

export const VALOR_TAXA_MANUTENCAO = 250.0;

export interface ItemManutencaoPendente {
  tipo: 'entidade' | 'empresa_clinica';
  id: number;
  clinica_id: number | null;
  clinica_nome: string | null;
  nome: string;
  cnpj: string;
  limite_cobranca: string; // ISO date
  dias_vencidos: number;
  valor: number;
}

export interface RelatorioManutencao {
  entidades: ItemManutencaoPendente[];
  empresas: ItemManutencaoPendente[];
  total: number;
}

/**
 * Retorna entidades com vencimento <= hoje e sem laudo emitido,
 * onde manutencao_ja_cobrada = false.
 */
export async function buscarEntidadesPendentesManutencao(): Promise<
  ItemManutencaoPendente[]
> {
  const result = await query(
    `SELECT
       e.id,
       e.nome,
       e.cnpj,
       e.limite_primeira_cobranca_manutencao AS limite_cobranca,
       EXTRACT(DAY FROM NOW() - e.limite_primeira_cobranca_manutencao)::int AS dias_vencidos
     FROM entidades e
     WHERE e.limite_primeira_cobranca_manutencao IS NOT NULL
       AND e.limite_primeira_cobranca_manutencao <= NOW()
       AND e.manutencao_ja_cobrada = false
       AND e.ativa = true
       -- Não existe laudo emitido/enviado para esta entidade
       AND NOT EXISTS (
         SELECT 1
         FROM laudos l
         JOIN lotes_avaliacao la ON la.id = l.lote_id
         WHERE la.entidade_id = e.id
           AND l.status IN ('emitido', 'enviado')
       )
     ORDER BY e.limite_primeira_cobranca_manutencao ASC`,
    []
  );

  return result.rows.map((row) => ({
    tipo: 'entidade' as const,
    id: row.id as number,
    clinica_id: null,
    clinica_nome: null,
    nome: row.nome as string,
    cnpj: row.cnpj as string,
    limite_cobranca: row.limite_cobranca as string,
    dias_vencidos: Math.max(0, row.dias_vencidos as number),
    valor: VALOR_TAXA_MANUTENCAO,
  }));
}

/**
 * Retorna empresas de clínicas com vencimento <= hoje e sem laudo emitido,
 * onde manutencao_ja_cobrada = false.
 * Uma clínica pode ter múltiplas empresas, cada uma com cobranças independentes.
 */
export async function buscarEmpresasPendentesManutencao(): Promise<
  ItemManutencaoPendente[]
> {
  const result = await query(
    `SELECT
       ec.id,
       ec.nome,
       ec.cnpj,
       ec.clinica_id,
       cl.nome AS clinica_nome,
       ec.limite_primeira_cobranca_manutencao AS limite_cobranca,
       EXTRACT(DAY FROM NOW() - ec.limite_primeira_cobranca_manutencao)::int AS dias_vencidos
     FROM empresas_clientes ec
     JOIN clinicas cl ON cl.id = ec.clinica_id
     WHERE ec.limite_primeira_cobranca_manutencao IS NOT NULL
       AND ec.limite_primeira_cobranca_manutencao <= NOW()
       AND ec.manutencao_ja_cobrada = false
       AND ec.ativa = true
       -- Não existe laudo emitido/enviado para lotes desta empresa
       AND NOT EXISTS (
         SELECT 1
         FROM laudos l
         JOIN lotes_avaliacao la ON la.id = l.lote_id
         WHERE la.empresa_id = ec.id
           AND l.status IN ('emitido', 'enviado')
       )
     ORDER BY ec.limite_primeira_cobranca_manutencao ASC`,
    []
  );

  return result.rows.map((row) => ({
    tipo: 'empresa_clinica' as const,
    id: row.id as number,
    clinica_id: row.clinica_id as number,
    clinica_nome: row.clinica_nome as string,
    nome: row.nome as string,
    cnpj: row.cnpj as string,
    limite_cobranca: row.limite_cobranca as string,
    dias_vencidos: Math.max(0, row.dias_vencidos as number),
    valor: VALOR_TAXA_MANUTENCAO,
  }));
}

/**
 * Verifica se uma entidade tem laudo emitido.
 * Usado para alertas no dashboard da entidade.
 */
export async function entidadeTemLaudoEmitido(
  entidadeId: number
): Promise<boolean> {
  const result = await query(
    `SELECT 1
     FROM laudos l
     JOIN lotes_avaliacao la ON la.id = l.lote_id
     WHERE la.entidade_id = $1
       AND l.status IN ('emitido', 'enviado')
     LIMIT 1`,
    [entidadeId]
  );
  return result.rowCount > 0;
}

/**
 * Busca dados de manutenção de uma entidade específica para o dashboard.
 * Retorna null se não houver limite configurado (contrato não aceito).
 */
export async function buscarDadosManutencaoEntidade(
  entidadeId: number
): Promise<{
  limite_cobranca: string | null;
  dias_restantes: number | null;
  vencida: boolean;
  laudo_emitido: boolean;
  ja_cobrada: boolean;
} | null> {
  const result = await query(
    `SELECT
       e.limite_primeira_cobranca_manutencao,
       e.manutencao_ja_cobrada,
       EXTRACT(DAY FROM e.limite_primeira_cobranca_manutencao - NOW())::int AS dias_restantes
     FROM entidades e
     WHERE e.id = $1`,
    [entidadeId]
  );

  if (result.rowCount === 0) return null;

  const row = result.rows[0];
  if (!row.limite_primeira_cobranca_manutencao) return null;

  const laudoEmitido = await entidadeTemLaudoEmitido(entidadeId);

  return {
    limite_cobranca: row.limite_primeira_cobranca_manutencao as string,
    dias_restantes: row.dias_restantes as number,
    vencida: (row.dias_restantes as number) < 0,
    laudo_emitido: laudoEmitido,
    ja_cobrada: row.manutencao_ja_cobrada as boolean,
  };
}

/**
 * Busca dados de manutenção para cada empresa de uma clínica.
 * Retorna array de empresas com suas situações (para exibir no dashboard RH).
 */
export async function buscarDadosManutencaoClinica(clinicaId: number): Promise<
  Array<{
    empresa_id: number;
    empresa_nome: string;
    limite_cobranca: string | null;
    dias_restantes: number | null;
    vencida: boolean;
    laudo_emitido: boolean;
    ja_cobrada: boolean;
  }>
> {
  const result = await query(
    `SELECT
       ec.id AS empresa_id,
       ec.nome AS empresa_nome,
       ec.limite_primeira_cobranca_manutencao,
       ec.manutencao_ja_cobrada,
       EXTRACT(DAY FROM ec.limite_primeira_cobranca_manutencao - NOW())::int AS dias_restantes,
       EXISTS (
         SELECT 1
         FROM laudos l
         JOIN lotes_avaliacao la ON la.id = l.lote_id
         WHERE la.empresa_id = ec.id
           AND l.status IN ('emitido', 'enviado')
       ) AS laudo_emitido
     FROM empresas_clientes ec
     WHERE ec.clinica_id = $1
       AND ec.ativa = true
       AND ec.limite_primeira_cobranca_manutencao IS NOT NULL
     ORDER BY ec.limite_primeira_cobranca_manutencao ASC`,
    [clinicaId]
  );

  return result.rows.map((row) => ({
    empresa_id: row.empresa_id as number,
    empresa_nome: row.empresa_nome as string,
    limite_cobranca: row.limite_primeira_cobranca_manutencao as string | null,
    dias_restantes: row.dias_restantes as number | null,
    vencida: row.dias_restantes !== null && (row.dias_restantes as number) < 0,
    laudo_emitido: row.laudo_emitido as boolean,
    ja_cobrada: row.manutencao_ja_cobrada as boolean,
  }));
}
