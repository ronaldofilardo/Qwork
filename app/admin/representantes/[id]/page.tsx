'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Tipos ─────────────────────────────────────────────── */
interface RepProfile {
  id: number;
  nome: string;
  email: string;
  codigo: string;
  status: string;
  tipo_pessoa: string;
  cpf: string | null;
  cnpj: string | null;
  telefone: string | null;
  criado_em: string;
  aprovado_em: string | null;
  pix_chave: string | null;
  pix_tipo: string | null;
  banco_codigo: string | null;
  agencia: string | null;
  conta: string | null;
  tipo_conta: string | null;
  titular_conta: string | null;
  dados_bancarios_status: string | null;
  dados_bancarios_solicitado_em: string | null;
  dados_bancarios_confirmado_em: string | null;
  percentual_comissao: string | null;
  total_leads: string;
  leads_convertidos: string;
  leads_pendentes: string;
  leads_expirados: string;
  leads_a_vencer_30d: string;
  total_vinculos: string;
  vinculos_ativos: string;
  vinculos_suspensos: string;
  vinculos_inativos: string;
  vinculos_a_vencer_30d: string;
  total_comissoes: string;
  valor_total_pago: string;
  valor_pendente: string;
}

interface Lead {
  id: number;
  cnpj: string;
  razao_social: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  status: string;
  criado_em: string;
  data_expiracao: string;
  data_conversao: string | null;
  entidade_nome: string | null;
  tipo_conversao: string | null;
  vence_em_breve: boolean;
  valor_negociado?: number | null;
}

interface Vinculo {
  id: number;
  entidade_id: number;
  entidade_nome: string | null;
  entidade_cnpj: string | null;
  lead_razao_social: string | null;
  lead_valor_negociado: number | null;
  status: string;
  data_inicio: string;
  data_expiracao: string;
  ultimo_laudo_em: string | null;
  criado_em: string;
  encerrado_em: string | null;
  encerrado_motivo: string | null;
  vence_em_breve: boolean;
  sem_laudo_recente: boolean;
}

/* ─── Constantes ─────────────────────────────────────────── */
const STATUS_BADGE: Record<string, string> = {
  ativo: 'bg-blue-100 text-blue-700',
  apto_pendente: 'bg-yellow-100 text-yellow-700',
  apto: 'bg-green-100 text-green-700',
  apto_bloqueado: 'bg-orange-100 text-orange-700',
  suspenso: 'bg-red-100 text-red-700',
  desativado: 'bg-gray-100 text-gray-500',
  rejeitado: 'bg-red-200 text-red-800',
};

const STATUS_BADGE_LEAD: Record<string, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  convertido: 'bg-green-100 text-green-700',
  expirado: 'bg-gray-100 text-gray-500',
};

const STATUS_BADGE_VINCULO: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-500',
  suspenso: 'bg-orange-100 text-orange-700',
  encerrado: 'bg-red-100 text-red-700',
};

const TIPO_CONVERSAO_LABEL: Record<string, string> = {
  link_representante: 'Link',
  codigo_representante: 'Código',
  verificacao_cnpj: 'CNPJ automático',
};

const TRANSICOES: Record<string, string[]> = {
  ativo: ['apto_pendente', 'apto', 'suspenso', 'desativado', 'rejeitado'],
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

/* ─── Utilitários ─────────────────────────────────────────── */
function formatCNPJ(cnpj: string | null) {
  if (!cnpj || cnpj.length !== 14) return cnpj ?? '—';
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

function formatCPF(cpf: string | null) {
  if (!cpf || cpf.length !== 11) return cpf ?? '—';
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

function formatDate(d: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(
    'pt-BR',
    opts ?? { day: '2-digit', month: '2-digit', year: 'numeric' }
  );
}

function fmtMoney(v: string | number) {
  return `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function n(v: string | number) {
  return parseInt(String(v), 10) || 0;
}

/* ─── Componentes internos ────────────────────────────────── */
function KPICard({
  label,
  value,
  sub,
  highlight,
  alert,
}: {
  label: string;
  value: string | number;
  sub?: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 space-y-1 ${
        alert
          ? 'border-orange-200 bg-orange-50'
          : highlight
            ? 'border-green-200 bg-green-50'
            : 'border-gray-200 bg-white'
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wide ${alert ? 'text-orange-600' : 'text-gray-500'}`}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-bold ${alert ? 'text-orange-700' : highlight ? 'text-green-700' : 'text-gray-900'}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

/* ─── Página principal ────────────────────────────────────── */
export default function RepresentantePerfilPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Dados principais
  const [rep, setRep] = useState<RepProfile | null>(null);
  const [loadingRep, setLoadingRep] = useState(true);
  const [erroRep, setErroRep] = useState('');

  // Leads
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [pageLeads, setPageLeads] = useState(1);
  const [statusLeadFiltro, setStatusLeadFiltro] = useState('');
  const [buscaLead, setBuscaLead] = useState('');
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [contagensLeads, setContagensLeads] = useState({
    pendente: 0,
    convertido: 0,
    expirado: 0,
  });

  // Vínculos
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);
  const [totalVinculos, setTotalVinculos] = useState(0);
  const [pageVinculos, setPageVinculos] = useState(1);
  const [statusVinculoFiltro, setStatusVinculoFiltro] = useState('');
  const [loadingVinculos, setLoadingVinculos] = useState(false);
  const [contagensVinculos, setContagensVinculos] = useState({
    ativo: 0,
    inativo: 0,
    suspenso: 0,
    encerrado: 0,
  });

  // UI
  const [aba, setAba] = useState<'leads' | 'vinculos'>('leads');
  const [acaoPendente, setAcaoPendente] = useState<{
    novoStatus: string;
  } | null>(null);
  const [motivoAcao, setMotivoAcao] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const [erro, setErro] = useState('');

  // Comissão %
  const [editandoComissao, setEditandoComissao] = useState(false);
  const [percentualInput, setPercentualInput] = useState('');
  const [salvandoPercentual, setSalvandoPercentual] = useState(false);

  /* Busca perfil */
  const carregarRep = useCallback(async () => {
    setLoadingRep(true);
    setErroRep('');
    try {
      const res = await fetch(`/api/admin/representantes/${id}`);
      if (!res.ok) {
        setErroRep('Representante não encontrado.');
        return;
      }
      const data = await res.json();
      setRep(data.representante);
    } catch {
      setErroRep('Erro ao carregar dados.');
    } finally {
      setLoadingRep(false);
    }
  }, [id]);

  /* Busca leads */
  const carregarLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const p = new URLSearchParams({ page: String(pageLeads), limit: '25' });
      if (statusLeadFiltro) p.set('status', statusLeadFiltro);
      if (buscaLead.trim()) p.set('q', buscaLead.trim());
      const res = await fetch(`/api/admin/representantes/${id}/leads?${p}`);
      if (!res.ok) return;
      const data = await res.json();
      setLeads(data.leads ?? []);
      setTotalLeads(data.total ?? 0);
      setContagensLeads(
        data.contagens ?? { pendente: 0, convertido: 0, expirado: 0 }
      );
    } finally {
      setLoadingLeads(false);
    }
  }, [id, pageLeads, statusLeadFiltro, buscaLead]);

  /* Busca vínculos */
  const carregarVinculos = useCallback(async () => {
    setLoadingVinculos(true);
    try {
      const p = new URLSearchParams({ page: String(pageVinculos) });
      if (statusVinculoFiltro) p.set('status', statusVinculoFiltro);
      const res = await fetch(`/api/admin/representantes/${id}/vinculos?${p}`);
      if (!res.ok) return;
      const data = await res.json();
      setVinculos(data.vinculos ?? []);
      setTotalVinculos(data.total ?? 0);
      setContagensVinculos(
        data.contagens ?? { ativo: 0, inativo: 0, suspenso: 0, encerrado: 0 }
      );
    } finally {
      setLoadingVinculos(false);
    }
  }, [id, pageVinculos, statusVinculoFiltro]);

  useEffect(() => {
    carregarRep();
  }, [carregarRep]);
  useEffect(() => {
    carregarLeads();
  }, [carregarLeads]);
  useEffect(() => {
    carregarVinculos();
  }, [carregarVinculos]);

  /* Executa ação de status */
  const executarAcao = async () => {
    if (!acaoPendente || !rep) return;
    setActionLoading(true);
    setErro('');
    try {
      const res = await fetch(`/api/admin/representantes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novo_status: acaoPendente.novoStatus,
          motivo: motivoAcao,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao atualizar status');
        return;
      }
      setSucesso(
        `Status alterado para "${acaoPendente.novoStatus}" com sucesso.`
      );
      setTimeout(() => setSucesso(''), 4000);
      setAcaoPendente(null);
      setMotivoAcao('');
      await carregarRep();
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Loading/Erro ── */
  if (loadingRep) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (erroRep || !rep) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p className="mb-4">{erroRep || 'Representante não encontrado.'}</p>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  const taxa =
    n(rep.total_leads) > 0
      ? Math.round((n(rep.leads_convertidos) / n(rep.total_leads)) * 100)
      : 0;

  /* ── RENDER ── */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modal de confirmação */}
      {acaoPendente && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">
              Confirmar:{' '}
              {ACAO_LABEL[acaoPendente.novoStatus] ?? acaoPendente.novoStatus}
            </h2>
            <p className="text-sm text-gray-600">
              Alterar status de <strong>{rep.nome}</strong> para{' '}
              <strong>{acaoPendente.novoStatus.replace(/_/g, ' ')}</strong>?
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
            {erro && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {erro}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAcaoPendente(null);
                  setMotivoAcao('');
                  setErro('');
                }}
                className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={executarAcao}
                disabled={actionLoading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Barra superior */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/representantes"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            ← Representantes
          </Link>
          {sucesso && (
            <span className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
              {sucesso}
            </span>
          )}
        </div>

        {/* Header do representante */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900">{rep.nome}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    STATUS_BADGE[rep.status] ?? 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {rep.status.replace(/_/g, ' ')}
                </span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">
                  {rep.tipo_pessoa === 'pf'
                    ? 'Pessoa Física'
                    : 'Pessoa Jurídica'}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                <span>{rep.email}</span>
                {rep.telefone && <span>{rep.telefone}</span>}
                <span className="font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                  Código: {rep.codigo}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
                <span>
                  {rep.tipo_pessoa === 'pf' ? 'CPF' : 'CNPJ'}:{' '}
                  {rep.tipo_pessoa === 'pf'
                    ? formatCPF(rep.cpf)
                    : formatCNPJ(rep.cnpj)}
                </span>
                <span>Cadastrado em {formatDate(rep.criado_em)}</span>
                {rep.aprovado_em && (
                  <span>Aprovado em {formatDate(rep.aprovado_em)}</span>
                )}
              </div>

              {/* Dados bancários */}
              {rep.banco_codigo ||
              rep.pix_chave ||
              rep.dados_bancarios_status ? (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Dados Bancários
                    </span>
                    {rep.dados_bancarios_status && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          rep.dados_bancarios_status === 'confirmado'
                            ? 'bg-green-100 text-green-700'
                            : rep.dados_bancarios_status === 'solicitado'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {rep.dados_bancarios_status === 'confirmado'
                          ? '✅ Confirmado'
                          : rep.dados_bancarios_status === 'solicitado'
                            ? '⏳ Solicitado'
                            : rep.dados_bancarios_status}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                    {rep.banco_codigo && (
                      <span>
                        Banco:{' '}
                        <span className="text-gray-700 font-medium">
                          {rep.banco_codigo}
                        </span>
                      </span>
                    )}
                    {rep.agencia && (
                      <span>
                        Agência:{' '}
                        <span className="text-gray-700 font-medium">
                          {rep.agencia}
                        </span>
                      </span>
                    )}
                    {rep.conta && (
                      <span>
                        Conta:{' '}
                        <span className="text-gray-700 font-medium">
                          {rep.conta}
                          {rep.tipo_conta ? ` (${rep.tipo_conta})` : ''}
                        </span>
                      </span>
                    )}
                    {rep.titular_conta && (
                      <span>
                        Titular:{' '}
                        <span className="text-gray-700 font-medium">
                          {rep.titular_conta}
                        </span>
                      </span>
                    )}
                    {rep.pix_chave && (
                      <span>
                        PIX:{' '}
                        <span className="text-gray-700 font-medium">
                          {rep.pix_chave}
                          {rep.pix_tipo ? ` (${rep.pix_tipo})` : ''}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400 italic">
                    Dados bancários não informados
                  </span>
                </div>
              )}
            </div>

            {/* Ações de status */}
            <div className="flex flex-col gap-2">
              {(TRANSICOES[rep.status] ?? []).map((s) => (
                <button
                  key={s}
                  onClick={() => setAcaoPendente({ novoStatus: s })}
                  className="text-sm px-4 py-1.5 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors text-left"
                >
                  {ACAO_LABEL[s] ?? s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard
            label="Total de Leads"
            value={n(rep.total_leads)}
            sub={`${n(rep.leads_pendentes)} pendentes · ${n(rep.leads_expirados)} expirados`}
          />
          <KPICard
            label="Leads Convertidos"
            value={n(rep.leads_convertidos)}
            highlight={n(rep.leads_convertidos) > 0}
          />
          <KPICard
            label="Taxa de Conversão"
            value={`${taxa}%`}
            highlight={taxa >= 30}
          />
          <KPICard
            label="Vínculos Ativos"
            value={n(rep.vinculos_ativos)}
            sub={`${n(rep.total_vinculos)} total`}
          />
        </div>

        {/* Alertas */}
        {(n(rep.leads_a_vencer_30d) > 0 ||
          n(rep.vinculos_a_vencer_30d) > 0) && (
          <div className="flex flex-wrap gap-3">
            {n(rep.leads_a_vencer_30d) > 0 && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-2.5 text-sm">
                ⚠️{' '}
                <strong>
                  {n(rep.leads_a_vencer_30d)} lead
                  {n(rep.leads_a_vencer_30d) > 1 ? 's' : ''}
                </strong>{' '}
                expira{n(rep.leads_a_vencer_30d) === 1 ? '' : 'm'} nos próximos
                30 dias
              </div>
            )}
            {n(rep.vinculos_a_vencer_30d) > 0 && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-2.5 text-sm">
                ⚠️{' '}
                <strong>
                  {n(rep.vinculos_a_vencer_30d)} vínculo
                  {n(rep.vinculos_a_vencer_30d) > 1 ? 's' : ''}
                </strong>{' '}
                vence{n(rep.vinculos_a_vencer_30d) === 1 ? '' : 'm'} nos
                próximos 30 dias
              </div>
            )}
          </div>
        )}

        {/* Dados financeiros resumidos */}
        <div className="grid grid-cols-3 gap-4">
          {/* Card Comissão % */}
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium uppercase text-gray-500 tracking-wide">
                Comissão (%)
              </p>
              {!editandoComissao && (
                <button
                  onClick={() => {
                    setEditandoComissao(true);
                    setPercentualInput(rep.percentual_comissao ?? '');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {rep.percentual_comissao ? 'Editar' : 'Definir'}
                </button>
              )}
            </div>
            {editandoComissao ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={percentualInput}
                    onChange={(e) => setPercentualInput(e.target.value)}
                    className="w-24 px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    autoFocus
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
                <div className="flex gap-1.5">
                  <button
                    disabled={salvandoPercentual}
                    onClick={async () => {
                      const val = parseFloat(percentualInput);
                      if (isNaN(val) || val < 0 || val > 100) {
                        setErro('Percentual inválido (0-100)');
                        return;
                      }
                      setSalvandoPercentual(true);
                      setErro('');
                      try {
                        const res = await fetch(
                          `/api/admin/representantes/${id}/comissao`,
                          {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ percentual: val }),
                          }
                        );
                        const data = await res.json();
                        if (!res.ok) {
                          setErro(data.error ?? 'Erro ao salvar');
                          return;
                        }
                        setSucesso('Percentual atualizado!');
                        setTimeout(() => setSucesso(''), 3000);
                        setEditandoComissao(false);
                        await carregarRep();
                      } catch {
                        setErro('Erro ao salvar percentual');
                      } finally {
                        setSalvandoPercentual(false);
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {salvandoPercentual ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => {
                      setEditandoComissao(false);
                      setPercentualInput('');
                    }}
                    className="px-3 py-1 border text-xs rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                {rep.percentual_comissao ? (
                  <p className="text-xl font-bold text-blue-700 mt-1">
                    {parseFloat(rep.percentual_comissao).toFixed(2)}%
                  </p>
                ) : (
                  <p className="text-sm text-orange-600 font-medium mt-1">
                    ⚠️ Não definido
                  </p>
                )}
                <span className="text-3xl">📊</span>
              </div>
            )}
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-gray-500 tracking-wide">
                Total Pago em Comissões
              </p>
              <p className="text-xl font-bold text-green-700 mt-1">
                {fmtMoney(rep.valor_total_pago)}
              </p>
            </div>
            <span className="text-3xl">💰</span>
          </div>
          <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-gray-500 tracking-wide">
                Comissões Pendentes
              </p>
              <p className="text-xl font-bold text-yellow-700 mt-1">
                {fmtMoney(rep.valor_pendente)}
              </p>
            </div>
            <span className="text-3xl">⏳</span>
          </div>
        </div>

        {/* Abas */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setAba('leads')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                aba === 'leads'
                  ? 'border-b-2 border-blue-600 text-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Leads / Indicações
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
                {n(rep.total_leads)}
              </span>
            </button>
            <button
              onClick={() => setAba('vinculos')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                aba === 'vinculos'
                  ? 'border-b-2 border-blue-600 text-blue-600 -mb-px'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Vínculos de Comissão
              <span className="ml-2 bg-gray-100 text-gray-600 text-xs rounded-full px-2 py-0.5">
                {n(rep.total_vinculos)}
              </span>
            </button>
          </div>

          {/* ── ABA LEADS ── */}
          {aba === 'leads' && (
            <div className="p-4 space-y-4">
              {/* Filtros de leads */}
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Buscar CNPJ, razão social ou contato..."
                  value={buscaLead}
                  onChange={(e) => {
                    setBuscaLead(e.target.value);
                    setPageLeads(1);
                  }}
                  className="border rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-1">
                  {['', 'pendente', 'convertido', 'expirado'].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusLeadFiltro(s);
                        setPageLeads(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        statusLeadFiltro === s
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {s === '' ? `Todos (${n(rep.total_leads)})` : null}
                      {s === 'pendente'
                        ? `Pendentes (${contagensLeads.pendente})`
                        : null}
                      {s === 'convertido'
                        ? `Convertidos (${contagensLeads.convertido})`
                        : null}
                      {s === 'expirado'
                        ? `Expirados (${contagensLeads.expirado})`
                        : null}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tabela de leads */}
              {loadingLeads ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent" />
                </div>
              ) : leads.length === 0 ? (
                <p className="text-center py-10 text-gray-400 text-sm">
                  Nenhuma indicação encontrada.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          Empresa indicada
                        </th>
                        <th className="px-4 py-3 text-left">Contato</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-4 py-3 text-center">
                          Valor Negociado
                        </th>
                        <th className="px-4 py-3 text-center">Cadastrado</th>
                        <th className="px-4 py-3 text-center">Expira em</th>
                        <th className="px-4 py-3 text-center">Conversão</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className={`${
                            lead.vence_em_breve
                              ? 'bg-orange-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">
                              {lead.razao_social ?? (
                                <span className="text-gray-400 italic">
                                  Não informado
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 font-mono">
                              {formatCNPJ(lead.cnpj)}
                            </div>
                            {lead.entidade_nome && (
                              <div className="text-xs text-green-600 mt-0.5">
                                → {lead.entidade_nome}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-700">
                              {lead.contato_nome ?? '—'}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                STATUS_BADGE_LEAD[lead.status] ??
                                'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {lead.status}
                            </span>
                            {lead.vence_em_breve && (
                              <div className="text-xs text-orange-600 mt-1 font-medium">
                                ⚠ Vence em breve
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {lead.valor_negociado != null &&
                            lead.valor_negociado > 0 ? (
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                R${' '}
                                {Number(lead.valor_negociado).toLocaleString(
                                  'pt-BR',
                                  { minimumFractionDigits: 2 }
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-gray-500 text-xs">
                            {formatDate(lead.criado_em)}
                          </td>
                          <td className="px-4 py-3 text-center text-xs">
                            {lead.status === 'convertido' ? (
                              <span className="text-green-600">
                                {formatDate(lead.data_conversao)}
                              </span>
                            ) : (
                              <span
                                className={
                                  lead.vence_em_breve
                                    ? 'text-orange-600 font-medium'
                                    : 'text-gray-500'
                                }
                              >
                                {formatDate(lead.data_expiracao)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {lead.tipo_conversao ? (
                              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                                {TIPO_CONVERSAO_LABEL[lead.tipo_conversao] ??
                                  lead.tipo_conversao}
                              </span>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Paginação leads */}
              {totalLeads > 25 && (
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    disabled={pageLeads === 1}
                    onClick={() => setPageLeads((p) => p - 1)}
                    className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    ← Anterior
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-600">
                    Pág. {pageLeads} de {Math.ceil(totalLeads / 25)}
                  </span>
                  <button
                    disabled={pageLeads >= Math.ceil(totalLeads / 25)}
                    onClick={() => setPageLeads((p) => p + 1)}
                    className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── ABA VÍNCULOS ── */}
          {aba === 'vinculos' && (
            <div className="p-4 space-y-4">
              {/* Filtros de vínculos */}
              <div className="flex gap-1 flex-wrap">
                {['', 'ativo', 'inativo', 'suspenso', 'encerrado'].map((s) => {
                  const label: Record<string, string> = {
                    '': `Todos (${n(rep.total_vinculos)})`,
                    ativo: `Ativos (${contagensVinculos.ativo})`,
                    inativo: `Inativos (${contagensVinculos.inativo})`,
                    suspenso: `Suspensos (${contagensVinculos.suspenso})`,
                    encerrado: `Encerrados (${contagensVinculos.encerrado})`,
                  };
                  return (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusVinculoFiltro(s);
                        setPageVinculos(1);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        statusVinculoFiltro === s
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {label[s]}
                    </button>
                  );
                })}
              </div>

              {/* Lista de vínculos */}
              {loadingVinculos ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent" />
                </div>
              ) : vinculos.length === 0 ? (
                <p className="text-center py-10 text-gray-400 text-sm">
                  Nenhum vínculo encontrado.
                </p>
              ) : (
                <div className="space-y-3">
                  {vinculos.map((v) => (
                    <div
                      key={v.id}
                      className={`border rounded-xl p-4 ${
                        v.vence_em_breve
                          ? 'border-orange-200 bg-orange-50'
                          : v.sem_laudo_recente
                            ? 'border-yellow-200 bg-yellow-50'
                            : 'bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 truncate">
                              {v.entidade_nome ?? 'Entidade não identificada'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                STATUS_BADGE_VINCULO[v.status] ??
                                'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {v.status}
                            </span>
                            {v.vence_em_breve && (
                              <span className="text-xs text-orange-600 font-medium">
                                ⚠ Vence em breve
                              </span>
                            )}
                            {v.sem_laudo_recente && (
                              <span className="text-xs text-yellow-700 font-medium">
                                ⚠ Sem laudo recente
                              </span>
                            )}
                          </div>
                          {v.entidade_cnpj && (
                            <p className="text-xs text-gray-400 font-mono mt-0.5">
                              {formatCNPJ(v.entidade_cnpj)}
                            </p>
                          )}
                          {v.lead_razao_social && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              Lead: {v.lead_razao_social}
                            </p>
                          )}
                          {v.lead_valor_negociado != null &&
                            v.lead_valor_negociado > 0 && (
                              <p className="text-xs text-emerald-600 mt-0.5">
                                Valor negociado: R${' '}
                                {Number(v.lead_valor_negociado).toLocaleString(
                                  'pt-BR',
                                  { minimumFractionDigits: 2 }
                                )}
                              </p>
                            )}
                        </div>
                        <div className="text-right text-xs text-gray-500 space-y-1 flex-shrink-0">
                          <div>
                            Início: <strong>{formatDate(v.data_inicio)}</strong>
                          </div>
                          <div>
                            Expira:{' '}
                            <strong
                              className={
                                v.vence_em_breve ? 'text-orange-600' : ''
                              }
                            >
                              {formatDate(v.data_expiracao)}
                            </strong>
                          </div>
                          {v.ultimo_laudo_em && (
                            <div>
                              Último laudo: {formatDate(v.ultimo_laudo_em)}
                            </div>
                          )}
                          {!v.ultimo_laudo_em && v.status === 'ativo' && (
                            <div className="text-yellow-600">
                              Sem laudos ainda
                            </div>
                          )}
                          {v.encerrado_em && (
                            <div className="text-red-500">
                              Encerrado: {formatDate(v.encerrado_em)}
                            </div>
                          )}
                        </div>
                      </div>
                      {v.encerrado_motivo && (
                        <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-1.5">
                          Motivo: {v.encerrado_motivo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Paginação vínculos */}
              {totalVinculos > 25 && (
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    disabled={pageVinculos === 1}
                    onClick={() => setPageVinculos((p) => p - 1)}
                    className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    ← Anterior
                  </button>
                  <span className="px-3 py-1.5 text-sm text-gray-600">
                    Pág. {pageVinculos} de {Math.ceil(totalVinculos / 25)}
                  </span>
                  <button
                    disabled={pageVinculos >= Math.ceil(totalVinculos / 25)}
                    onClick={() => setPageVinculos((p) => p + 1)}
                    className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
