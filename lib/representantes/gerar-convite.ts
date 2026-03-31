/**
 * lib/representantes/gerar-convite.ts
 *
 * Gera tokens de convite para representantes criarem suas próprias senhas.
 * Padrão: token inline na tabela representantes (consistente com payment_link_token em contratos).
 * Email: fake via console.log (padrão do projeto até provedor ser escolhido).
 */

import crypto from 'crypto';
import { getBaseUrl } from '@/lib/utils/get-base-url';
import type { TransactionClient } from '@/lib/db';

/** 7 dias em ms */
const CONVITE_VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

export interface ConviteGerado {
  token: string;
  link: string;
  expira_em: Date;
}

/**
 * Gera um novo token de convite para o representante dado e salva no banco.
 *
 * - Revoga qualquer token anterior (UPDATE atômico na mesma linha)
 * - Zera contador de tentativas falhas
 * - Expira em 7 dias
 *
 * @param representanteId - ID numérico do representante
 * @param db - TransactionClient (dentro de uma transaction) ou query function
 */
export async function gerarTokenConvite(
  representanteId: number,
  db: TransactionClient,
  baseUrl?: string
): Promise<ConviteGerado> {
  const token = crypto.randomBytes(32).toString('hex'); // 64 chars hex
  const expira_em = new Date(Date.now() + CONVITE_VALIDADE_MS);

  await db.query(
    `UPDATE representantes
     SET convite_token             = $1,
         convite_expira_em         = $2,
         convite_tentativas_falhas = 0,
         convite_usado_em          = NULL
     WHERE id = $3`,
    [token, expira_em, representanteId]
  );

  const effectiveBaseUrl = baseUrl ?? getBaseUrl();
  const link = `${effectiveBaseUrl}/representante/criar-senha?token=${token}`;

  return { token, link, expira_em };
}

/**
 * Loga o "envio de e-mail" de convite no console.
 * Padrão fake do projeto — todos os e-mails vão para contato@qwork.app.br
 * até um provedor real ser integrado.
 */
export function logEmailConvite(
  nome: string,
  emailDestinatario: string,
  link: string,
  expira_em: Date
): void {
  const DEV_EMAIL = 'contato@qwork.app.br';

  // Log padrão fake-email (consistente com gerar-link-retomada/route.ts)
  console.log(
    `[EMAIL] Convite de criação de senha para ${nome} (${emailDestinatario}) → redirecionado para ${DEV_EMAIL} em DEV`
  );
  console.log(`[EMAIL] Link: ${link}`);
  console.log(`[EMAIL] Expira em: ${expira_em.toISOString()}`);
  console.log(
    `[EMAIL] ATENÇÃO: Email real destino é ${emailDestinatario} — configurar provedor para produção`
  );
}
