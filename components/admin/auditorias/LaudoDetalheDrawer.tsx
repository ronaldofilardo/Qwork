'use client';

import { useEffect, useState } from 'react';
import {
  X,
  Building2,
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Upload,
  ShieldCheck,
  ShieldX,
  Loader2,
  Printer,
} from 'lucide-react';
import type { AuditoriaLaudoDetalhe, TimelineEventTipo } from './types';
import { formatDate } from './helpers';

interface LaudoDetalheDrawerProps {
  laudoId: number | null;
  onClose: () => void;
}

// Logo QWork inline — círculo verde com checkmark branco + texto "Work"
function QWorkLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="48" fill="#8DC641" />
      <path
        d="M 26 55 L 44 72 L 74 30"
        stroke="white"
        strokeWidth="11"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// SVG do logo como string para uso no HTML do PDF
const LOGO_SVG_DATA =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%238DC641'/%3E%3Cpath d='M 26 55 L 44 72 L 74 30' stroke='white' stroke-width='11' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E";

const TIMELINE_ICONS: Record<TimelineEventTipo, React.ElementType> = {
  lote: FileCheck,
  avaliacao: CheckCircle2,
  laudo: Clock,
  envio: Upload,
};

const TIMELINE_COLORS: Record<TimelineEventTipo, string> = {
  lote: 'bg-blue-100 text-blue-700',
  avaliacao: 'bg-green-100 text-green-700',
  laudo: 'bg-orange-100 text-orange-700',
  envio: 'bg-purple-100 text-purple-700',
};

const TIMELINE_LINE_COLORS: Record<TimelineEventTipo, string> = {
  lote: 'bg-blue-200',
  avaliacao: 'bg-green-200',
  laudo: 'bg-orange-200',
  envio: 'bg-purple-200',
};

const STATUS_LAUDO_STYLES: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  emitido: 'bg-green-100 text-green-700',
  enviado: 'bg-blue-100 text-blue-700',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
      {children}
    </h3>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span
        className={`text-sm text-gray-900 text-right ${mono ? 'font-mono break-all' : ''}`}
      >
        {value ?? <span className="text-gray-400">—</span>}
      </span>
    </div>
  );
}

export function LaudoDetalheDrawer({
  laudoId,
  onClose,
}: LaudoDetalheDrawerProps) {
  const [dados, setDados] = useState<AuditoriaLaudoDetalhe | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (laudoId === null) {
      setDados(null);
      setErro(null);
      return;
    }

    let active = true;
    setCarregando(true);
    setErro(null);
    setDados(null);

    fetch(`/api/admin/auditorias/laudos/${laudoId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar dados do laudo');
        return res.json();
      })
      .then((json) => {
        if (active) setDados(json as AuditoriaLaudoDetalhe);
      })
      .catch(() => {
        if (active)
          setErro('Não foi possível carregar os dados. Tente novamente.');
      })
      .finally(() => {
        if (active) setCarregando(false);
      });

    return () => {
      active = false;
    };
  }, [laudoId]);

  const isOpen = laudoId !== null;

  function gerarPDF() {
    if (!dados) return;

    const d = dados;
    const geradoEm = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const tipoLabel =
      d.tomador.tipo === 'clinica'
        ? 'Clínica de Medicina Ocupacional'
        : 'Entidade Privada';

    const timelinesRows = d.timeline
      .map((ev) => {
        const evTipoLabel =
          ev.tipo === 'lote'
            ? 'Lote'
            : ev.tipo === 'avaliacao'
              ? 'Avaliação'
              : ev.tipo === 'envio'
                ? 'Envio'
                : 'Laudo';
        const cor =
          ev.tipo === 'lote'
            ? '#1d4ed8'
            : ev.tipo === 'avaliacao'
              ? '#15803d'
              : ev.tipo === 'envio'
                ? '#7e22ce'
                : '#c2410c';
        
        // Determina o ator/IP a exibir
        const actorDisplay =
          ev.actor && ev.actor.trim() 
            ? `Por: ${ev.actor}` 
            : ev.ip && ev.ip.trim()
              ? `IP: ${ev.ip}`
              : '';
        
        return `
          <tr>
            <td style="padding:8px 12px; width:100px; white-space:nowrap; color:${cor}; font-weight:600; font-size:11px; border-bottom:1px solid #f0f0f0;">${evTipoLabel}</td>
            <td style="padding:8px 12px; border-bottom:1px solid #f0f0f0;">${ev.label}</td>
            <td style="padding:8px 12px; white-space:nowrap; color:#555; font-size:12px; border-bottom:1px solid #f0f0f0;">${formatDate(ev.timestamp)}</td>
            <td style="padding:8px 12px; color:#555; font-size:12px; border-bottom:1px solid #f0f0f0;">${actorDisplay}</td>
          </tr>`;
      })
      .join('');

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Cadeia de Custódia — Laudo #${d.laudo.laudo_id}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; }

    /* Header no topo do documento */
    .print-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 14px;
      border-bottom: 2px solid #1a1a1a;
      margin-bottom: 22px;
    }
    .print-header-meta { text-align: right; font-size: 10px; color: #6b7280; line-height: 1.6; }
    .print-header-meta strong { display: block; font-size: 13px; color: #1a1a1a; }

    /* Assinatura no final do relatório */
    .signature {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #1a1a1a;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .signature-logo img { width: 52px; height: 52px; }
    .signature-brand { font-size: 26px; font-weight: 900; color: #1a1a1a; letter-spacing: -1px; line-height: 1; }
    .signature-tagline { font-size: 11px; color: #9ca3af; margin-top: 3px; letter-spacing: 0.5px; }

    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge-emitido { background: #dcfce7; color: #15803d; }
    .badge-enviado { background: #dbeafe; color: #1d4ed8; }
    .badge-rascunho { background: #f3f4f6; color: #374151; }
    section { margin-bottom: 22px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 10px; }
    table.info { width: 100%; border-collapse: collapse; }
    table.info td { padding: 5px 0; font-size: 12.5px; vertical-align: top; }
    table.info td:first-child { color: #6b7280; width: 170px; }
    table.info td:last-child { color: #1a1a1a; font-weight: 500; }
    .hash-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px 14px; }
    .hash-title { font-size: 12px; font-weight: 700; color: #15803d; margin-bottom: 4px; }
    .hash-value { font-family: 'Courier New', monospace; font-size: 11px; color: #166534; word-break: break-all; line-height: 1.5; margin-bottom: 4px; }
    .hash-note { font-size: 11px; color: #15803d; }
    table.timeline { width: 100%; border-collapse: collapse; }
    table.timeline th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; padding: 6px 12px; text-align: left; background: #f9fafb; border-bottom: 2px solid #e5e7eb; }
    table.timeline td { font-size: 12px; color: #1a1a1a; }
    table.timeline tr:last-child td { border-bottom: none; }
    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #9ca3af; }
    .footer strong { color: #374151; }
    .obs-box { background: #f9fafb; border-left: 3px solid #d1d5db; padding: 10px 14px; border-radius: 0 6px 6px 0; font-size: 12px; color: #374151; white-space: pre-wrap; line-height: 1.6; }
  </style>
</head>
<body>
  <!-- Header simples no topo do documento -->
  <div class="print-header">
    <div style="font-size:11px; color:#6b7280; line-height:1.6;">
      <strong style="display:block; font-size:14px; color:#1a1a1a;">Cadeia de Custódia — Laudo #${d.laudo.laudo_id}</strong>
      Gerado em: ${geradoEm} &nbsp;·&nbsp; Documento de auditoria oficial
    </div>
  </div>

  <!-- Conteúdo -->
  <section>
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
      <span class="badge badge-${d.laudo.status}">${d.laudo.status}</span>
      ${d.laudo.enviado_em ? `<span style="font-size:11px; color:#6b7280;">Enviado ao Backblaze em ${formatDate(d.laudo.enviado_em)}</span>` : ''}
    </div>
  </section>

  <section>
    <div class="section-title">${d.tomador.tipo === 'clinica' ? 'Clínica' : 'Entidade'} — Tomador</div>
    <table class="info">
      <tr><td>Razão Social</td><td>${d.tomador.nome ?? '—'}</td></tr>
      <tr><td>CNPJ</td><td style="font-family:monospace;">${d.tomador.cnpj ?? '—'}</td></tr>
      <tr><td>Tipo</td><td>${tipoLabel}</td></tr>
      ${d.tomador.tipo === 'clinica' && d.empresa_nome ? `<tr><td>Empresa</td><td>${d.empresa_nome}</td></tr>` : ''}
    </table>
  </section>

  <section>
    <div class="section-title">Lote de Avaliação</div>
    <table class="info">
      <tr><td>ID do Lote</td><td>#${d.lote.lote_id}</td></tr>
      <tr><td>Status</td><td>${d.lote.status?.toUpperCase() ?? '—'}</td></tr>
      <tr><td>Tipo</td><td>${d.lote.tipo ?? '—'}</td></tr>
      <tr><td>Liberado por</td><td>${d.lote.liberado_por_nome ?? '—'}</td></tr>
      <tr><td>Liberado em</td><td>${formatDate(d.lote.liberado_em)}</td></tr>
      <tr><td>Avaliações concluídas</td><td>${d.avaliacoes_resumo.concluidas}</td></tr>
    </table>
  </section>

  <section>
    <div class="section-title">Laudo Técnico</div>
    <table class="info">
      <tr><td>ID</td><td>${d.laudo.laudo_id}</td></tr>
      <tr><td>Emissor</td><td>${d.laudo.emissor_nome ?? '—'}</td></tr>
      <tr><td>Criado em</td><td>${formatDate(d.laudo.criado_em)}</td></tr>
      <tr><td>Emitido em</td><td>${formatDate(d.laudo.emitido_em)}</td></tr>
      <tr><td>Enviado em</td><td>${formatDate(d.laudo.enviado_em)}</td></tr>
      ${d.laudo.tamanho_pdf_kb !== null ? `<tr><td>Tamanho PDF</td><td>${d.laudo.tamanho_pdf_kb} KB</td></tr>` : ''}
    </table>
  </section>

  <section>
    <div class="section-title">Verificação de Integridade</div>
    ${
      d.laudo.hash_pdf
        ? `<div class="hash-box">
            <div class="hash-title">✓ Hash SHA-256 registrado</div>
            <div class="hash-value">${d.laudo.hash_pdf}</div>
            <div class="hash-note">O PDF foi armazenado com hash de integridade. Qualquer alteração posterior ao arquivo resultará em hash diferente.</div>
          </div>`
        : `<div style="background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:12px 14px;font-size:12px;color:#92400e;">⚠ Hash não registrado — este laudo não possui hash de integridade.</div>`
    }
  </section>

  ${
    d.laudo.observacoes
      ? `<section>
          <div class="section-title">Observações do Emissor</div>
          <div class="obs-box">${d.laudo.observacoes}</div>
        </section>`
      : ''
  }

  <section>
    <div class="section-title">Timeline de Custódia</div>
    ${
      d.timeline.length === 0
        ? `<p style="color:#9ca3af;font-style:italic;font-size:12px;">Nenhum evento registrado.</p>`
        : `<table class="timeline">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Evento</th>
                <th>Data/Hora</th>
                <th>Ator / IP</th>
              </tr>
            </thead>
            <tbody>${timelinesRows}</tbody>
          </table>`
    }
  </section>

  <div class="footer">
    <div>Documento de auditoria — dados imutáveis após envio ao Backblaze</div>
  </div>

  <!-- Assinatura QWork ao final do relatório -->
  <div class="signature">
    <div class="signature-logo">
      <img src="${LOGO_SVG_DATA}" alt="QWork" />
    </div>
    <div>
      <div class="signature-brand">QWork</div>
      <div class="signature-tagline">Avalie · Previna · Proteja</div>
    </div>
  </div>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Detalhe do laudo — cadeia de custódia"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <QWorkLogo size={36} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-gray-900 leading-none">
                  Q
                </span>
                <span className="text-lg font-black text-gray-900 leading-none">
                  Work
                </span>
              </div>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">
                Cadeia de Custódia{laudoId ? ` — Laudo #${laudoId}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Corpo scrollável */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Estado: carregando */}
          {carregando && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-400">
              <Loader2 size={32} className="animate-spin" />
              <span className="text-sm">Carregando dados...</span>
            </div>
          )}

          {/* Estado: erro */}
          {erro && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {erro}
            </div>
          )}

          {/* Dados carregados */}
          {dados && !carregando && (
            <>
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${
                    STATUS_LAUDO_STYLES[dados.laudo.status] ??
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {dados.laudo.status}
                </span>
                {dados.laudo.enviado_em && (
                  <span className="text-xs text-gray-500">
                    Enviado ao Backblaze em {formatDate(dados.laudo.enviado_em)}
                  </span>
                )}
              </div>

              {/* Tomador (identidade da entidade) */}
              <section>
                <SectionTitle>
                  <Building2 size={12} className="inline mr-1 -mt-0.5" />
                  {dados.tomador.tipo === 'clinica' ? 'Clínica' : 'Entidade'} —
                  Tomador
                </SectionTitle>
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <InfoRow label="Razão Social" value={dados.tomador.nome} />
                  <InfoRow label="CNPJ" value={dados.tomador.cnpj} mono />
                  <InfoRow
                    label="Tipo"
                    value={
                      dados.tomador.tipo === 'clinica'
                        ? 'Clínica de Medicina Ocupacional'
                        : 'Entidade Privada'
                    }
                  />
                  {dados.tomador.tipo === 'clinica' && dados.empresa_nome && (
                    <InfoRow label="Empresa" value={dados.empresa_nome} />
                  )}
                </div>
              </section>

              {/* Lote */}
              <section>
                <SectionTitle>Lote de Avaliação</SectionTitle>
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <InfoRow
                    label="ID do Lote"
                    value={`#${dados.lote.lote_id}`}
                  />
                  <InfoRow
                    label="Status"
                    value={dados.lote.status.toUpperCase()}
                  />
                  <InfoRow label="Tipo" value={dados.lote.tipo} />
                  <InfoRow
                    label="Liberado por"
                    value={dados.lote.liberado_por_nome || '—'}
                    mono={false}
                  />
                  <InfoRow
                    label="Liberado em"
                    value={formatDate(dados.lote.liberado_em)}
                  />
                  <InfoRow
                    label="Avaliações concluídas"
                    value={dados.avaliacoes_resumo.concluidas}
                  />
                </div>
              </section>

              {/* Laudo */}
              <section>
                <SectionTitle>Laudo Técnico</SectionTitle>
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <InfoRow label="ID" value={dados.laudo.laudo_id} />
                  <InfoRow label="Emissor" value={dados.laudo.emissor_nome} />
                  <InfoRow
                    label="Criado em"
                    value={formatDate(dados.laudo.criado_em)}
                  />
                  <InfoRow
                    label="Emitido em"
                    value={formatDate(dados.laudo.emitido_em)}
                  />
                  <InfoRow
                    label="Enviado em"
                    value={formatDate(dados.laudo.enviado_em)}
                  />
                  {dados.laudo.tamanho_pdf_kb !== null && (
                    <InfoRow
                      label="Tamanho PDF"
                      value={`${dados.laudo.tamanho_pdf_kb} KB`}
                    />
                  )}
                </div>
              </section>

              {/* Integridade */}
              <section>
                <SectionTitle>Verificação de Integridade</SectionTitle>
                <div
                  className={`rounded-lg px-4 py-3 flex items-start gap-3 ${
                    dados.laudo.hash_pdf
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}
                >
                  {dados.laudo.hash_pdf ? (
                    <ShieldCheck
                      size={18}
                      className="text-green-600 shrink-0 mt-0.5"
                    />
                  ) : (
                    <ShieldX
                      size={18}
                      className="text-yellow-600 shrink-0 mt-0.5"
                    />
                  )}
                  <div className="min-w-0">
                    {dados.laudo.hash_pdf ? (
                      <>
                        <p className="text-sm font-semibold text-green-800">
                          Hash SHA-256 registrado
                        </p>
                        <p className="text-xs font-mono text-green-700 break-all mt-1">
                          {dados.laudo.hash_pdf}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          O PDF foi armazenado com hash de integridade. Qualquer
                          alteração posterior ao arquivo resultará em hash
                          diferente.
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-yellow-800">
                          Hash não registrado
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                          Este laudo não possui hash de integridade registrado.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </section>

              {/* Observações */}
              {dados.laudo.observacoes && (
                <section>
                  <SectionTitle>Observações do Emissor</SectionTitle>
                  <div className="bg-gray-50 rounded-lg px-4 py-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {dados.laudo.observacoes}
                    </p>
                  </div>
                </section>
              )}

              {/* Timeline */}
              <section>
                <SectionTitle>Timeline de Custódia</SectionTitle>
                {dados.timeline.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    Nenhum evento registrado.
                  </p>
                ) : (
                  <ol className="relative">
                    {dados.timeline.map((ev, idx) => {
                      const Icon = TIMELINE_ICONS[ev.tipo];
                      const colorClasses = TIMELINE_COLORS[ev.tipo];
                      const lineColor = TIMELINE_LINE_COLORS[ev.tipo];
                      const isLast = idx === dados.timeline.length - 1;

                      return (
                        <li key={idx} className="flex gap-3 pb-5 relative">
                          {/* Linha vertical */}
                          {!isLast && (
                            <div
                              className={`absolute left-4 top-8 w-0.5 h-full ${lineColor}`}
                              aria-hidden="true"
                            />
                          )}

                          {/* Ícone */}
                          <div
                            className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${colorClasses}`}
                          >
                            <Icon size={14} />
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm font-medium text-gray-900">
                              {ev.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(ev.timestamp)}
                            </p>
                            {ev.actor && (
                              <p className="text-xs text-gray-500">
                                Por: {ev.actor}
                              </p>
                            )}
                            {ev.ip && (
                              <p className="text-xs text-gray-400 font-mono">
                                IP: {ev.ip}
                              </p>
                            )}
                            {ev.detalhe && (
                              <p className="text-xs text-gray-500 mt-1 italic">
                                {ev.detalhe}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </section>
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            Documento de auditoria — dados imutáveis após envio ao Backblaze
          </p>
          {dados && !carregando && (
            <button
              onClick={gerarPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors"
            >
              <Printer size={14} />
              Gerar PDF
            </button>
          )}
        </div>
      </div>
    </>
  );
}
