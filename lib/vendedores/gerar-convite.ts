/**
 * lib/vendedores/gerar-convite.ts
 *
 * Gera tokens de convite para vendedores criarem suas próprias senhas.
 * O token é armazenado inline em `vendedores_perfil` (colunas adicionadas na migration 1108).
 */

import crypto from 'crypto';
import { getBaseUrl } from '@/lib/utils/get-base-url';
import type { TransactionClient } from '@/lib/db';

/** 7 dias em ms */
const CONVITE_VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

export interface ConviteVendedorGerado {
  token: string;
  link: string;
  expira_em: Date;
}

/**
 * Gera um novo token de convite para o vendedor dado e salva em `vendedores_perfil`.
 *
 * @param vendedorId  - ID numérico do usuário (usuarios.id)
 * @param db          - TransactionClient ou objeto com método query
 * @param baseUrl     - Opcional; usa getBaseUrl() por padrão
 */
export async function gerarTokenConviteVendedor(
  vendedorId: number,
  db: TransactionClient,
  baseUrl?: string
): Promise<ConviteVendedorGerado> {
  const token = crypto.randomBytes(32).toString('hex'); // 64 chars hex
  const expira_em = new Date(Date.now() + CONVITE_VALIDADE_MS);

  await db.query(
    `UPDATE vendedores_perfil
     SET convite_token             = $1,
         convite_expira_em         = $2,
         convite_tentativas_falhas = 0,
         convite_usado_em          = NULL
     WHERE usuario_id = $3`,
    [token, expira_em, vendedorId]
  );

  const effectiveBaseUrl = baseUrl ?? getBaseUrl();
  const link = `${effectiveBaseUrl}/vendedor/criar-senha?token=${token}`;

  return { token, link, expira_em };
}

export function logEmailConviteVendedor(
  nome: string,
  emailDestinatario: string,
  link: string,
  expira_em: Date
): void {
  const DEV_EMAIL = 'contato@qwork.app.br';
  console.log(
    `[EMAIL] Convite de criação de senha para vendedor ${nome} (${emailDestinatario}) → redirecionado para ${DEV_EMAIL} em DEV`
  );
  console.log(`[EMAIL] Link: ${link}`);
  console.log(`[EMAIL] Expira em: ${expira_em.toISOString()}`);
  console.log(
    `[EMAIL] ATENÇÃO: Email real destino é ${emailDestinatario} — configurar provedor para produção`
  );
}
