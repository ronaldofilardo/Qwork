'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Users,
  TrendingUp,
  Pencil,
  X,
  Building2,
  UserX,
  TriangleAlert,
  Loader2,
  AlertCircle,
  BadgeCheck,
  Percent,
  DollarSign,
} from 'lucide-react';
import EditRepresentanteModal from './EditRepresentanteModal';
import AprovarComissaoModal from './AprovarComissaoModal';
import KPICard from './KPICard';
import { fmtBRL, fmtDoc, fmtCpf, fmtCnpj } from './format-utils';

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  apto: { label: 'Ativo', cls: 'bg-green-100 text-green-700' },
  ativo: { label: 'Em Cadastro', cls: 'bg-blue-100 text-blue-700' },
  apto_pendente: {
    label: 'Aguardando Aprovação',
    cls: 'bg-amber-100 text-amber-700',
  },
  aprovacao_comercial: {
    label: 'Aguardando Aprovação',
    cls: 'bg-amber-100 text-amber-700',
  },
  apto_bloqueado: { label: 'Bloqueado', cls: 'bg-orange-100 text-orange-700' },
  suspenso: { label: 'Suspenso', cls: 'bg-red-100 text-red-700' },
  desativado: { label: 'Desativado', cls: 'bg-gray-100 text-gray-500' },
  rejeitado: { label: 'Rejeitado', cls: 'bg-red-100 text-red-700' },
};

const STATUS_LEAD_CLS: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  convertido: 'bg-blue-100 text-blue-700',
  perdido: 'bg-red-100 text-red-700',
  expirado: 'bg-gray-100 text-gray-500',
  pendente: 'bg-amber-100 text-amber-700',
};

const STATUS_VINCULO_CLS: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-500',
  suspenso: 'bg-red-100 text-red-700',
  pendente: 'bg-amber-100 text-amber-700',
};

const STATUS_COMISSAO_CLS: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-700',
  aprovada: 'bg-blue-100 text-blue-700',
  em_pagamento: 'bg-purple-100 text-purple-700',
};

interface RepMetrica {
  id: number;
  nome: string;
  email?: string;
  codigo?: string;
  status: string;
  leads_ativos: number;
  vinculos_ativos: number;
  comissoes_pendentes: number;
  valor_pendente: number;
  leads_mes: number;
}

interface VendedorEquipe {
  vinculo_id: number;
  vendedor_id: number;
  nome: string;
  email: string | null;
  cpf: string | null;
  codigo_vendedor: string | null;
  leads_ativos: number;
  vinculos_ativos: number;
}

interface LeadDetalhe {
  id: number;
  cnpj: string | null;
  razao_social: string | null;
  contato_nome: string | null;
  status: string;
  origem: string | null;
  criado_em: string;
  data_expiracao: string | null;
  vendedor_nome: string | null;
  vendedor_id: number | null;
}

interface VinculoDetalhe {
  id: number;
  status: string;
  data_inicio: string | null;
  data_expiracao: string | null;
  criado_em: string;
  encerrado_em: string | null;
  entidade_nome: string | null;
  entidade_cnpj: string | null;
  vendedor_nome: string | null;
  vendedor_id: number | null;
}

interface ComissaoDetalhe {
  id: number;
  status: string;
  valor_comissao: number;
  percentual_comissao: number | null;
  mes_emissao: string | null;
  mes_pagamento: string | null;
  entidade_nome: string | null;
}

type PainelTipo =
  | 'leads'
  | 'vinculos'
  | 'comissoes'
  | 'leads_mes'
  | 'vendedor'
  | null;

export default function ComercialRepresentanteDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [rep, setRep] = useState<RepMetrica | null>(null);
  const [repFull, setRepFull] = useState<{
    id: number;
    nome: string;
    email: string;
    tipo_pessoa: 'pf' | 'pj';
    status: string;
    telefone?: string | null;
    cpf?: string | null;
    cnpj?: string | null;
    cpf_responsavel_pj?: string | null;
    percentual_comissao?: number | null;
    percentual_comissao_comercial?: number | null;
    modelo_comissionamento?: 'percentual' | 'custo_fixo' | null;
    valor_custo_fixo_entidade?: number | null;
    valor_custo_fixo_clinica?: number | null;
    asaas_wallet_id?: string | null;
    banco_codigo?: string | null;
    agencia?: string | null;
    conta?: string | null;
    tipo_conta?: string | null;
    titular_conta?: string | null;
    pix_chave?: string | null;
    pix_tipo?: string | null;
  } | null>(null);
  const [vendedores, setVendedores] = useState<VendedorEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingVend, setLoadingVend] = useState(false);
  const [erro, setErro] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [showComissao, setShowComissao] = useState(false);
  const [painel, setPainel] = useState<PainelTipo>(null);
  const [painelLoading, setPainelLoading] = useState(false);
  const [leadsDetalhe, setLeadsDetalhe] = useState<LeadDetalhe[]>([]);
  const [vinculosDetalhe, setVinculosDetalhe] = useState<VinculoDetalhe[]>([]);
  const [comissoesDetalhe, setComissoesDetalhe] = useState<ComissaoDetalhe[]>(
    []
  );
  const [comissoesTotal, setComissoesTotal] = useState(0);
  const [vendedorPainel, setVendedorPainel] = useState<VendedorEquipe | null>(
    null
  );

  // ── Inativação de Representante ───────────────────────────────────────────
  const [showInativarRep, setShowInativarRep] = useState(false);
  const [motivoInativarRep, setMotivoInativarRep] = useState('');
  const [inativandoRep, setInativandoRep] = useState(false);
  const [erroInativarRep, setErroInativarRep] = useState<string | null>(null);

  const handleInativarRep = async () => {
    setInativandoRep(true);
    setErroInativarRep(null);
    try {
      const res = await fetch(`/api/comercial/representantes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'desativado',
          motivo: motivoInativarRep.trim(),
        }),
      });
      const d = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        detail?: string;
      };
      if (!res.ok) {
        if (d.code === 'COMISSOES_PENDENTES') {
          setErroInativarRep(
            d.detail ?? d.error ?? 'Existem comissões pendentes.'
          );
        } else {
          setErroInativarRep(d.error ?? 'Erro ao inativar');
        }
        return;
      }
      setShowInativarRep(false);
      setMotivoInativarRep('');
      router.push('/comercial/representantes');
    } catch {
      setErroInativarRep('Erro ao processar inativação');
    } finally {
      setInativandoRep(false);
    }
  };

  const carregarVendedores = useCallback(async () => {
    setLoadingVend(true);
    try {
      const res = await fetch(
        `/api/comercial/representantes/${id}/vendedores?limit=50`
      );
      if (res.ok) {
        const data = (await res.json()) as { vendedores?: VendedorEquipe[] };
        setVendedores(data.vendedores ?? []);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingVend(false);
    }
  }, [id]);

  // ── Inativação de Vendedor ────────────────────────────────────────────────
  const [showInativarVend, setShowInativarVend] = useState(false);
  const [motivoInativarVend, setMotivoInativarVend] = useState('');
  const [inativandoVend, setInativandoVend] = useState(false);
  const [erroInativarVend, setErroInativarVend] = useState<string | null>(null);

  const handleInativarVend = async () => {
    if (!vendedorPainel) return;
    setInativandoVend(true);
    setErroInativarVend(null);
    try {
      const res = await fetch(
        `/api/comercial/vendedores/${vendedorPainel.vendedor_id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ativo: false,
            motivo: motivoInativarVend.trim(),
          }),
        }
      );
      const d = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        detail?: string;
      };
      if (!res.ok) {
        if (d.code === 'COMISSOES_PENDENTES') {
          setErroInativarVend(
            d.detail ?? d.error ?? 'Existem comissões pendentes.'
          );
        } else {
          setErroInativarVend(d.error ?? 'Erro ao inativar');
        }
        return;
      }
      setShowInativarVend(false);
      setMotivoInativarVend('');
      setPainel(null);
      void carregarVendedores();
    } catch {
      setErroInativarVend('Erro ao processar inativação');
    } finally {
      setInativandoVend(false);
    }
  };

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comercial/representantes/metricas`);
      if (!res.ok) throw new Error('Falha ao carregar métricas');
      const data = (await res.json()) as { representantes?: RepMetrica[] };
      const encontrado = data.representantes?.find(
        (r) => r.id === parseInt(id, 10)
      );
      if (encontrado) {
        setRep(encontrado);
      } else {
        setErro('Representante não encontrado.');
      }
    } catch {
      setErro('Erro ao carregar dados do representante.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const carregarRepFull = useCallback(async () => {
    try {
      const res = await fetch(`/api/comercial/representantes/${id}`);
      if (res.ok) {
        const data = (await res.json()) as {
          representante?: {
            id: number;
            nome: string;
            email: string;
            tipo_pessoa: 'pf' | 'pj';
            status: string;
            telefone?: string | null;
            cpf?: string | null;
            cnpj?: string | null;
            percentual_comissao?: number | null;
            modelo_comissionamento?: 'percentual' | 'custo_fixo' | null;
            asaas_wallet_id?: string | null;
            banco_codigo?: string | null;
            agencia?: string | null;
            conta?: string | null;
            tipo_conta?: string | null;
            titular_conta?: string | null;
            pix_chave?: string | null;
            pix_tipo?: string | null;
          } | null;
        };
        setRepFull(data.representante ?? null);
      }
    } catch {
      // silently ignore — representante info is supplementary
    }
  }, [id]);

  const abrirPainel = useCallback(
    async (tipo: PainelTipo) => {
      if (!tipo || tipo === 'vendedor') return;
      setPainel(tipo);
      setPainelLoading(true);
      try {
        const seg = tipo === 'leads_mes' ? 'leads?mes=true' : tipo;
        const res = await fetch(`/api/comercial/representantes/${id}/${seg}`);
        if (!res.ok) throw new Error();
        const data = (await res.json()) as {
          leads?: LeadDetalhe[];
          vinculos?: VinculoDetalhe[];
          comissoes?: ComissaoDetalhe[];
          total_pendente?: number;
        };
        if (tipo === 'leads' || tipo === 'leads_mes') {
          setLeadsDetalhe(data.leads ?? []);
        } else if (tipo === 'vinculos') {
          setVinculosDetalhe(data.vinculos ?? []);
        } else if (tipo === 'comissoes') {
          setComissoesDetalhe(data.comissoes ?? []);
          setComissoesTotal(data.total_pendente ?? 0);
        }
      } catch {
        // silently ignore
      } finally {
        setPainelLoading(false);
      }
    },
    [id]
  );

  const abrirVendedorDrawer = useCallback((v: VendedorEquipe) => {
    setVendedorPainel(v);
    setPainel('vendedor');
    setShowInativarVend(false);
    setMotivoInativarVend('');
    setErroInativarVend(null);
  }, []);

  useEffect(() => {
    carregarDados();
    carregarVendedores();
    carregarRepFull();
  }, [carregarDados, carregarVendedores, carregarRepFull]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  if (erro || !rep) {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 min-h-screen">
        <p className="mb-4">{erro || 'Representante não encontrado.'}</p>
        <button
          onClick={() => router.back()}
          className="text-green-600 hover:underline"
        >
          ← Voltar
        </button>
      </div>
    );
  }

  const statusInfo = STATUS_LABEL[rep.status] ?? {
    label: rep.status,
    cls: 'bg-gray-100 text-gray-500',
  };
  const n = (v: number | undefined) => (v ?? 0).toLocaleString('pt-BR');

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push('/comercial/representantes')}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
            Voltar à Lista
          </button>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${statusInfo.cls}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {rep.nome}
              </h1>
              {rep.codigo && (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[11px] font-bold rounded-full uppercase tracking-widest">
                  {rep.codigo}
                </span>
              )}
            </div>
            {repFull && (repFull.cnpj || repFull.cpf) && (
              <div className="mt-1 space-y-1">
                <p className="text-gray-500 text-sm font-medium">
                  {fmtDoc(repFull.cnpj || repFull.cpf)}
                </p>
                {repFull.cnpj && repFull.cpf_responsavel_pj && (
                  <p className="text-gray-400 text-xs">
                    CPF: {fmtCpf(repFull.cpf_responsavel_pj)}
                  </p>
                )}
              </div>
            )}
            {rep.email && (
              <p className="text-gray-400 text-sm mt-1">{rep.email}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowEdit(true)}
              disabled={!repFull}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <Pencil size={15} />
              Editar Dados
            </button>
            {!['rejeitado', 'desativado', 'suspenso'].includes(rep.status) && (
              <>
                {repFull?.modelo_comissionamento ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <BadgeCheck size={13} />
                    Comissão: {repFull.modelo_comissionamento}
                  </span>
                ) : (
                  <button
                    onClick={() => setShowComissao(true)}
                    disabled={!repFull}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-700 border border-purple-200 rounded-xl hover:bg-purple-50 disabled:opacity-40 transition-colors"
                  >
                    <BadgeCheck size={15} />
                    Definir Comissão
                  </button>
                )}
              </>
            )}
            {rep.status !== 'desativado' && (
              <button
                onClick={() => {
                  setShowInativarRep((v) => !v);
                  setErroInativarRep(null);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                <UserX size={15} />
                Desativar
              </button>
            )}
          </div>

          {/* Modal inline de desativação do representante */}
          {showInativarRep && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <TriangleAlert
                    className="text-red-500 shrink-0 mt-0.5"
                    size={20}
                  />
                  <div>
                    <h3 className="font-bold text-gray-900">
                      Desativar Representante
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Esta ação encerra todos os vínculos ativos. Só é permitida
                      se não houver comissões pendentes.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowInativarRep(false);
                      setMotivoInativarRep('');
                      setErroInativarRep(null);
                    }}
                    className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-700 font-medium">
                  {rep.nome}
                  {rep.codigo && (
                    <span className="ml-2 text-xs text-gray-400 font-mono">
                      #{rep.codigo}
                    </span>
                  )}
                </div>
                <textarea
                  value={motivoInativarRep}
                  onChange={(e) => setMotivoInativarRep(e.target.value)}
                  placeholder="Motivo da desativação (mínimo 5 caracteres)..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-none"
                />
                {erroInativarRep && (
                  <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    {erroInativarRep}
                  </div>
                )}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => {
                      setShowInativarRep(false);
                      setMotivoInativarRep('');
                      setErroInativarRep(null);
                    }}
                    disabled={inativandoRep}
                    className="flex-1 px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleInativarRep}
                    disabled={
                      inativandoRep || motivoInativarRep.trim().length < 5
                    }
                    className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {inativandoRep ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <UserX size={14} />
                    )}
                    {inativandoRep ? 'Desativando...' : 'Confirmar Desativação'}
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white border rounded-2xl px-6 py-3 shadow-sm flex items-center gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Comissão Pendente
              </p>
              <p className="text-lg font-black text-amber-600 tracking-tight">
                {fmtBRL(rep.valor_pendente)}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Equipe
              </p>
              <p className="text-lg font-black text-gray-800 tracking-tight">
                {vendedores.length} Vendedor
                {vendedores.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Leads Ativos"
            value={n(rep.leads_ativos)}
            sub="Leads ativos agora"
            onClick={() => void abrirPainel('leads')}
          />
          <KPICard
            label="Vínculos"
            value={n(rep.vinculos_ativos)}
            sub="Comissão ativa"
            onClick={() => void abrirPainel('vinculos')}
          />
          <KPICard
            label="Pendências"
            value={n(rep.comissoes_pendentes)}
            highlight={rep.comissoes_pendentes > 0}
            sub="Comissões em aberto"
            onClick={() => void abrirPainel('comissoes')}
          />
          <div
            onClick={() => void abrirPainel('leads_mes')}
            className="bg-green-600 rounded-2xl p-6 text-white shadow-lg shadow-green-900/10 flex flex-col justify-center h-40 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <span className="text-[11px] uppercase font-bold tracking-widest opacity-80 mb-2">
              Este Mês
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-black">{rep.leads_mes || 0}</span>
              <span className="text-xs font-bold opacity-80 uppercase tracking-tight">
                novos leads
              </span>
            </div>
          </div>
        </div>

        {/* ── Comissionamento ──────────────────────────────────────────── */}
        {repFull && (
          <div className="bg-white rounded-3xl border shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <BadgeCheck size={20} className="text-purple-600" />
                <h2 className="text-base font-bold text-gray-900">
                  Comissionamento
                </h2>
              </div>
              {repFull.modelo_comissionamento && !repFull.asaas_wallet_id && (
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight bg-orange-100 text-orange-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full inline-block" />
                  Sem Wallet ID
                </span>
              )}
            </div>

            {repFull.modelo_comissionamento ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Modelo */}
                <div className="bg-gray-50 rounded-xl p-4 border">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Modelo
                  </p>
                  <div className="flex items-center gap-2">
                    {repFull.modelo_comissionamento === 'percentual' ? (
                      <Percent size={16} className="text-green-600" />
                    ) : (
                      <DollarSign size={16} className="text-blue-600" />
                    )}
                    <p className="font-bold text-gray-900">
                      {repFull.modelo_comissionamento === 'percentual'
                        ? 'Percentual'
                        : 'Custo Fixo'}
                    </p>
                  </div>
                </div>

                {/* Se PERCENTUAL: mostrar percentuais do representante e comercial */}
                {repFull.modelo_comissionamento === 'percentual' && (
                  <>
                    {repFull.percentual_comissao != null && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Comissão Representante
                        </p>
                        <p className="font-black text-green-700 text-2xl">
                          {repFull.percentual_comissao}
                          <span className="text-sm font-bold ml-0.5">%</span>
                        </p>
                      </div>
                    )}
                    {repFull.percentual_comissao_comercial != null && (
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Comissão Comercial
                        </p>
                        <p className="font-black text-purple-700 text-2xl">
                          {repFull.percentual_comissao_comercial}
                          <span className="text-sm font-bold ml-0.5">%</span>
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Se CUSTO FIXO: mostrar valores por entidade/clínica + % comercial */}
                {repFull.modelo_comissionamento === 'custo_fixo' && (
                  <>
                    {repFull.valor_custo_fixo_entidade != null && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Custo Fixo — Entidade
                        </p>
                        <p className="font-black text-blue-700 text-xl">
                          R${' '}
                          {repFull.valor_custo_fixo_entidade.toLocaleString(
                            'pt-BR',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                      </div>
                    )}
                    {repFull.valor_custo_fixo_clinica != null && (
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Custo Fixo — Clínica
                        </p>
                        <p className="font-black text-blue-700 text-xl">
                          R${' '}
                          {repFull.valor_custo_fixo_clinica.toLocaleString(
                            'pt-BR',
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </p>
                      </div>
                    )}
                    {repFull.percentual_comissao_comercial != null && (
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          Comissão Comercial
                        </p>
                        <p className="font-black text-purple-700 text-2xl">
                          {repFull.percentual_comissao_comercial}
                          <span className="text-sm font-bold ml-0.5">%</span>
                        </p>
                      </div>
                    )}
                  </>
                )}

                {repFull.asaas_wallet_id && (
                  <div className="bg-gray-50 rounded-xl p-4 border sm:col-span-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      Wallet ID (Asaas)
                    </p>
                    <p className="font-mono text-xs text-gray-600 break-all">
                      {repFull.asaas_wallet_id}
                    </p>
                  </div>
                )}
                {!repFull.asaas_wallet_id && (
                  <div className="sm:col-span-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-800 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                    <span>
                      <strong>Wallet ID Asaas não configurado.</strong> O
                      pagamento via split não funcionará até ser definido.
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Percent size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">
                  Modelo de comissionamento não definido
                </p>
                {(rep.status === 'apto' ||
                  rep.status === 'apto_pendente' ||
                  rep.status === 'aprovacao_comercial') && (
                  <button
                    onClick={() => setShowComissao(true)}
                    className="mt-3 px-4 py-2 text-sm bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold transition-colors"
                  >
                    Definir Comissionamento
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
          <div className="px-8 py-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={20} className="text-green-600" />{' '}
              <h2 className="text-base font-bold text-gray-900">
                Equipe de Vendedores
              </h2>
            </div>
            <span className="bg-gray-100 text-gray-500 text-[11px] font-bold rounded-full px-3 py-1">
              {vendedores.length}
            </span>
          </div>

          {loadingVend ? (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
            </div>
          ) : vendedores.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Nenhum vendedor vinculado</p>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendedores.map((v) => (
                <div
                  key={v.vinculo_id}
                  onClick={() => abrirVendedorDrawer(v)}
                  className="bg-gray-50 rounded-xl border p-4 space-y-3 cursor-pointer hover:border-blue-200 hover:bg-blue-50/30 transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                      {v.nome[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {v.nome}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {v.email ?? v.cpf ?? '—'}
                      </p>
                    </div>
                  </div>
                  {v.codigo_vendedor && (
                    <code className="block text-[10px] font-mono bg-white border px-2 py-1 rounded text-gray-600">
                      {v.codigo_vendedor}
                    </code>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={11} /> {v.leads_ativos} leads
                    </span>
                    <span>
                      {v.vinculos_ativos} vínculo
                      {v.vinculos_ativos !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {painel && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setPainel(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-900">
                {painel === 'vendedor' && vendedorPainel
                  ? vendedorPainel.nome
                  : painel === 'leads'
                    ? 'Leads Ativos'
                    : painel === 'leads_mes'
                      ? 'Novos Leads (Este Mês)'
                      : painel === 'vinculos'
                        ? 'Vínculos Ativos'
                        : 'Comissões Pendentes'}
              </h3>
              <button
                onClick={() => setPainel(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {painel === 'vendedor' && vendedorPainel && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xl flex-shrink-0">
                      {vendedorPainel.nome[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {vendedorPainel.nome}
                      </p>
                      {vendedorPainel.codigo_vendedor && (
                        <code className="text-[11px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                          {vendedorPainel.codigo_vendedor}
                        </code>
                      )}
                    </div>
                  </div>
                  <div className="divide-y border rounded-xl overflow-hidden">
                    {vendedorPainel.email && (
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          E-mail
                        </span>
                        <span className="text-sm text-gray-700">
                          {vendedorPainel.email}
                        </span>
                      </div>
                    )}
                    {vendedorPainel.cpf && (
                      <div className="px-4 py-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          CPF
                        </span>
                        <span className="text-sm text-gray-700">
                          {fmtCpf(vendedorPainel.cpf)}
                        </span>
                      </div>
                    )}
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Leads Ativos
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {vendedorPainel.leads_ativos}
                      </span>
                    </div>
                    <div className="px-4 py-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Vínculos
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {vendedorPainel.vinculos_ativos}
                      </span>
                    </div>
                  </div>

                  {/* Inativação do Vendedor */}
                  {!showInativarVend ? (
                    <button
                      onClick={() => {
                        setShowInativarVend(true);
                        setErroInativarVend(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors font-medium"
                    >
                      <UserX size={14} />
                      Inativar Vendedor
                    </button>
                  ) : (
                    <div className="border border-red-200 rounded-xl p-4 bg-red-50 space-y-3">
                      <div className="flex items-start gap-2">
                        <TriangleAlert
                          size={15}
                          className="text-red-600 shrink-0 mt-0.5"
                        />
                        <p className="text-xs text-red-700 font-medium">
                          Inativar encerra o vínculo e bloqueia o acesso.
                          Bloqueado se houver comissões pendentes.
                        </p>
                      </div>
                      <textarea
                        value={motivoInativarVend}
                        onChange={(e) => setMotivoInativarVend(e.target.value)}
                        placeholder="Motivo da inativação (mínimo 5 caracteres)..."
                        rows={3}
                        maxLength={500}
                        className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400/30 resize-none"
                      />
                      {erroInativarVend && (
                        <div className="flex items-start gap-2 text-xs text-red-700 bg-white border border-red-200 rounded-lg px-3 py-2">
                          <AlertCircle size={13} className="shrink-0 mt-0.5" />
                          {erroInativarVend}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setShowInativarVend(false);
                            setMotivoInativarVend('');
                            setErroInativarVend(null);
                          }}
                          disabled={inativandoVend}
                          className="flex-1 px-3 py-2 text-sm border rounded-lg hover:bg-white text-gray-600 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleInativarVend}
                          disabled={
                            inativandoVend ||
                            motivoInativarVend.trim().length < 5
                          }
                          className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {inativandoVend ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <UserX size={13} />
                          )}
                          {inativandoVend ? 'Inativando...' : 'Confirmar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(painel === 'leads' || painel === 'leads_mes') &&
                (painelLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
                  </div>
                ) : leadsDetalhe.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-12">
                    Nenhum lead encontrado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {leadsDetalhe.map((lead) => (
                      <div
                        key={lead.id}
                        className="border rounded-xl p-4 space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-900 text-sm">
                            {lead.razao_social ||
                              lead.contato_nome ||
                              `Lead #${lead.id}`}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${STATUS_LEAD_CLS[lead.status] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {lead.status}
                          </span>
                        </div>
                        {lead.cnpj && (
                          <p className="text-xs text-gray-400">
                            {fmtCnpj(lead.cnpj)}
                          </p>
                        )}
                        {lead.vendedor_nome && (
                          <p className="text-xs text-gray-500">
                            Vendedor: {lead.vendedor_nome}
                          </p>
                        )}
                        <p className="text-[10px] text-gray-400">
                          {new Date(lead.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}

              {painel === 'vinculos' &&
                (painelLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
                  </div>
                ) : vinculosDetalhe.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-12">
                    Nenhum vínculo encontrado.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {vinculosDetalhe.map((v) => (
                      <div
                        key={v.id}
                        className="border rounded-xl p-4 space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Building2
                              size={14}
                              className="text-gray-400 flex-shrink-0"
                            />
                            <p className="font-semibold text-gray-900 text-sm">
                              {v.entidade_nome || `Vínculo #${v.id}`}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${STATUS_VINCULO_CLS[v.status] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {v.status}
                          </span>
                        </div>
                        {v.entidade_cnpj && (
                          <p className="text-xs text-gray-400">
                            {fmtCnpj(v.entidade_cnpj)}
                          </p>
                        )}
                        {v.vendedor_nome && (
                          <p className="text-xs text-gray-500">
                            Vendedor: {v.vendedor_nome}
                          </p>
                        )}
                        {v.data_inicio && (
                          <p className="text-[10px] text-gray-400">
                            Início:{' '}
                            {new Date(v.data_inicio).toLocaleDateString(
                              'pt-BR'
                            )}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

              {painel === 'comissoes' &&
                (painelLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
                  </div>
                ) : comissoesDetalhe.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-12">
                    Nenhuma comissão pendente.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                        Total Pendente
                      </span>
                      <span className="text-base font-black text-amber-700">
                        {fmtBRL(comissoesTotal)}
                      </span>
                    </div>
                    {comissoesDetalhe.map((c) => (
                      <div
                        key={c.id}
                        className="border rounded-xl p-4 space-y-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-900 text-sm">
                            {c.entidade_nome || `Comissão #${c.id}`}
                          </p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${STATUS_COMISSAO_CLS[c.status] ?? 'bg-gray-100 text-gray-600'}`}
                          >
                            {c.status}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-amber-600">
                          {fmtBRL(c.valor_comissao)}
                        </p>
                        {c.mes_emissao && (
                          <p className="text-[10px] text-gray-400">
                            Emissão: {c.mes_emissao}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {showEdit && repFull && (
        <EditRepresentanteModal
          representante={repFull}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false);
            carregarDados();
            carregarRepFull();
          }}
        />
      )}

      {showComissao && repFull && (
        <AprovarComissaoModal
          repId={repFull.id}
          repNome={repFull.nome}
          modeloAtual={repFull.modelo_comissionamento ?? null}
          percentualAtual={repFull.percentual_comissao ?? null}
          percentualComercialAtual={
            repFull.percentual_comissao_comercial ?? null
          }
          walletIdAtual={repFull.asaas_wallet_id ?? null}
          valorCFEntidadeAtual={repFull.valor_custo_fixo_entidade ?? null}
          valorCFClinicaAtual={repFull.valor_custo_fixo_clinica ?? null}
          onClose={() => setShowComissao(false)}
          onSuccess={() => {
            setShowComissao(false);
            carregarDados();
            carregarRepFull();
          }}
        />
      )}
    </div>
  );
}
