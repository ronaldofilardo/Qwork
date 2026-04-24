'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  XCircle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusCiclo = 'aberto' | 'fechado' | 'nf_enviada' | 'nf_aprovada' | 'pago';

interface CicloEnriquecido {
  id: number;
  mes_referencia: string;
  valor_total: number;
  qtd_comissoes: number;
  status: StatusCiclo;
  nf_path: string | null;
  nf_nome_arquivo: string | null;
  nf_enviada_em: string | null;
  nf_aprovada_em: string | null;
  nf_rejeitada_em: string | null;
  nf_motivo_rejeicao: string | null;
  data_pagamento: string | null;
  comprovante_pagamento_path: string | null;
  fechado_em: string | null;
  beneficiario_nome: string;
  beneficiario_tipo_pessoa: 'PF' | 'PJ' | null;
  beneficiario_codigo: string | null;
  beneficiario_email: string | null;
}

interface ResumoCiclosMes {
  valor_total: number;
  valor_pago: number;
  qtd_ciclos: number;
  qtd_pagos: number;
  qtd_aguardando_nf: number;
  qtd_nf_analise: number;
  qtd_aprovados: number;
}

type AcaoCiclo = 'fechar' | 'aprovar_nf' | 'rejeitar_nf' | 'pagar';

interface ComissaoLegadaAgrupada {
  representante_id: number;
  representante_nome: string;
  representante_codigo: string | null;
  qtd_comissoes: number;
  valor_total: number;
}

interface ResumoCiclosLegadas {
  itens: ComissaoLegadaAgrupada[];
  valor_total: number;
  qtd_comissoes: number;
}

interface ComissaoProvisionada {
  id: number;
  representante_nome: string;
  representante_codigo: string;
  entidade_nome: string;
  valor_comissao: string;
  percentual_comissao: string;
  parcela_numero: number;
  total_parcelas: number;
  mes_pagamento: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPROVANTE_MAX_SIZE = 5 * 1024 * 1024;
const COMPROVANTE_MIMES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
];

const STATUS_BADGE: Record<StatusCiclo, { label: string; cor: string }> = {
  aberto: { label: 'Aberto', cor: 'bg-gray-100 text-gray-600' },
  fechado: { label: 'Aguardando NF', cor: 'bg-blue-100 text-blue-700' },
  nf_enviada: { label: 'NF em Análise', cor: 'bg-indigo-100 text-indigo-700' },
  nf_aprovada: {
    label: 'Aprovado p/ Pagar',
    cor: 'bg-purple-100 text-purple-700',
  },
  pago: { label: 'Pago', cor: 'bg-green-100 text-green-700' },
};

const ACOES_POR_STATUS: Record<StatusCiclo, AcaoCiclo[]> = {
  aberto: ['fechar'],
  fechado: [],
  nf_enviada: ['aprovar_nf', 'rejeitar_nf'],
  nf_aprovada: ['pagar'],
  pago: [],
};

const ACAO_LABEL: Record<AcaoCiclo, string> = {
  fechar: 'Fechar Ciclo',
  aprovar_nf: 'Aprovar NF/RPA',
  rejeitar_nf: 'Rejeitar NF/RPA',
  pagar: 'Registrar Pagamento',
};

const ACAO_COR: Record<AcaoCiclo, string> = {
  fechar: 'bg-blue-600 hover:bg-blue-700 text-white',
  aprovar_nf: 'bg-green-600 hover:bg-green-700 text-white',
  rejeitar_nf: 'bg-red-600 hover:bg-red-700 text-white',
  pagar: 'bg-purple-600 hover:bg-purple-700 text-white',
};

const STATUS_FILTER_OPTIONS: Array<{ value: StatusCiclo | ''; label: string }> =
  [
    { value: '', label: 'Todos' },
    { value: 'aberto', label: 'Abertos' },
    { value: 'fechado', label: 'Aguardando NF' },
    { value: 'nf_enviada', label: 'NF em Análise' },
    { value: 'nf_aprovada', label: 'Aprovados' },
    { value: 'pago', label: 'Pagos' },
  ];

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | string | null | undefined): string {
  return `R$ ${parseFloat(String(v ?? 0)).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  })}`;
}

function fmtMes(mesRef: string): string {
  const d = new Date(mesRef + 'T12:00:00Z');
  return `${MESES[d.getUTCMonth()]}/${d.getUTCFullYear()}`;
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  cor: string;
  valueClass: string;
  sublabel?: string;
}

function SummaryCard({
  icon,
  label,
  value,
  cor,
  valueClass,
  sublabel,
}: SummaryCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${cor}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <div className={`text-xl font-bold ${valueClass}`}>{value}</div>
      {sublabel && (
        <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CiclosComissoesContent() {
  const now = new Date();
  const [selectedAno, setSelectedAno] = useState(now.getFullYear());
  const [selectedMes, setSelectedMes] = useState(now.getMonth() + 1);
  const [statusFiltro, setStatusFiltro] = useState<StatusCiclo | ''>('');
  const [ciclos, setCiclos] = useState<CicloEnriquecido[]>([]);
  const [resumo, setResumo] = useState<ResumoCiclosMes | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Modal state
  const [acaoPendente, setAcaoPendente] = useState<{
    ciclo: CicloEnriquecido;
    acao: AcaoCiclo;
  } | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null);
  const [comprovanteErro, setComprovanteErro] = useState('');
  const comprovanteInputRef = useRef<HTMLInputElement>(null);

  // Provisionadas
  const [provisionadas, setProvisionadas] = useState<ComissaoProvisionada[]>(
    []
  );
  const [provisionadasLoading, setProvisionadasLoading] = useState(false);
  const [provisionadasExpanded, setProvisionadasExpanded] = useState(true);

  // Legadas (pagas antes do mecanismo de ciclos)
  const [legadas, setLegadas] = useState<ResumoCiclosLegadas | null>(null);
  const [legadasExpanded, setLegadasExpanded] = useState(true);

  // ── Data fetching ────────────────────────────────────────────────────────────

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ano: String(selectedAno),
        mes: String(selectedMes),
        com_resumo: '1',
      });
      if (statusFiltro) params.set('status', statusFiltro);

      const res = await fetch(`/api/suporte/ciclos?${params}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErro(
          `Erro ao carregar ciclos (${res.status}): ${errData.error ?? res.statusText}`
        );
        return;
      }
      const data = await res.json();
      setCiclos(data.ciclos ?? []);
      setTotal(data.total ?? 0);
      setResumo(data.resumo ?? null);
      setLegadas(data.legadas ?? null);
    } catch (e) {
      setErro(`Falha de rede: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [page, selectedAno, selectedMes, statusFiltro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const carregarProvisionadas = useCallback(async () => {
    setProvisionadasLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'retida',
        provisionadas: '1',
        limit: '100',
        ano: String(selectedAno),
        mes: String(selectedMes),
      });
      const res = await fetch(`/api/admin/comissoes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProvisionadas(data.comissoes ?? []);
      }
    } catch {
      // non-critical, ignore
    } finally {
      setProvisionadasLoading(false);
    }
  }, [selectedAno, selectedMes]);

  useEffect(() => {
    carregarProvisionadas();
  }, [carregarProvisionadas]);

  // ── File handling ────────────────────────────────────────────────────────────

  const handleComprovanteFile = (f: File | null) => {
    setComprovanteErro('');
    setComprovanteFile(null);
    if (!f) return;
    if (f.size > COMPROVANTE_MAX_SIZE) {
      setComprovanteErro(
        `Arquivo excede 5MB (${(f.size / 1024 / 1024).toFixed(1)}MB)`
      );
      return;
    }
    if (!COMPROVANTE_MIMES.includes(f.type)) {
      setComprovanteErro('Tipo não aceito. Use PDF, PNG, JPG ou WEBP.');
      return;
    }
    setComprovanteFile(f);
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const fecharModal = () => {
    setAcaoPendente(null);
    setMotivoRejeicao('');
    setComprovanteFile(null);
    setComprovanteErro('');
    if (comprovanteInputRef.current) comprovanteInputRef.current.value = '';
  };

  const executarAcao = async () => {
    if (!acaoPendente) return;
    const { ciclo, acao } = acaoPendente;
    setActionLoading(ciclo.id);
    setErro('');

    try {
      if (acao === 'pagar' && comprovanteFile) {
        // Endpoint atômico: upload + registro de pagamento em uma única chamada
        const formData = new FormData();
        formData.append('comprovante', comprovanteFile);

        const pagarRes = await fetch(`/api/suporte/ciclos/${ciclo.id}/pagar`, {
          method: 'POST',
          body: formData,
        });
        const pagarData = await pagarRes.json().catch(() => ({}));
        if (!pagarRes.ok) {
          setErro(pagarData.error ?? 'Erro ao registrar pagamento');
          return;
        }
      } else {
        const body: Record<string, string> = { acao };
        if (acao === 'rejeitar_nf') body.motivo = motivoRejeicao;

        const res = await fetch(`/api/comissionamento/ciclos/${ciclo.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          setErro(data.error ?? 'Erro ao executar ação');
          return;
        }
      }

      setSucesso(`${ACAO_LABEL[acao]} executado com sucesso`);
      setTimeout(() => setSucesso(''), 3500);
      fecharModal();
      await carregar();
    } finally {
      setActionLoading(null);
    }
  };

  // ── Derivações ───────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / limit);

  const mesLabel = `${MESES[selectedMes - 1]}/${selectedAno}`;

  const anoOptions: number[] = [];
  for (let y = now.getFullYear(); y >= 2024; y--) anoOptions.push(y);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Comissões por Ciclos
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Provisão de pagamentos mensais — {mesLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Seletor de Mês */}
          <select
            value={selectedMes}
            onChange={(e) => {
              setSelectedMes(Number(e.target.value));
              setPage(1);
            }}
            className="text-sm border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none cursor-pointer"
            aria-label="Mês de referência"
          >
            {MESES.map((m, i) => (
              <option key={i + 1} value={i + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* Seletor de Ano */}
          <select
            value={selectedAno}
            onChange={(e) => {
              setSelectedAno(Number(e.target.value));
              setPage(1);
            }}
            className="text-sm border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-400 focus:outline-none cursor-pointer"
            aria-label="Ano de referência"
          >
            {anoOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={() => carregar()}
            disabled={loading}
            className="p-2 rounded-lg border bg-white hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
            aria-label="Recarregar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Mensagens */}
      {erro && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2"
        >
          <XCircle size={16} className="mt-0.5 shrink-0" />
          {erro}
        </div>
      )}
      {sucesso && (
        <div
          role="status"
          className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm flex items-center gap-2"
        >
          <CheckCircle size={16} className="shrink-0" />
          {sucesso}
        </div>
      )}

      {/* Seção de Comissões Pagas no mês */}
      {(ciclos.some((c) => c.status === 'pago') ||
        (legadas && legadas.itens.length > 0)) && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-4 space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900">
                Comissões Pagas em {mesLabel}
              </h3>
              <p className="text-sm text-green-700 mt-0.5">
                Resumo de todos os pagamentos realizados neste período
              </p>
            </div>
          </div>

          {/* Cards de resumo dos pagos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ciclos.filter((c) => c.status === 'pago').length > 0 ||
            (legadas && legadas.itens.length > 0) ? (
              <>
                <div className="bg-white rounded-lg p-2 border border-green-200">
                  <div className="text-xs text-green-600 font-medium">
                    Comissões Pagas
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {ciclos
                      .filter((c) => c.status === 'pago')
                      .reduce((acc, c) => acc + c.qtd_comissoes, 0) +
                      (legadas?.qtd_comissoes ?? 0)}
                  </div>
                  {ciclos.filter((c) => c.status === 'pago').length > 0 && (
                    <div className="text-xs text-green-500 mt-0.5">
                      {ciclos.filter((c) => c.status === 'pago').length} ciclo
                      {ciclos.filter((c) => c.status === 'pago').length > 1
                        ? 's'
                        : ''}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg p-2 border border-green-200">
                  <div className="text-xs text-green-600 font-medium">
                    Valor Total
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {fmt(
                      ciclos
                        .filter((c) => c.status === 'pago')
                        .reduce((acc, c) => acc + c.valor_total, 0) +
                        (legadas?.valor_total ?? 0)
                    )}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-green-200">
                  <div className="text-xs text-green-600 font-medium">
                    Beneficiários
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {
                      new Set([
                        ...ciclos
                          .filter((c) => c.status === 'pago')
                          .map((c) => c.beneficiario_nome),
                        ...(legadas?.itens.map((l) => l.representante_nome) ??
                          []),
                      ]).size
                    }
                  </div>
                </div>
                <div className="bg-white rounded-lg p-2 border border-green-200">
                  <div className="text-xs text-green-600 font-medium">
                    Comissões
                  </div>
                  <div className="text-lg font-bold text-green-900">
                    {ciclos
                      .filter((c) => c.status === 'pago')
                      .reduce((acc, c) => acc + c.qtd_comissoes, 0) +
                      (legadas?.qtd_comissoes ?? 0)}
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-4 text-sm text-green-700 text-center py-2">
                Não há comissões pagas registradas em {mesLabel}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary cards do mês */}
      {resumo && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <SummaryCard
            icon={<DollarSign size={18} className="text-blue-600" />}
            label="Total do Ciclo"
            value={fmt(resumo.valor_total)}
            cor="border-blue-200 bg-blue-50"
            valueClass="text-blue-700"
          />
          <SummaryCard
            icon={<CheckCircle size={18} className="text-green-600" />}
            label="Total Pago"
            value={fmt(resumo.valor_pago)}
            cor="border-green-200 bg-green-50"
            valueClass="text-green-700"
          />
          <SummaryCard
            icon={<FileText size={18} className="text-slate-500" />}
            label="Aguardando NF"
            value={String(resumo.qtd_aguardando_nf)}
            cor="border-slate-200 bg-slate-50"
            valueClass="text-slate-700"
            sublabel="ciclos fechados"
          />
          <SummaryCard
            icon={<Clock size={18} className="text-indigo-500" />}
            label="NF em Análise"
            value={String(resumo.qtd_nf_analise)}
            cor="border-indigo-200 bg-indigo-50"
            valueClass="text-indigo-700"
            sublabel="aguardando aprovação"
          />
          <SummaryCard
            icon={<AlertCircle size={18} className="text-purple-500" />}
            label="Prontos p/ Pagar"
            value={String(resumo.qtd_aprovados)}
            cor="border-purple-200 bg-purple-50"
            valueClass="text-purple-700"
            sublabel="NF aprovada"
          />
        </div>
      )}

      {/* Filtro de status */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTER_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => {
              setStatusFiltro(value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${
              statusFiltro === value
                ? 'bg-gray-900 text-white'
                : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tabela de ciclos */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div
            className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent"
            role="status"
            aria-label="Carregando"
          />
        </div>
      ) : ciclos.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border">
          <FileText size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="font-medium">Nenhum ciclo encontrado</p>
          <p className="text-sm mt-1 text-gray-400">
            {statusFiltro
              ? `Sem ciclos com status "${STATUS_BADGE[statusFiltro as StatusCiclo]?.label ?? statusFiltro}" em ${mesLabel}`
              : `Sem ciclos em ${mesLabel}`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    Beneficiário
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Mês Ref.
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Laudos
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Valor Total
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">NF/RPA</th>
                  {ciclos.some((c) => c.status === 'pago') && (
                    <th className="px-4 py-3 text-left font-semibold">
                      Data Pagamento
                    </th>
                  )}
                  <th className="px-4 py-3 text-center font-semibold min-w-[160px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ciclos.map((c) => {
                  const acoes = ACOES_POR_STATUS[c.status] ?? [];
                  const badge = STATUS_BADGE[c.status];

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* Beneficiário */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {c.beneficiario_nome ?? '—'}
                        </div>
                        {c.beneficiario_codigo && (
                          <div className="text-xs text-gray-400 font-mono">
                            {c.beneficiario_codigo}
                          </div>
                        )}
                      </td>

                      {/* Tipo */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-gray-600">
                            Representante
                          </span>
                          {c.beneficiario_tipo_pessoa && (
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold w-fit ${
                                c.beneficiario_tipo_pessoa === 'PF'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-cyan-50 text-cyan-700'
                              }`}
                            >
                              {c.beneficiario_tipo_pessoa}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Mês Ref */}
                      <td className="px-4 py-3 text-gray-700 font-mono text-xs">
                        {fmtMes(c.mes_referencia)}
                      </td>

                      {/* Qtd laudos */}
                      <td className="px-4 py-3 text-center text-gray-700 font-medium">
                        {c.qtd_comissoes}
                      </td>

                      {/* Valor total */}
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {fmt(c.valor_total)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${badge?.cor ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {badge?.label ?? c.status}
                        </span>
                        {c.nf_rejeitada_em && (
                          <div className="text-xs text-red-600 mt-1">
                            NF rejeitada
                          </div>
                        )}
                      </td>

                      {/* NF */}
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {c.nf_nome_arquivo ? (
                          <span
                            className="underline underline-offset-2 text-blue-600"
                            title={c.nf_path ?? undefined}
                          >
                            {c.nf_nome_arquivo}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                        {c.nf_motivo_rejeicao && (
                          <div
                            className="text-red-500 text-xs mt-0.5 max-w-[140px] truncate"
                            title={c.nf_motivo_rejeicao}
                          >
                            Motivo: {c.nf_motivo_rejeicao}
                          </div>
                        )}
                      </td>

                      {/* Data Pagamento (apenas se houver ciclos pagos) */}
                      {ciclos.some((cc) => cc.status === 'pago') && (
                        <td className="px-4 py-3 text-xs">
                          {c.status === 'pago' && c.data_pagamento ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-green-700">
                                {new Date(c.data_pagamento).toLocaleDateString(
                                  'pt-BR'
                                )}
                              </span>
                              {c.comprovante_pagamento_path && (
                                <span className="text-gray-400 text-xs">
                                  ✓ Comprovante
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                      )}

                      {/* Ações */}
                      <td className="px-4 py-3 text-center">
                        {acoes.length > 0 ? (
                          <div className="flex items-center justify-center gap-1 flex-wrap">
                            {acoes.map((acao) => (
                              <button
                                key={acao}
                                disabled={actionLoading === c.id}
                                onClick={() =>
                                  setAcaoPendente({ ciclo: c, acao })
                                }
                                className={`px-2.5 py-1 rounded text-xs font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 ${ACAO_COR[acao]}`}
                              >
                                {ACAO_LABEL[acao]}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                {total} ciclos · Página {page} de {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded border bg-white hover:bg-gray-100 disabled:opacity-40 cursor-pointer transition-colors focus:ring-2 focus:ring-blue-400"
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded border bg-white hover:bg-gray-100 disabled:opacity-40 cursor-pointer transition-colors focus:ring-2 focus:ring-blue-400"
                  aria-label="Próxima página"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Comissões Legadas (pagas antes do mecanismo de ciclos) ── */}
      {legadas && legadas.itens.length > 0 && (
        <div className="border rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setLegadasExpanded((e) => !e)}
            className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-semibold text-green-900">
                Comissões Pagas (Legadas)
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800">
                {legadas.itens.length} representante
                {legadas.itens.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-green-700 ml-1">
                — pagas antes do mecanismo de fechamento mensal
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`text-green-600 transition-transform ${legadasExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {legadasExpanded && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Representante
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Laudos
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Valor Total Pago
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {legadas.itens.map((l) => (
                    <tr
                      key={l.representante_id}
                      className="hover:bg-green-50/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {l.representante_nome}
                        </div>
                        {l.representante_codigo && (
                          <div className="text-xs text-gray-400 font-mono">
                            {l.representante_codigo}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-700 font-medium">
                        {l.qtd_comissoes}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {fmt(l.valor_total)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          Pago
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* Totalizador */}
                  <tr className="bg-green-50 font-semibold">
                    <td className="px-4 py-2 text-green-900">Total</td>
                    <td className="px-4 py-2 text-center text-green-900">
                      {legadas.qtd_comissoes}
                    </td>
                    <td className="px-4 py-2 text-right text-green-900">
                      {fmt(legadas.valor_total)}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Comissões Provisionadas (parcelas futuras) ──────────── */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <button
          onClick={() => setProvisionadasExpanded((e) => !e)}
          className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">
              Comissões Provisionadas
            </span>
            {provisionadas.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                {provisionadas.length}
              </span>
            )}
            <span className="text-xs text-amber-700 ml-1">
              — parcelas futuras aguardando pagamento
            </span>
          </div>
          <ChevronDown
            size={16}
            className={`text-amber-600 transition-transform ${provisionadasExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {provisionadasExpanded &&
          (provisionadasLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-6 w-6 rounded-full border-4 border-amber-400 border-t-transparent" />
            </div>
          ) : provisionadas.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Nenhuma comissão provisionada no momento
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">
                      Representante
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Cliente
                    </th>
                    <th className="px-4 py-3 text-right font-semibold">
                      Comissão
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Parcela
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">
                      Mês Pag. Previsto
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {provisionadas.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-amber-50/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {p.representante_nome}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {p.representante_codigo}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {p.entidade_nome}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {fmt(p.valor_comissao)}{' '}
                        <span className="text-xs text-gray-400 font-normal">
                          ({p.percentual_comissao}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-mono text-gray-700">
                          {p.parcela_numero}/{p.total_parcelas}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {p.mes_pagamento
                          ? new Date(
                              p.mes_pagamento + 'T12:00:00Z'
                            ).toLocaleDateString('pt-BR', {
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                          Retida
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>

      {/* ── Modal de Ação ────────────────────────────────────────── */}
      {acaoPendente && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-titulo"
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2
              id="modal-titulo"
              className="font-semibold text-gray-900 text-base"
            >
              {ACAO_LABEL[acaoPendente.acao]}
            </h2>

            {/* Info do ciclo */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-28 shrink-0">
                  Beneficiário
                </span>
                <span className="font-medium">
                  {acaoPendente.ciclo.beneficiario_nome}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-28 shrink-0">Mês</span>
                <span>{fmtMes(acaoPendente.ciclo.mes_referencia)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-28 shrink-0">Valor Total</span>
                <span className="font-semibold text-gray-900">
                  {fmt(acaoPendente.ciclo.valor_total)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 w-28 shrink-0">Laudos</span>
                <span>{acaoPendente.ciclo.qtd_comissoes}</span>
              </div>
            </div>

            {/* Campo motivo rejeição */}
            {acaoPendente.acao === 'rejeitar_nf' && (
              <div>
                <label
                  htmlFor="motivo-rejeicao"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Motivo da rejeição{' '}
                  <span className="text-red-500">(obrigatório)</span>
                </label>
                <textarea
                  id="motivo-rejeicao"
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-400 focus:outline-none"
                  rows={3}
                  placeholder="Descreva o motivo para o representante corrigir e reenviar..."
                  maxLength={500}
                  required
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {motivoRejeicao.length}/500
                </p>
              </div>
            )}

            {/* Upload comprovante */}
            {acaoPendente.acao === 'pagar' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comprovante de pagamento{' '}
                  <span className="text-red-500">(obrigatório)</span>
                </label>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 transition-colors focus-within:ring-2 focus-within:ring-blue-400"
                  onClick={() => comprovanteInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ')
                      comprovanteInputRef.current?.click();
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label="Clique para selecionar comprovante"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleComprovanteFile(e.dataTransfer.files?.[0] ?? null);
                  }}
                >
                  <input
                    ref={comprovanteInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={(e) =>
                      handleComprovanteFile(e.target.files?.[0] ?? null)
                    }
                    aria-label="Selecionar arquivo comprovante"
                  />
                  {comprovanteFile ? (
                    <div className="flex items-center justify-between gap-2 text-left">
                      <span className="text-sm text-gray-700 truncate">
                        {comprovanteFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setComprovanteFile(null);
                          setComprovanteErro('');
                          if (comprovanteInputRef.current)
                            comprovanteInputRef.current.value = '';
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                        aria-label="Remover arquivo"
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Clique ou arraste — PDF, PNG, JPG, WEBP · máx. 5 MB
                    </p>
                  )}
                </div>
                {comprovanteErro && (
                  <p className="text-xs text-red-600 mt-1" role="alert">
                    {comprovanteErro}
                  </p>
                )}
              </div>
            )}

            {/* Descrição para fechar ciclo */}
            {acaoPendente.acao === 'fechar' && (
              <p className="text-sm text-gray-600">
                Isso irá vincular todas as comissões pendentes do mês ao ciclo e
                alterar o status para <strong>Aguardando NF</strong>. O
                representante poderá então enviar a NF/RPA.
              </p>
            )}

            {/* Descrição para aprovar NF */}
            {acaoPendente.acao === 'aprovar_nf' && (
              <p className="text-sm text-gray-600">
                A NF/RPA{' '}
                {acaoPendente.ciclo.nf_nome_arquivo && (
                  <strong>{acaoPendente.ciclo.nf_nome_arquivo}</strong>
                )}{' '}
                será aprovada e o ciclo ficará pronto para pagamento.
              </p>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={fecharModal}
                disabled={actionLoading !== null}
                className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={executarAcao}
                disabled={
                  actionLoading !== null ||
                  (acaoPendente.acao === 'rejeitar_nf' &&
                    motivoRejeicao.trim().length < 5) ||
                  (acaoPendente.acao === 'pagar' && !comprovanteFile) ||
                  !!comprovanteErro
                }
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 disabled:opacity-50 ${ACAO_COR[acaoPendente.acao]}`}
              >
                {actionLoading !== null
                  ? 'Salvando...'
                  : ACAO_LABEL[acaoPendente.acao]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
