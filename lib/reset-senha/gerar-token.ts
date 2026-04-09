/**
 * lib/reset-senha/gerar-token.ts
 *
 * Gera tokens de reset de senha para usuários dos perfis:
 *   - suporte, comercial, rh, gestor (tabela `usuarios`)
 *   - representante (tabela `representantes`)
 *
 * Fluxo:
 *   1. Admin aciona o reset → token gerado, usuário inativado
 *   2. Admin envia link (por fora do sistema)
 *   3. Usuário acessa /resetar-senha?token=XXX → cria nova senha → reativado
 *
 * Padrão consistente com lib/vendedores/gerar-convite.ts e
 * lib/representantes/gerar-convite.ts
 */

import crypto from 'crypto';
import { getBaseUrl } from '@/lib/utils/get-base-url';
import type { TransactionClient } from '@/lib/db';

/** 7 dias em ms */
const RESET_VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

/** Perfis de usuário na tabela `usuarios` que podem receber reset via admin */
export const PERFIS_RESET_USUARIOS = [
  'suporte',
  'comercial',
  'rh',
  'gestor',
  'emissor',
] as const;

export type PerfilResetUsuario = (typeof PERFIS_RESET_USUARIOS)[number];

export interface TokenResetGerado {
  token: string;
  link: string;
  expira_em: Date;
  /** Nome do usuário encontrado */
  nome: string;
  /** Perfil do usuário */
  perfil: string;
  /** Tabela de origem do usuário */
  tabela: 'usuarios' | 'representantes';
}

/**
 * Gera token de reset para usuário na tabela `usuarios`.
 * Inativa o usuário (ativo = false) até que ele crie nova senha.
 */
export async function gerarTokenResetUsuario(
  cpf: string,
  db: TransactionClient,
  baseUrl?: string
): Promise<TokenResetGerado> {
  const token = crypto.randomBytes(32).toString('hex'); // 64 chars hex
  const expira_em = new Date(Date.now() + RESET_VALIDADE_MS);
  const effectiveBaseUrl = baseUrl ?? getBaseUrl();

  await db.query(
    `UPDATE usuarios
     SET reset_token             = $1,
         reset_token_expira_em   = $2,
         reset_tentativas_falhas = 0,
         reset_usado_em          = NULL,
         ativo                   = false
     WHERE cpf = $3`,
    [token, expira_em, cpf]
  );

  // Buscar nome e perfil
  const res = await db.query<{ nome: string; tipo_usuario: string }>(
    `SELECT nome, tipo_usuario FROM usuarios WHERE cpf = $1 LIMIT 1`,
    [cpf]
  );

  const { nome, tipo_usuario } = res.rows[0];
  const link = `${effectiveBaseUrl}/resetar-senha?token=${token}`;

  return { token, link, expira_em, nome, perfil: tipo_usuario, tabela: 'usuarios' };
}

/**
 * Gera token de reset para representante na tabela `representantes`.
 * Suspende o representante (status = 'suspenso') até que crie nova senha.
 */
export async function gerarTokenResetRepresentante(
  cpf: string,
  db: TransactionClient,
  baseUrl?: string
): Promise<TokenResetGerado> {
  const token = crypto.randomBytes(32).toString('hex');
  const expira_em = new Date(Date.now() + RESET_VALIDADE_MS);
  const effectiveBaseUrl = baseUrl ?? getBaseUrl();

  await db.query(
    `UPDATE representantes
     SET reset_token             = $1,
         reset_token_expira_em   = $2,
         reset_tentativas_falhas = 0,
         reset_usado_em          = NULL,
         status                  = 'suspenso'
     WHERE cpf = $3 OR cpf_responsavel_pj = $3`,
    [token, expira_em, cpf]
  );

  const res = await db.query<{ nome: string }>(
    `SELECT nome FROM representantes
     WHERE cpf = $1 OR cpf_responsavel_pj = $1
     LIMIT 1`,
    [cpf]
  );

  const { nome } = res.rows[0];
  const link = `${effectiveBaseUrl}/resetar-senha?token=${token}`;

  return { token, link, expira_em, nome, perfil: 'representante', tabela: 'representantes' };
}

/** Log fake de envio de email — padrão do projeto (sem provedor real) */
export function logEmailResetSenha(
  nome: string,
  emailDestinatario: string | null,
  link: string,
  expira_em: Date
): void {
  const DEV_EMAIL = 'contato@qwork.app.br';
  console.log(
    `[EMAIL-RESET] Reset de senha para ${nome} (${emailDestinatario ?? 'sem email'}) → redirecionado para ${DEV_EMAIL} em DEV`
  );
  console.log(`[EMAIL-RESET] Link: ${link}`);
  console.log(`[EMAIL-RESET] Expira em: ${expira_em.toISOString()}`);
  console.log(
    `[EMAIL-RESET] ATENÇÃO: Email real destino é ${emailDestinatario} — configurar provedor para produção`
  );
}
