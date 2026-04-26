/**
 * lib/validators/cnpj-unico.ts
 *
 * Validação de CNPJ único para representantes PJ.
 *
 * Um CNPJ não pode ser registrado como representante mais de uma vez.
 * Esta regra é válida em TODOS os ambientes: DEV, TEST, STAGING e PROD.
 *
 * Camadas de enforcement:
 *   1. Esta função (aplicação) — chamada antes de INSERT nas rotas.
 *      Retorna erro amigável para o usuário antes de chegar ao banco.
 *   2. Constraint de banco (no schema) — UNIQUE(cnpj) em representantes.
 *      Última linha de defesa.
 */

import { query } from '@/lib/db';

export interface CnpjUnicoResult {
  disponivel: boolean;
  message: string | null;
}

const DISPONIVEL: CnpjUnicoResult = {
  disponivel: true,
  message: null,
};

/**
 * Verifica se o CNPJ já está cadastrado como representante no sistema.
 *
 * @param cnpj - CNPJ limpo (apenas dígitos, 14 caracteres)
 * @param options.ignorarRepresentanteId - Ignora um representante específico (útil em edições)
 * @returns CnpjUnicoResult com disponibilidade e mensagem de erro (se houver)
 */
export async function checkCnpjUnicoRepresentante(
  cnpj: string,
  options?: {
    ignorarRepresentanteId?: number;
  }
): Promise<CnpjUnicoResult> {
  const ignoreRepId = options?.ignorarRepresentanteId;

  try {
    const result = await query<{ id: number }>(
      `SELECT id FROM representantes
       WHERE cnpj = $1 ${ignoreRepId ? 'AND id != $2' : ''}
       LIMIT 1`,
      ignoreRepId ? [cnpj, ignoreRepId] : [cnpj]
    );

    if (result.rows.length > 0) {
      return {
        disponivel: false,
        message: 'CNPJ já cadastrado como representante no sistema',
      };
    }

    return DISPONIVEL;
  } catch (err) {
    console.error('[CNPJ_UNICO] Erro ao verificar CNPJ:', err);
    throw err;
  }
}
