/**
 * Serviço de e-mail — Nodemailer + Microsoft 365 (Outlook)
 *
 * Configuração (.env.local / .env.staging):
 *   SMTP_USER=contato@qwork.app.br
 *   SMTP_PASSWORD=<senha M365 ou App Password>
 *   NOTIFY_EMAIL=ronaldofilardo@gmail.com   (destinatário de notificações internas)
 *
 * Todos os envios são não-bloqueantes: use `.catch()` no call-site para
 * evitar que falha de e-mail quebre a resposta da API.
 */
'use server';

import nodemailer from 'nodemailer';
import { query } from '@/lib/db';

const SMTP_FROM = process.env.SMTP_USER ?? 'contato@qwork.app.br';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL ?? 'ronaldofilardo@gmail.com';

function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: SMTP_FROM,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

// ── Layout HTML base ─────────────────────────────────────────────────────────

function wrapHtml(title: string, body: string): string {
  return `
    <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;padding:32px;background:#18181b;color:#f4f4f5;border-radius:12px;">
      <h2 style="margin:0 0 20px;color:#9ccc65;font-size:20px;">${title}</h2>
      ${body}
      <hr style="border:none;border-top:1px solid #27272a;margin:28px 0;" />
      <p style="color:#52525b;font-size:12px;text-align:center;margin:0;">
        &copy; ${new Date().getFullYear()} QWork &mdash; Notificação interna do sistema
      </p>
    </div>
  `;
}

function row(label: string, value: string | number): string {
  return `<tr>
    <td style="color:#a1a1aa;padding:4px 0;width:160px;vertical-align:top;">${label}</td>
    <td style="color:#f4f4f5;padding:4px 0;font-weight:600;">${value}</td>
  </tr>`;
}

function table(rows: string): string {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.8;">${rows}</table>`;
}

// ── Notificação 1: Solicitação de emissão ────────────────────────────────────

export interface SolicitacaoEmissaoPayload {
  loteId: number;
  solicitanteCpf: string;
  perfil: string;
  tomadorNome?: string;
  empresaNome?: string;
}

export async function notificarSolicitacaoEmissao(
  data: SolicitacaoEmissaoPayload
): Promise<void> {
  const transporter = createTransporter();

  const descricao = data.empresaNome
    ? `${data.tomadorNome ?? ''} / ${data.empresaNome}`
    : (data.tomadorNome ?? '—');

  const html = wrapHtml(
    '📋 Solicitação de emissão de laudo',
    table(
      row('Lote #', data.loteId) +
        row('Solicitante (CPF)', data.solicitanteCpf) +
        row('Perfil', data.perfil) +
        row('Tomador / Empresa', descricao)
    )
  );

  await transporter.sendMail({
    from: `QWork <${SMTP_FROM}>`,
    to: NOTIFY_EMAIL,
    subject: `[QWork] Solicitação de emissão — Lote #${data.loteId}`,
    html,
  });

  console.log(`[EMAIL] notificarSolicitacaoEmissao → lote #${data.loteId}`);
}

// ── Notificação 2: Lote liberado para emissão ─────────────────────────────────

export interface LoteLiberadoPayload {
  loteId: number;
  numeroOrdem: number;
  tomadorNome: string;
  tomadorTipo: 'clinica' | 'entidade';
  empresaNome?: string;
  avaliacoesCriadas?: number;
}

export async function notificarLoteLiberado(
  data: LoteLiberadoPayload
): Promise<void> {
  const transporter = createTransporter();

  const descricaoTomador =
    data.tomadorTipo === 'clinica'
      ? `Clínica: ${data.tomadorNome}${data.empresaNome ? ` / Empresa: ${data.empresaNome}` : ''}`
      : `Entidade: ${data.tomadorNome}`;

  const html = wrapHtml(
    '🟢 Lote liberado para emissão',
    table(
      row('Lote #', data.loteId) +
        row('Nº de Ordem', data.numeroOrdem) +
        row('Tomador', descricaoTomador) +
        (data.avaliacoesCriadas !== undefined
          ? row('Avaliações criadas', data.avaliacoesCriadas)
          : '')
    )
  );

  await transporter.sendMail({
    from: `QWork <${SMTP_FROM}>`,
    to: NOTIFY_EMAIL,
    subject: `[QWork] Lote liberado — #${data.loteId} (${data.tomadorNome})`,
    html,
  });

  console.log(`[EMAIL] notificarLoteLiberado → lote #${data.loteId}`);
}

/**
 * Helper: dispara Email #2 com base apenas no loteId.
 * Consulta o banco para obter tomador e numero_ordem.
 * Usar em qualquer rota que sete status_pagamento = 'pago'.
 *
 * @example
 * dispararEmailLotePago(lote.id).catch(e => console.error('[EMAIL]', e));
 */
export async function dispararEmailLotePago(loteId: number): Promise<void> {
  const result = await query(
    `SELECT la.numero_ordem,
            COALESCE(e.nome, c.nome) AS tomador_nome,
            CASE WHEN la.entidade_id IS NOT NULL THEN 'entidade' ELSE 'clinica' END AS tomador_tipo
     FROM lotes_avaliacao la
     LEFT JOIN entidades e ON e.id = la.entidade_id
     LEFT JOIN clinicas c ON c.id = la.clinica_id
     WHERE la.id = $1`,
    [loteId]
  );
  if (result.rows.length === 0) return;
  const { numero_ordem, tomador_nome, tomador_tipo } = result.rows[0];
  await notificarLoteLiberado({
    loteId,
    numeroOrdem: numero_ordem ?? loteId,
    tomadorNome: String(tomador_nome ?? '—'),
    tomadorTipo: tomador_tipo as 'clinica' | 'entidade',
  });
}

// ── Notificação 3: Aceite de contrato ─────────────────────────────────────────

export interface AceiteContratoPayload {
  tomadorId: number;
  tomadorNome: string;
  cnpj?: string;
  tipo: 'clinica' | 'entidade';
}

export async function notificarAceiteContrato(
  data: AceiteContratoPayload
): Promise<void> {
  const transporter = createTransporter();

  const html = wrapHtml(
    '✅ Aceite de contrato de prestação de serviço',
    table(
      row('Tomador ID', data.tomadorId) +
        row('Nome / Razão Social', data.tomadorNome) +
        row('CNPJ', data.cnpj ?? '—') +
        row('Tipo', data.tipo === 'clinica' ? 'Clínica' : 'Entidade')
    )
  );

  await transporter.sendMail({
    from: `QWork <${SMTP_FROM}>`,
    to: NOTIFY_EMAIL,
    subject: `[QWork] Contrato aceito — ${data.tomadorNome}`,
    html,
  });

  console.log(
    `[EMAIL] notificarAceiteContrato → tomador #${data.tomadorId} (${data.tomadorNome})`
  );
}
