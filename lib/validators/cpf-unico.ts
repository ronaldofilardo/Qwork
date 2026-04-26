/**
 * lib/validators/cpf-unico.ts
 *
 * REQUISITO DE SISTEMA — CPF único no sistema (cross-perfil).
 *
 * Um CPF não pode ser registrado simultaneamente como representante,
 * lead ativo, vendedor, gestor ou rh. Esta regra é válida em TODOS os
 * ambientes: DEV, TEST, STAGING e PROD.
 *
 * Camadas de enforcement:
 *   1. Esta função (aplicação) — chamada antes de INSERT/UPDATE nas rotas.
 *      Retorna erro amigável para o usuário antes de chegar ao banco.
 *   2. Triggers de banco (migration 1229) — última linha de defesa.
 *      Garantem a regra mesmo em INSERTs diretos ou de outros contextos.
 *
 * Exclusões explícitas: funcionarios, admin, emissor, suporte, comercial.
 *
 * Tabelas verificadas:
 *   - representantes (cpf, cpf_responsavel_pj)
 *   - representantes_cadastro_leads (cpf, cpf_responsavel) — status ativo
 *   - usuarios (cpf, tipo_usuario IN 'vendedor' | 'gestor' | 'rh', ativo = true)
 */

import { query } from '@/lib/db';

export type PerfilCpf =
  | 'representante'
  | 'representante_pj'
  | 'representante_lead'
  | 'vendedor'
  | 'gestor'
  | 'rh';

export interface CpfUnicoResult {
  disponivel: boolean;
  perfil: PerfilCpf | null;
  message: string | null;
}

const DISPONIVEL: CpfUnicoResult = {
  disponivel: true,
  perfil: null,
  message: null,
};

/**
 * Verifica se o CPF já está em uso em qualquer perfil não-funcionário do sistema.
 *
 * @param cpf - CPF limpo (apenas dígitos, 11 caracteres)
 * @param options.ignorarRepresentanteId - Ignora um representante específico (útil em edições)
 * @param options.ignorarUsuarioId - Ignora um usuário específico (útil em edições)
 */
export async function checkCpfUnicoSistema(
  cpf: string,
  options?: {
    ignorarRepresentanteId?: number;
    ignorarUsuarioId?: number;
  }
): Promise<CpfUnicoResult> {
  const ignoreRepId = options?.ignorarRepresentanteId;
  const ignoreUserId = options?.ignorarUsuarioId;

  const [repPfResult, repPjResult, leadPfResult, leadPjResult, usuarioResult] =
    await Promise.all([
      // Representante PF (coluna cpf)
      query<{ id: number }>(
        `SELECT id FROM representantes
         WHERE cpf = $1 ${ignoreRepId ? 'AND id != $2' : ''}
         LIMIT 1`,
        ignoreRepId ? [cpf, ignoreRepId] : [cpf]
      ),

      // Representante PJ (cpf_responsavel_pj)
      query<{ id: number }>(
        `SELECT id FROM representantes
         WHERE cpf_responsavel_pj = $1 ${ignoreRepId ? 'AND id != $2' : ''}
         LIMIT 1`,
        ignoreRepId ? [cpf, ignoreRepId] : [cpf]
      ),

      // Lead PF em análise
      query<{ id: string }>(
        `SELECT id FROM representantes_cadastro_leads
         WHERE cpf = $1 AND status NOT IN ('rejeitado', 'convertido')
         LIMIT 1`,
        [cpf]
      ),

      // Lead PJ em análise (cpf_responsavel)
      query<{ id: string }>(
        `SELECT id FROM representantes_cadastro_leads
         WHERE cpf_responsavel = $1 AND status NOT IN ('rejeitado', 'convertido')
         LIMIT 1`,
        [cpf]
      ),

      // Vendedor, gestor ou RH na tabela usuarios (ativo)
      query<{ id: number; tipo_usuario: string }>(
        `SELECT id, tipo_usuario FROM usuarios
         WHERE cpf = $1 AND tipo_usuario IN ('vendedor', 'gestor', 'rh') AND ativo = true
         ${ignoreUserId ? 'AND id != $2' : ''}
         LIMIT 1`,
        ignoreUserId ? [cpf, ignoreUserId] : [cpf]
      ),
    ]);

  if (repPfResult.rows.length > 0) {
    return {
      disponivel: false,
      perfil: 'representante',
      message: 'Este CPF já está cadastrado como representante',
    };
  }

  if (repPjResult.rows.length > 0) {
    return {
      disponivel: false,
      perfil: 'representante_pj',
      message:
        'Este CPF já está vinculado como responsável de representante PJ',
    };
  }

  if (leadPfResult.rows.length > 0) {
    return {
      disponivel: false,
      perfil: 'representante_lead',
      message: 'Este CPF já possui um cadastro de representante em análise',
    };
  }

  if (leadPjResult.rows.length > 0) {
    return {
      disponivel: false,
      perfil: 'representante_lead',
      message:
        'Este CPF já está vinculado como responsável de cadastro em análise',
    };
  }

  if (usuarioResult.rows.length > 0) {
    const tipo = usuarioResult.rows[0].tipo_usuario as PerfilCpf;
    const perfilLabel =
      tipo === 'vendedor'
        ? 'vendedor'
        : tipo === 'gestor'
          ? 'gestor'
          : 'gestor RH';
    return {
      disponivel: false,
      perfil: tipo,
      message: `Este CPF já está cadastrado como ${perfilLabel} no sistema`,
    };
  }

  return DISPONIVEL;
}
