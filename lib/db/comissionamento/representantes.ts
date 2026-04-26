/**
 * lib/db/comissionamento/representantes.ts
 *
 * CRUD de representantes no módulo de comissionamento.
 */

import { query } from '../query';
import type { StatusRepresentante } from '../../types/comissionamento';

/** Busca representante por email (login) */
export async function getRepresentanteByEmail(email: string) {
  const result = await query(
    `SELECT * FROM representantes WHERE email = $1 LIMIT 1`,
    [email]
  );
  return result.rows[0] ?? null;
}

/** Busca representante por id */
export async function getRepresentanteById(id: number) {
  const result = await query(
    `SELECT * FROM representantes WHERE id = $1 LIMIT 1`,
    [id]
  );
  return result.rows[0] ?? null;
}

/** Atualiza status do representante */
export async function atualizarStatusRepresentante(
  id: number,
  novoStatus: StatusRepresentante,
  extras?: { aprovado_por_cpf?: string }
) {
  const setClauses: string[] = ['status = $2', 'atualizado_em = NOW()'];
  const params: unknown[] = [id, novoStatus];
  let i = 3;

  if (novoStatus === 'apto' && extras?.aprovado_por_cpf) {
    setClauses.push(`aprovado_em = NOW()`, `aprovado_por_cpf = $${i++}`);
    params.push(extras.aprovado_por_cpf);
  }

  const result = await query(
    `UPDATE representantes SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0] ?? null;
}
