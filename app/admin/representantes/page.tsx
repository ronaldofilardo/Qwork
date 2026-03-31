'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/* ------------------------------------------------------------------ */
/* Tipos: Representantes (existente)                                   */
/* ------------------------------------------------------------------ */

interface Representante {
  id: number;
  nome: string;
  email: string;
  codigo: string;
  status: string;
  tipo_pessoa: string;
  criado_em: string;
  total_leads: string;
  leads_convertidos: string;
  vinculos_ativos: string;
  valor_total_pago: string;
  comissoes_pendentes_pagamento: string | null;
  percentual_comissao?: string | null;
  dados_bancarios_status?: string | null;
  dados_bancarios_solicitado_em?: string | null;
  dados_bancarios_confirmado_em?: string | null;
}

/* ------------------------------------------------------------------ */
/* Tipos: Leads / Candidatos                                           */
/* ------------------------------------------------------------------ */

interface Lead {
  id: string;
  tipo_pessoa: 'pf' | 'pj';
  nome: string;
  email: string;
  telefone: string;
  cpf: string | null;
  cnpj: string | null;
  razao_social: string | null;
  cpf_responsavel: string | null;
  doc_cpf_filename: string | null;
  doc_cpf_key: string | null;
  doc_cpf_url: string | null;
  doc_cnpj_filename: string | null;
  doc_cnpj_key: string | null;
  doc_cnpj_url: string | null;
  doc_cpf_resp_filename: string | null;
  doc_cpf_resp_key: string | null;
  doc_cpf_resp_url: string | null;
  status: string;
  motivo_rejeicao: string | null;
  verificado_em: string | null;
  verificado_por: string | null;
  convertido_em: string | null;
  representante_id: number | null;
  ip_origem: string | null;
  criado_em: string;
  cpf_conflict: { origem: string; tipo_usuario: string } | null;
}

type TabAtiva = 'representantes' | 'candidatos';

const STATUS_OPTIONS = [
  '',
  'ativo',
  'apto_pendente',
  'apto',
  'apto_bloqueado',
  'aguardando_senha',
  'expirado',
  'suspenso',
  'desativado',
  'rejeitado',
];

const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-blue-100 text-blue-700',
  apto_pendente: 'bg-yellow-100 text-yellow-700',
  apto: 'bg-green-100 text-green-700',
  apto_bloqueado: 'bg-orange-100 text-orange-700',
  aguardando_senha: 'bg-amber-100 text-amber-700',
  expirado: 'bg-red-100 text-red-600',
  suspenso: 'bg-red-100 text-red-700',
  desativado: 'bg-gray-100 text-gray-500',
  rejeitado: 'bg-red-200 text-red-800',
};

const LEAD_STATUS_BADGE: Record<string, string> = {
  pendente_verificacao: 'bg-amber-100 text-amber-700',
  verificado: 'bg-blue-100 text-blue-700',
  rejeitado: 'bg-red-200 text-red-800',
  convertido: 'bg-green-100 text-green-700',
};

const LEAD_STATUS_OPTIONS = [
  '',
  'pendente_verificacao',
  'verificado',
  'rejeitado',
  'convertido',
];

const TRANSICOES: Record<string, string[]> = {
  ativo: ['apto_pendente', 'suspenso', 'desativado', 'rejeitado'],
  apto_pendente: ['apto', 'suspenso', 'desativado', 'rejeitado'],
  apto: ['suspenso', 'desativado'],
  apto_bloqueado: [
    'apto',
    'apto_pendente',
    'suspenso',
    'desativado',
    'rejeitado',
  ],
  suspenso: ['apto', 'ativo', 'desativado'],
  desativado: [],
  rejeitado: [],
};

const ACAO_LABEL: Record<string, string> = {
  apto_pendente: 'Solicitar Análise',
  apto: '✅ Aprovar (Apto)',
  suspenso: '⏸ Suspender',
  desativado: '🚫 Desativar',
  rejeitado: '❌ Rejeitar',
  ativo: '▶ Restaurar (Ativo)',
};

export default function RepresentantesPage() {
  const router = useRouter();

  /* ---------- Tab ativa ---------- */
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>('representantes');

  /* ---------- State: Representantes ---------- */
  const [reps, setReps] = useState<Representante[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [detalhes, setDetalhes] = useState<Representante | null>(null);
  const [motivoAcao, setMotivoAcao] = useState('');
  const [acaoPendente, setAcaoPendente] = useState<{
    id: number;
    novoStatus: string;
  } | null>(null);

  /* ---------- State: Leads / Candidatos ---------- */
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsTotal, setLeadsTotal] = useState(0);
  const [leadsPendentes, setLeadsPendentes] = useState(0);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsStatusFiltro, setLeadsStatusFiltro] = useState('');
  const [leadsBusca, setLeadsBusca] = useState('');
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadActionLoading, setLeadActionLoading] = useState<string | null>(
    null
  );
  const [leadDetalhes, setLeadDetalhes] = useState<Lead | null>(null);
  const [leadRejeicaoMotivo, setLeadRejeicaoMotivo] = useState('');
  const [leadRejeicaoModal, setLeadRejeicaoModal] = useState<Lead | null>(null);
  const [leadConverterModal, setLeadConverterModal] = useState<Lead | null>(
    null
  );
  const [conviteLinkCopiavel, setConviteLinkCopiavel] = useState<string | null>(
    null
  );
  const [reenviarConviteLoading, setReenviarConviteLoading] = useState<
    number | null
  >(null);
  const [solicitarDadosLoading, setSolicitarDadosLoading] = useState<
    number | null
  >(null);

  /* ---------- State: Docs de representantes e leads (cache + loading) ---------- */
  type RepDocItem = { url: string; filename: string } | null;
  type RepDocsCache = {
    tipo_pessoa: string;
    documentos: {
      doc_cpf?: RepDocItem;
      doc_cnpj?: RepDocItem;
      doc_cpf_resp?: RepDocItem;
    };
  } | null;
  const [repDocs, setRepDocs] = useState<Record<number, RepDocsCache>>({});
  const [repDocsLoading, setRepDocsLoading] = useState<Record<number, boolean>>(
    {}
  );
  const [leadDocs, setLeadDocs] = useState<Record<string, RepDocsCache>>({});
  const [leadDocsLoading, setLeadDocsLoading] = useState<
    Record<string, boolean>
  >({});

  /* --------------------------------------------------------------- */
  /* Abrir documento de representante (com cache)                    */
  /* --------------------------------------------------------------- */

  const openRepDoc = useCallback(
    async (repId: number, docType: 'cpf' | 'cnpj' | 'cpf_resp') => {
      const docKey =
        docType === 'cpf'
          ? 'doc_cpf'
          : docType === 'cnpj'
            ? 'doc_cnpj'
            : 'doc_cpf_resp';

      // Usar cache se disponível
      const cached = repDocs[repId];
      if (cached !== undefined) {
        const doc =
          cached?.documentos?.[docKey as keyof typeof cached.documentos];
        if (doc?.url) window.open(doc.url, '_blank', 'noopener,noreferrer');
        return;
      }

      setRepDocsLoading((prev) => ({ ...prev, [repId]: true }));
      try {
        const res = await fetch(
          `/api/admin/representantes/${repId}/documentos`
        );
        const data: RepDocsCache = await res.json();
        setRepDocs((prev) => ({ ...prev, [repId]: data }));
        const doc = data?.documentos?.[docKey as keyof typeof data.documentos];
        if (doc?.url) window.open(doc.url, '_blank', 'noopener,noreferrer');
      } catch {
        // Silencia erro de rede
      } finally {
        setRepDocsLoading((prev) => ({ ...prev, [repId]: false }));
      }
    },
    [repDocs]
  );

  /* --------------------------------------------------------------- */
  /* Abrir documento de lead/candidato (com cache)                   */
  /* --------------------------------------------------------------- */

  const openLeadDoc = useCallback(
    async (leadId: string, docType: 'cpf' | 'cnpj' | 'cpf_resp') => {
      const docKey =
        docType === 'cpf'
          ? 'doc_cpf'
          : docType === 'cnpj'
            ? 'doc_cnpj'
            : 'doc_cpf_resp';

      const cached = leadDocs[leadId];
      if (cached !== undefined) {
        const doc =
          cached?.documentos?.[docKey as keyof typeof cached.documentos];
        if (doc?.url) window.open(doc.url, '_blank', 'noopener,noreferrer');
        return;
      }

      setLeadDocsLoading((prev) => ({ ...prev, [leadId]: true }));
      try {
        const res = await fetch(`/api/admin/leads/${leadId}/documentos`);
        const data: RepDocsCache = await res.json();
        setLeadDocs((prev) => ({ ...prev, [leadId]: data }));
        const doc = data?.documentos?.[docKey as keyof typeof data.documentos];
        if (doc?.url) window.open(doc.url, '_blank', 'noopener,noreferrer');
      } catch {
        // Silencia erro de rede
      } finally {
        setLeadDocsLoading((prev) => ({ ...prev, [leadId]: false }));
      }
    },
    [leadDocs]
  );

  /* --------------------------------------------------------------- */
  /* Carregar Representantes                                         */
  /* --------------------------------------------------------------- */

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (statusFiltro) params.set('status', statusFiltro);
      if (busca.trim()) params.set('busca', busca.trim());
      const res = await fetch(`/api/admin/representantes?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setReps(data.representantes ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro, busca]);

  /* --------------------------------------------------------------- */
  /* Carregar Leads                                                  */
  /* --------------------------------------------------------------- */

  const carregarLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(leadsPage),
        limit: '30',
      });
      if (leadsStatusFiltro) params.set('status', leadsStatusFiltro);
      if (leadsBusca.trim()) params.set('busca', leadsBusca.trim());
      const res = await fetch(`/api/admin/representantes-leads?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setLeads(data.leads ?? []);
      setLeadsTotal(data.total ?? 0);
      setLeadsPendentes(data.pendentes ?? 0);
    } finally {
      setLeadsLoading(false);
    }
  }, [leadsPage, leadsStatusFiltro, leadsBusca]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (tabAtiva === 'candidatos') {
      carregarLeads();
    }
  }, [tabAtiva, carregarLeads]);

  /* --------------------------------------------------------------- */
  /* Ações: Representantes                                           */
  /* --------------------------------------------------------------- */

  const executarAcao = async () => {
    if (!acaoPendente) return;
    setActionLoading(acaoPendente.id);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes/${acaoPendente.id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            novo_status: acaoPendente.novoStatus,
            motivo: motivoAcao,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao atualizar');
        return;
      }
      setSucesso(`Status atualizado para ${acaoPendente.novoStatus}`);
      setTimeout(() => setSucesso(''), 3000);
      setAcaoPendente(null);
      setMotivoAcao('');
      setDetalhes(null);
      await carregar();
    } finally {
      setActionLoading(null);
    }
  };

  /* --------------------------------------------------------------- */
  /* Ações: Leads                                                    */
  /* --------------------------------------------------------------- */

  const aprovarLead = async (lead: Lead) => {
    setLeadActionLoading(lead.id);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes-leads/${lead.id}/aprovar`,
        {
          method: 'POST',
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao aprovar');
        return;
      }
      setSucesso(`Lead "${lead.nome}" verificado com sucesso`);
      setTimeout(() => setSucesso(''), 3000);
      setLeadDetalhes(null);
      await carregarLeads();
    } finally {
      setLeadActionLoading(null);
    }
  };

  const rejeitarLead = async () => {
    if (!leadRejeicaoModal) return;
    if (leadRejeicaoMotivo.trim().length < 5) {
      setErro('Motivo deve ter pelo menos 5 caracteres');
      return;
    }
    setLeadActionLoading(leadRejeicaoModal.id);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes-leads/${leadRejeicaoModal.id}/rejeitar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ motivo: leadRejeicaoMotivo.trim() }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao rejeitar');
        return;
      }
      setSucesso(`Lead "${leadRejeicaoModal.nome}" rejeitado`);
      setTimeout(() => setSucesso(''), 3000);
      setLeadRejeicaoModal(null);
      setLeadRejeicaoMotivo('');
      setLeadDetalhes(null);
      await carregarLeads();
    } finally {
      setLeadActionLoading(null);
    }
  };

  const converterLead = async () => {
    if (!leadConverterModal) return;
    setLeadActionLoading(leadConverterModal.id);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes-leads/${leadConverterModal.id}/converter`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao converter');
        return;
      }
      const linkMsg = data.convite_link
        ? ` | Link de convite: ${data.convite_link}`
        : '';
      setSucesso(
        `Representante criado: ${data.nome} — Código ${data.codigo}${linkMsg}`
      );
      if (data.convite_link) setConviteLinkCopiavel(data.convite_link);
      setTimeout(() => setSucesso(''), 10000);
      setLeadConverterModal(null);
      setLeadDetalhes(null);
      await carregarLeads();
      await carregar();
    } finally {
      setLeadActionLoading(null);
    }
  };

  const solicitarDadosBancarios = async (representanteId: number) => {
    setSolicitarDadosLoading(representanteId);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes/${representanteId}/solicitar-dados-bancarios`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao solicitar dados bancários');
        return;
      }
      setSucesso('Solicitação de dados bancários enviada ao representante.');
      setTimeout(() => setSucesso(''), 4000);
      setDetalhes(null);
      await carregar();
    } finally {
      setSolicitarDadosLoading(null);
    }
  };

  const reenviarConvite = async (representanteId: number) => {
    setReenviarConviteLoading(representanteId);
    setErro('');
    try {
      const res = await fetch(
        `/api/admin/representantes/${representanteId}/reenviar-convite`,
        { method: 'POST' }
      );
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao reenviar convite');
        return;
      }
      setConviteLinkCopiavel(data.convite_link ?? null);
      setSucesso(
        `Convite reenviado para ${data.email}. Link válido por 7 dias.`
      );
      setTimeout(() => setSucesso(''), 10000);
      setDetalhes(null);
      await carregar();
    } finally {
      setReenviarConviteLoading(null);
    }
  };

  const fmt = (v: string | number) =>
    `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const fmtData = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  /* ================================================================ */
  /* RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="p-6 space-y-6">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">
          Representantes Comerciais
        </h2>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTabAtiva('representantes')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tabAtiva === 'representantes'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Representantes
            <span className="ml-1.5 text-xs text-gray-400">({total})</span>
          </button>
          <button
            onClick={() => setTabAtiva('candidatos')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tabAtiva === 'candidatos'
                ? 'bg-white shadow text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Candidatos
            {leadsPendentes > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-bold text-white bg-amber-500 rounded-full">
                {leadsPendentes}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Feedback global */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          {sucesso}
        </div>
      )}

      {/* Link de convite copiável (aparece após converter lead ou reenviar convite) */}
      {conviteLinkCopiavel && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-amber-800">
              Link de convite gerado (dev — copie para testar)
            </p>
            <button
              onClick={() => setConviteLinkCopiavel(null)}
              className="text-amber-500 hover:text-amber-700 text-lg leading-none"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-amber-200 rounded px-2 py-1.5 text-amber-900 overflow-x-auto whitespace-nowrap">
              {conviteLinkCopiavel}
            </code>
            <button
              onClick={() => {
                navigator.clipboard
                  .writeText(conviteLinkCopiavel)
                  .catch(() => {});
                setSucesso('Link copiado!');
                setTimeout(() => setSucesso(''), 2000);
              }}
              className="shrink-0 text-xs bg-amber-600 text-white rounded px-3 py-1.5 hover:bg-amber-700"
            >
              Copiar
            </button>
          </div>
          <p className="text-xs text-amber-600">
            Este link será substituído por e-mail real quando o provedor for
            configurado.
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB: REPRESENTANTES (existente)                              */}
      {/* ============================================================ */}
      {tabAtiva === 'representantes' && (
        <>
          {/* Modal de confirmação de ação */}
          {acaoPendente && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">
                  Confirmar:{' '}
                  {ACAO_LABEL[acaoPendente.novoStatus] ??
                    acaoPendente.novoStatus}
                </h2>
                <p className="text-sm text-gray-600">
                  Alterar status do representante para{' '}
                  <strong>{acaoPendente.novoStatus}</strong>?
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo (opcional)
                  </label>
                  <textarea
                    value={motivoAcao}
                    onChange={(e) => setMotivoAcao(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                    rows={2}
                    placeholder="Ex.: Documentação aprovada, Violação de contrato..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAcaoPendente(null);
                      setMotivoAcao('');
                    }}
                    className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={executarAcao}
                    disabled={actionLoading !== null}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading ? 'Salvando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Drawer de detalhes */}
          {detalhes && (
            <div
              className="fixed inset-0 bg-black/40 flex items-start justify-end z-40"
              onClick={() => setDetalhes(null)}
            >
              <div
                className="bg-white h-full w-full max-w-md shadow-xl p-6 space-y-5 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">
                    {detalhes.nome}
                  </h2>
                  <button
                    onClick={() => setDetalhes(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    ['E-mail', detalhes.email],
                    ['Código', detalhes.codigo],
                    ['Tipo', detalhes.tipo_pessoa.toUpperCase()],
                    ['Status', detalhes.status],
                    [
                      'Leads',
                      `${detalhes.leads_convertidos}/${detalhes.total_leads} convertidos`,
                    ],
                    ['Vínculos Ativos', detalhes.vinculos_ativos],
                    ['Total Pago', fmt(detalhes.valor_total_pago)],
                    [
                      '% Comissão',
                      detalhes.percentual_comissao != null &&
                      detalhes.percentual_comissao !== ''
                        ? `${parseFloat(detalhes.percentual_comissao).toFixed(2)}%`
                        : '—',
                    ],
                    [
                      'Cadastrado',
                      new Date(detalhes.criado_em).toLocaleDateString('pt-BR'),
                    ],
                    [
                      'Dados Bancários',
                      detalhes.dados_bancarios_status === 'confirmado'
                        ? `✅ Confirmado em ${detalhes.dados_bancarios_confirmado_em ? new Date(detalhes.dados_bancarios_confirmado_em).toLocaleDateString('pt-BR') : '—'}`
                        : detalhes.dados_bancarios_status ===
                            'pendente_confirmacao'
                          ? `🔴 Pendente (sol. em ${detalhes.dados_bancarios_solicitado_em ? new Date(detalhes.dados_bancarios_solicitado_em).toLocaleDateString('pt-BR') : '—'})`
                          : detalhes.dados_bancarios_status === 'rejeitado'
                            ? '❌ Rejeitado'
                            : '— Não informado',
                    ],
                  ].map(([l, v]) => (
                    <div
                      key={l}
                      className="flex items-center justify-between border-b pb-2"
                    >
                      <span className="text-gray-500">{l}</span>
                      <span className="font-medium text-gray-900 text-right max-w-xs">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                    Ações disponíveis
                  </h3>
                  <div className="space-y-2">
                    {/* Botão Solicitar Dados Bancários */}
                    {detalhes.status === 'apto' &&
                      detalhes.dados_bancarios_status !== 'confirmado' && (
                        <button
                          onClick={() => solicitarDadosBancarios(detalhes.id)}
                          disabled={solicitarDadosLoading === detalhes.id}
                          className="w-full text-left px-3 py-2 border border-blue-300 bg-blue-50 rounded-lg text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-50 transition-colors"
                        >
                          {solicitarDadosLoading === detalhes.id
                            ? 'Solicitando...'
                            : '📋 Solicitar dados bancários'}
                        </button>
                      )}
                    {/* Botão Reenviar Convite para status pendentes de senha */}
                    {(detalhes.status === 'aguardando_senha' ||
                      detalhes.status === 'expirado') && (
                      <button
                        onClick={() => reenviarConvite(detalhes.id)}
                        disabled={reenviarConviteLoading === detalhes.id}
                        className="w-full text-left px-3 py-2 border border-amber-300 bg-amber-50 rounded-lg text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50 transition-colors"
                      >
                        {reenviarConviteLoading === detalhes.id
                          ? 'Enviando...'
                          : '🔗 Reenviar link de convite'}
                      </button>
                    )}
                    {(TRANSICOES[detalhes.status] ?? []).map((s) => (
                      <button
                        key={s}
                        onClick={() =>
                          setAcaoPendente({ id: detalhes.id, novoStatus: s })
                        }
                        className="w-full text-left px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 hover:border-blue-300 transition-colors"
                      >
                        {ACAO_LABEL[s] ?? s}
                      </button>
                    ))}
                    {(TRANSICOES[detalhes.status] ?? []).length === 0 && (
                      <p className="text-sm text-gray-400 italic">
                        Nenhuma ação disponível (status terminal)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Buscar nome, e-mail ou código..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={statusFiltro}
              onChange={(e) => {
                setStatusFiltro(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === '' ? 'Todos os status' : s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Tabela */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
          ) : reps.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              Nenhum representante encontrado.
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Representante</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Leads</th>
                    <th className="px-4 py-3 text-center">Vínculos</th>
                    <th className="px-4 py-3 text-center">% Comissão</th>
                    <th className="px-4 py-3 text-right">Total Pago</th>
                    <th className="px-4 py-3 text-center">Docs</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reps.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {r.nome}
                        </div>
                        <div className="text-xs text-gray-400">
                          {r.email} ·{' '}
                          <span className="font-mono">{r.codigo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {r.leads_convertidos}/{r.total_leads}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {r.vinculos_ativos} ativos
                      </td>
                      <td className="px-4 py-3 text-center">
                        {r.percentual_comissao != null &&
                        r.percentual_comissao !== '' ? (
                          <span className="font-medium text-blue-700">
                            {parseFloat(r.percentual_comissao).toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">
                        {fmt(r.valor_total_pago)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {r.tipo_pessoa === 'pf' ? (
                            <button
                              onClick={() => openRepDoc(r.id, 'cpf')}
                              disabled={repDocsLoading[r.id]}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                            >
                              {repDocsLoading[r.id] ? '...' : '📄 Doc'}
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => openRepDoc(r.id, 'cnpj')}
                                disabled={repDocsLoading[r.id]}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                              >
                                {repDocsLoading[r.id] ? '...' : '📄 CNPJ'}
                              </button>
                              <button
                                onClick={() => openRepDoc(r.id, 'cpf_resp')}
                                disabled={repDocsLoading[r.id]}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                              >
                                {repDocsLoading[r.id] ? '...' : '📄 CPF Resp.'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() =>
                              router.push(`/admin/representantes/${r.id}`)
                            }
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Ver Perfil →
                          </button>
                          {(r.status === 'aguardando_senha' ||
                            r.status === 'expirado') && (
                            <button
                              onClick={() => reenviarConvite(r.id)}
                              disabled={reenviarConviteLoading === r.id}
                              title="Reenviar link de convite de criação de senha"
                              className="text-xs text-amber-600 hover:text-amber-700 border border-amber-300 rounded px-2 py-0.5 hover:bg-amber-50 disabled:opacity-50"
                            >
                              {reenviarConviteLoading === r.id
                                ? '...'
                                : '🔗 Reenviar'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {total > 30 && (
            <div className="flex justify-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Pág. {page} de {Math.ceil(total / 30)}
              </span>
              <button
                disabled={page >= Math.ceil(total / 30)}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB: CANDIDATOS (leads do landing page)                      */}
      {/* ============================================================ */}
      {tabAtiva === 'candidatos' && (
        <>
          {/* Modal Rejeição */}
          {leadRejeicaoModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">
                  Rejeitar Candidato
                </h2>
                <p className="text-sm text-gray-600">
                  Rejeitar <strong>{leadRejeicaoModal.nome}</strong>?
                </p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da rejeição *
                  </label>
                  <textarea
                    value={leadRejeicaoMotivo}
                    onChange={(e) => setLeadRejeicaoMotivo(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
                    rows={3}
                    placeholder="Ex.: Documentação ilegível, CPF divergente..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setLeadRejeicaoModal(null);
                      setLeadRejeicaoMotivo('');
                    }}
                    className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={rejeitarLead}
                    disabled={leadActionLoading !== null}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    {leadActionLoading ? 'Rejeitando...' : 'Rejeitar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Conversão */}
          {leadConverterModal && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">
                  Converter em Representante
                </h2>
                <p className="text-sm text-gray-600">
                  Deseja converter <strong>{leadConverterModal.nome}</strong> em
                  representante oficial?
                </p>
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800 space-y-1">
                  <p>Isso irá:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>Criar registro na tabela de representantes</li>
                    <li>Gerar código automático (XXXX-XXXX)</li>
                    <li>Definir status como &quot;apto&quot;</li>
                    <li>Marcar este lead como &quot;convertido&quot;</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLeadConverterModal(null)}
                    className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={converterLead}
                    disabled={leadActionLoading !== null}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {leadActionLoading ? 'Convertendo...' : 'Converter'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Drawer detalhes do lead */}
          {leadDetalhes && (
            <div
              className="fixed inset-0 bg-black/40 flex items-start justify-end z-40"
              onClick={() => setLeadDetalhes(null)}
            >
              <div
                className="bg-white h-full w-full max-w-md shadow-xl p-6 space-y-5 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900">
                    {leadDetalhes.nome}
                  </h2>
                  <button
                    onClick={() => setLeadDetalhes(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${LEAD_STATUS_BADGE[leadDetalhes.status] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {leadDetalhes.status.replace(/_/g, ' ')}
                </span>

                <div className="space-y-3 text-sm">
                  {[
                    ['Tipo', leadDetalhes.tipo_pessoa.toUpperCase()],
                    ['E-mail', leadDetalhes.email],
                    ['Telefone', leadDetalhes.telefone],
                    leadDetalhes.cpf ? ['CPF', leadDetalhes.cpf] : null,
                    leadDetalhes.cnpj ? ['CNPJ', leadDetalhes.cnpj] : null,
                    leadDetalhes.razao_social
                      ? ['Razão Social', leadDetalhes.razao_social]
                      : null,
                    leadDetalhes.cpf_responsavel
                      ? ['CPF Responsável', leadDetalhes.cpf_responsavel]
                      : null,
                    ['Cadastrado em', fmtData(leadDetalhes.criado_em)],
                    leadDetalhes.verificado_em
                      ? ['Verificado em', fmtData(leadDetalhes.verificado_em)]
                      : null,
                    leadDetalhes.convertido_em
                      ? ['Convertido em', fmtData(leadDetalhes.convertido_em)]
                      : null,
                    leadDetalhes.motivo_rejeicao
                      ? ['Motivo rejeição', leadDetalhes.motivo_rejeicao]
                      : null,
                    leadDetalhes.ip_origem
                      ? ['IP Origem', leadDetalhes.ip_origem]
                      : null,
                  ]
                    .filter(Boolean)
                    .map((item) => {
                      const [l, v] = item as [string, string];
                      return (
                        <div
                          key={l}
                          className="flex items-start justify-between border-b pb-2"
                        >
                          <span className="text-gray-500 shrink-0">{l}</span>
                          <span className="font-medium text-gray-900 text-right ml-4 break-all">
                            {v}
                          </span>
                        </div>
                      );
                    })}
                </div>

                {/* Ações */}
                <div>
                  <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
                    Ações
                  </h3>
                  <div className="space-y-2">
                    {leadDetalhes.status === 'pendente_verificacao' && (
                      <>
                        <button
                          onClick={() => aprovarLead(leadDetalhes)}
                          disabled={leadActionLoading !== null}
                          className="w-full text-left px-3 py-2 border rounded-lg text-sm hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
                        >
                          ✅ Aprovar Documentação
                        </button>
                        <button
                          onClick={() => setLeadRejeicaoModal(leadDetalhes)}
                          disabled={leadActionLoading !== null}
                          className="w-full text-left px-3 py-2 border rounded-lg text-sm hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                        >
                          ❌ Rejeitar
                        </button>
                      </>
                    )}
                    {leadDetalhes.status === 'verificado' && (
                      <>
                        {leadDetalhes.cpf_conflict && (
                          <div className="px-3 py-2 border border-amber-200 bg-amber-50 rounded-lg text-sm text-amber-700">
                            ⚠️ CPF já cadastrado como{' '}
                            <strong>
                              {leadDetalhes.cpf_conflict.tipo_usuario}
                            </strong>{' '}
                            em {leadDetalhes.cpf_conflict.origem}
                          </div>
                        )}
                        <button
                          onClick={() => setLeadConverterModal(leadDetalhes)}
                          disabled={
                            leadActionLoading !== null ||
                            !!leadDetalhes.cpf_conflict
                          }
                          className="w-full text-left px-3 py-2 border border-green-200 bg-green-50 rounded-lg text-sm font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          🚀 Converter em Representante
                        </button>
                        <button
                          onClick={() => setLeadRejeicaoModal(leadDetalhes)}
                          disabled={leadActionLoading !== null}
                          className="w-full text-left px-3 py-2 border rounded-lg text-sm hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                        >
                          ❌ Rejeitar
                        </button>
                      </>
                    )}
                    {(leadDetalhes.status === 'rejeitado' ||
                      leadDetalhes.status === 'convertido') && (
                      <p className="text-sm text-gray-400 italic">
                        Nenhuma ação disponível (status terminal)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Buscar nome, e-mail, CPF ou CNPJ..."
              value={leadsBusca}
              onChange={(e) => {
                setLeadsBusca(e.target.value);
                setLeadsPage(1);
              }}
              className="border rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={leadsStatusFiltro}
              onChange={(e) => {
                setLeadsStatusFiltro(e.target.value);
                setLeadsPage(1);
              }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LEAD_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === '' ? 'Todos os status' : s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Tabela de leads */}
          {leadsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-amber-500 border-t-transparent" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              Nenhum candidato encontrado.
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 text-left">Candidato</th>
                    <th className="px-4 py-3 text-left">Tipo</th>
                    <th className="px-4 py-3 text-center">Docs</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Data</th>
                    <th className="px-4 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leads.map((l) => {
                    return (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {l.nome}
                          </div>
                          <div className="text-xs text-gray-400">{l.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {l.tipo_pessoa.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {l.tipo_pessoa === 'pf' ? (
                              <button
                                onClick={() => openLeadDoc(l.id, 'cpf')}
                                disabled={leadDocsLoading[l.id]}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                              >
                                {leadDocsLoading[l.id] ? '...' : '📄 Doc'}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => openLeadDoc(l.id, 'cnpj')}
                                  disabled={leadDocsLoading[l.id]}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                                >
                                  {leadDocsLoading[l.id] ? '...' : '📄 CNPJ'}
                                </button>
                                <button
                                  onClick={() => openLeadDoc(l.id, 'cpf_resp')}
                                  disabled={leadDocsLoading[l.id]}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 disabled:opacity-50"
                                >
                                  {leadDocsLoading[l.id]
                                    ? '...'
                                    : '📄 CPF Resp.'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${LEAD_STATUS_BADGE[l.status] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {l.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {fmtData(l.criado_em)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setLeadDetalhes(l)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              Detalhes
                            </button>
                            {l.status === 'pendente_verificacao' && (
                              <button
                                onClick={() => aprovarLead(l)}
                                disabled={leadActionLoading !== null}
                                className="text-green-600 hover:underline text-sm disabled:opacity-50"
                              >
                                Aprovar
                              </button>
                            )}
                            {l.status === 'verificado' && (
                              <button
                                onClick={() => setLeadConverterModal(l)}
                                disabled={leadActionLoading !== null}
                                className="text-green-700 hover:underline text-sm font-medium disabled:opacity-50"
                              >
                                Converter
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação leads */}
          {leadsTotal > 30 && (
            <div className="flex justify-center gap-2">
              <button
                disabled={leadsPage === 1}
                onClick={() => setLeadsPage((p) => p - 1)}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                ← Anterior
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                Pág. {leadsPage} de {Math.ceil(leadsTotal / 30)}
              </span>
              <button
                disabled={leadsPage >= Math.ceil(leadsTotal / 30)}
                onClick={() => setLeadsPage((p) => p + 1)}
                className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
