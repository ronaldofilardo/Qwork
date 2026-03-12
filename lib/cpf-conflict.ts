/**
 * lib/cpf-conflict.ts — Validação cross-table de CPF
 *
 * Verifica se um CPF já está cadastrado em qualquer tabela do sistema
 * usando a função SQL fn_cpf_em_uso().
 *
 * Tabelas verificadas: funcionarios, usuarios, representantes,
 * entidades_senhas, clinicas_senhas.
 */

import { query, type TransactionClient } from '@/lib/db';

export interface CpfConflict {
  origem: string;
  tipo_usuario: string;
}

/**
 * Verifica se um CPF já está em uso em qualquer tabela do sistema.
 *
 * @param cpf - CPF limpo (11 dígitos)
 * @param client - Opcional: TransactionClient para uso dentro de transações
 * @returns Array de conflitos (vazio se CPF livre)
 */
export async function verificarCpfEmUso(
  cpf: string,
  client?: TransactionClient
): Promise<CpfConflict[]> {
  const sql = 'SELECT origem, tipo_usuario FROM fn_cpf_em_uso($1)';
  const params = [cpf];

  const result = client
    ? await client.query<CpfConflict>(sql, params)
    : await query<CpfConflict>(sql, params);

  return result.rows;
}

/**
 * Verifica CPF e retorna mensagem de erro padronizada para resposta 409.
 *
 * @returns null se CPF livre; string de erro se em uso
 */
export async function cpfConflictMessage(
  cpf: string,
  client?: TransactionClient
): Promise<string | null> {
  const conflicts = await verificarCpfEmUso(cpf, client);
  if (conflicts.length === 0) return null;

  const first = conflicts[0];
  return `CPF já cadastrado como ${first.tipo_usuario} em ${first.origem}`;
}
