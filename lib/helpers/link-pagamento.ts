/**
 * Helpers para validação de tokens e links de pagamento
 * Token de uso único: após usado (pago), pode ser gerado novamente
 */

import { query } from '@/lib/db';
import crypto from 'crypto';

export interface TokenValidacao {
  lote_id: number;
  status_pagamento: string;
  valor_por_funcionario: number;
  num_avaliacoes: number;
  valor_total: number;
  ja_usado: boolean;
  valido: boolean;
}

/**
 * Valida um token de pagamento e retorna dados do lote
 * Token é válido apenas se status = 'aguardando_pagamento'
 */
export async function validarTokenPagamento(
  token: string
): Promise<TokenValidacao | null> {
  const result = await query(`SELECT * FROM validar_token_pagamento($1)`, [
    token,
  ]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as TokenValidacao;
}

/**
 * Calcula o valor total de um lote
 */
export async function calcularValorTotalLote(
  loteId: number
): Promise<number | null> {
  const result = await query(
    `SELECT calcular_valor_total_lote($1) as valor_total`,
    [loteId]
  );

  if (result.rows.length === 0 || result.rows[0].valor_total === null) {
    return null;
  }

  return parseFloat(result.rows[0].valor_total);
}

/**
 * Gera um token único para pagamento
 */
export function gerarTokenPagamento(): string {
  return crypto.randomUUID();
}

/**
 * Gera URL completa de pagamento
 */
export function gerarUrlPagamento(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  return `${baseUrl}/pagamento/emissao/${token}`;
}

/**
 * Verifica se um lote já tem pagamento confirmado
 */
export async function verificarPagamentoConfirmado(
  loteId: number
): Promise<boolean> {
  const result = await query(
    `SELECT status_pagamento FROM lotes_avaliacao WHERE id = $1`,
    [loteId]
  );

  if (result.rows.length === 0) {
    return false;
  }

  return result.rows[0].status_pagamento === 'pago';
}

/**
 * Verifica status de pagamento de um lote
 */
export async function verificarStatusPagamento(
  loteId: number
): Promise<string | null> {
  const result = await query(
    `SELECT status_pagamento FROM lotes_avaliacao WHERE id = $1`,
    [loteId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0].status_pagamento;
}
