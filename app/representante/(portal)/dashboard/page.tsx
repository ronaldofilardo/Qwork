'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users2,
  TrendingUp,
  Target,
  Link2,
  X,
  Building2,
  UserCircle2,
  Copy,
  Check,
  DollarSign,
  Percent,
  BadgeCheck,
} from 'lucide-react';
import { useRepresentante } from '../rep-context';

// ── Tipos ──────────────────────────────────────────────────────────────────
interface Resumo {
  total_vendedores: number;
  leads_ativos: number;
  leads_mes: number;
  vinculos_ativos: number;
}

interface Vendedor {
  vinculo_id: number;
  vendedor_id: number;
  vendedor_nome: string;
  vendedor_email: string;
  vendedor_cpf?: string;
  leads_ativos: number;
  vinculado_em: string;
}

interface LeadItem {
  id: number;
  cnpj: string | null;
  razao_social: string | null;
  contato_nome: string | null;
  status: string;
  criado_em: string;
  data_expiracao: string | null;
  vendedor_id: number | null;
  vendedor_nome: string | null;
}

interface LeadsEquipe {
  por_vendedor: {
    vendedor_id: number;
    vendedor_nome: string;
    leads: LeadItem[];
  }[];
  diretos: LeadItem[];
  total: number;
}

interface VinculoItem {
  id: number;
  status: string;
  data_inicio: string | null;
  data_expiracao: string | null;
  entidade_nome: string | null;
  entidade_cnpj: string | null;
  dias_para_expirar: number | null;
}

type DrawerTipo = 'vendedores' | 'leads' | 'vinculos' | 'leads_mes' | null;

// ── Mapa de cores de status ─────────────────────────────────────────────────
const STATUS_LEAD_CLS: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-700',
  ativo: 'bg-green-100 text-green-700',
  convertido: 'bg-blue-100 text-blue-700',
  perdido: 'bg-red-100 text-red-700',
  expirado: 'bg-gray-100 text-gray-500',
};

const STATUS_VINCULO_CLS: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-500',
  suspenso: 'bg-red-100 text-red-700',
  encerrado: 'bg-gray-100 text-gray-400',
};

// Preço base QWork por laudo (por tipo de tomador)
const PRECO_BASE_CLINICA = 5;
const PRECO_BASE_ENTIDADE = 12;

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ── Auxiliares ──────────────────────────────────────────────────────────────
const fmtCpf = (v?: string | null) => {
  if (!v) return '—';
  const d = v.replace(/\D/g, '');
  return d.length === 11
    ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : v;
};
const fmtCnpj = (v?: string | null) => {
  if (!v) return '—';
  const d = v.replace(/\D/g, '');
  return d.length === 14
    ? d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    : v;
};

// ── Componente KPICard ──────────────────────────────────────────────────────
interface KPICardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  iconBg: string;
  onClick?: () => void;
}
const KPICard = ({
  icon,
  label,
  value,
  sub,
  iconBg,
  onClick,
}: KPICardProps) => (
  <div
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm border p-5 transition-all${
      onClick
        ? ' cursor-pointer hover:border-indigo-200 hover:shadow-md active:scale-[0.98]'
        : ''
    }`}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
      <span className="text-sm font-medium text-gray-500">{label}</span>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-400 mt-1">{sub}</p>
  </div>
);

// ── Componente principal ────────────────────────────────────────────────────
export default function DashboardRepresentante() {
  const { session } = useRepresentante();
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer
  const [drawer, setDrawer] = useState<DrawerTipo>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [leadsEquipe, setLeadsEquipe] = useState<LeadsEquipe | null>(null);
  const [vinculos, setVinculos] = useState<VinculoItem[]>([]);
  const [copiado, setCopiado] = useState(false);

  const load = useCallback(async () => {
    try {
      const [resumoRes, vendedoresRes] = await Promise.all([
        fetch('/api/representante/equipe/resumo'),
        fetch('/api/representante/equipe/vendedores?page=1'),
      ]);
      if (resumoRes.ok) setResumo(await resumoRes.json());
      if (vendedoresRes.ok) {
        const d = await vendedoresRes.json();
        setVendedores(d.vendedores ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const abrirDrawer = useCallback(async (tipo: DrawerTipo) => {
    if (!tipo) return;
    setDrawer(tipo);
    if (tipo === 'vendedores') return;

    setDrawerLoading(true);
    try {
      if (tipo === 'leads' || tipo === 'leads_mes') {
        const url =
          tipo === 'leads_mes'
            ? '/api/representante/equipe/leads?mes=true'
            : '/api/representante/equipe/leads';
        const res = await fetch(url, {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (res.ok) setLeadsEquipe(await res.json());
      } else if (tipo === 'vinculos') {
        const res = await fetch('/api/representante/vinculos?status=ativo', {
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (res.ok) {
          const d = await res.json();
          setVinculos(d.vinculos ?? []);
        }
      }
    } catch {
      // silently ignore
    } finally {
      setDrawerLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const DRAWER_TITLE: Record<NonNullable<DrawerTipo>, string> = {
    vendedores: 'Vendedores na Equipe',
    leads: 'Leads Ativos',
    vinculos: 'Vínculos Ativos',
    leads_mes: 'Leads Este Mês',
  };

  const handleCopiarCodigo = async (): Promise<void> => {
    const codigo = String(session?.id ?? '');
    try {
      await navigator.clipboard.writeText(codigo);
    } catch {
      const el = document.createElement('textarea');
      el.value = codigo;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Boas-vindas */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Olá, {session?.nome?.split(' ')[0]}!
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Aqui está um resumo da sua equipe de vendedores.
        </p>
      </div>

      {/* Banner do código */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <UserCircle2 size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
              Seu ID no sistema
            </p>
            <p className="font-mono font-bold text-blue-700 text-lg leading-tight">
              {session?.id ?? '—'}
            </p>
          </div>
        </div>
        <button
          onClick={handleCopiarCodigo}
          aria-label="Copiar ID"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {copiado ? (
            <>
              <Check size={15} />
              <span>Copiado!</span>
            </>
          ) : (
            <>
              <Copy size={15} />
              <span>Copiar</span>
            </>
          )}
        </button>
      </div>

      {/* KPI cards clicáveis */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KPICard
          icon={<Users2 size={20} className="text-blue-600" />}
          iconBg="bg-blue-50"
          label="Vendedores na Equipe"
          value={resumo?.total_vendedores ?? 0}
          sub="Ativos e vinculados"
          onClick={() => abrirDrawer('vendedores')}
        />
        <KPICard
          icon={<Target size={20} className="text-green-600" />}
          iconBg="bg-green-50"
          label="Leads Ativos"
          value={resumo?.leads_ativos ?? 0}
          sub="Em aberto pela equipe"
          onClick={() => abrirDrawer('leads')}
        />
        <KPICard
          icon={<Link2 size={20} className="text-indigo-600" />}
          iconBg="bg-indigo-50"
          label="Vínculos Ativos"
          value={resumo?.vinculos_ativos ?? 0}
          sub="Contratos vigentes"
          onClick={() => abrirDrawer('vinculos')}
        />
        <KPICard
          icon={<TrendingUp size={20} className="text-purple-600" />}
          iconBg="bg-purple-50"
          label="Leads Este Mês"
          value={resumo?.leads_mes ?? 0}
          sub="Cadastrados no mês atual"
          onClick={() => abrirDrawer('leads_mes')}
        />
      </div>

      {/* Seção de comissionamento */}
      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BadgeCheck size={18} className="text-purple-600" />
          <h3 className="text-sm font-bold text-gray-900">
            Meu Comissionamento
          </h3>
        </div>

        {session?.modelo_comissionamento ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Modelo */}
            <div className="bg-gray-50 rounded-xl p-3 border">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                Modelo
              </p>
              <div className="flex items-center gap-2">
                {session.modelo_comissionamento === 'percentual' ? (
                  <Percent size={16} className="text-green-600" />
                ) : (
                  <DollarSign size={16} className="text-blue-600" />
                )}
                <p className="font-bold text-gray-900">
                  {session.modelo_comissionamento === 'percentual'
                    ? 'Percentual'
                    : 'Custo Fixo'}
                </p>
              </div>
            </div>

            {/* Percentual */}
            {session.modelo_comissionamento === 'percentual' && (
              <>
                {session.percentual_comissao != null && (
                  <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                      Minha Comissão
                    </p>
                    <p className="font-black text-green-700 text-lg">
                      {session.percentual_comissao}
                      <span className="text-sm font-bold ml-0.5">%</span>
                    </p>
                  </div>
                )}
                {session.percentual_comissao_comercial != null && (
                  <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                      % Comercial
                    </p>
                    <p className="font-black text-purple-700 text-lg">
                      {session.percentual_comissao_comercial}
                      <span className="text-sm font-bold ml-0.5">%</span>
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Custo fixo: Comissão Comercial ao lado do Modelo, depois Clínica | Entidade */}
            {session.modelo_comissionamento === 'custo_fixo' && (
              <>
                {session.percentual_comissao_comercial != null && (
                  <div className="bg-purple-50 rounded-xl p-3 border border-purple-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                      % Comercial
                    </p>
                    <p className="font-black text-purple-700 text-lg">
                      {Number(session.percentual_comissao_comercial).toFixed(2)}
                      <span className="text-sm font-bold ml-0.5">%</span>
                    </p>
                  </div>
                )}
                {session.valor_custo_fixo_clinica != null && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                      Custo Fixo — Clínica
                    </p>
                    <p className="font-black text-blue-700 text-lg">
                      {fmtBRL(Number(session.valor_custo_fixo_clinica))}
                    </p>
                  </div>
                )}
                {session.valor_custo_fixo_entidade != null && (
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                      Custo Fixo — Entidade
                    </p>
                    <p className="font-black text-blue-700 text-lg">
                      {fmtBRL(Number(session.valor_custo_fixo_entidade))}
                    </p>
                  </div>
                )}
                {/* Valor mínimo de venda */}
                {(session.valor_custo_fixo_clinica != null ||
                  session.valor_custo_fixo_entidade != null) && (
                  <div className="sm:col-span-2 bg-gray-900 rounded-xl p-4 border border-gray-800">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Valor mínimo de venda (por avaliação)
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {session.valor_custo_fixo_clinica != null && (
                        <div className="bg-gray-800 rounded-lg px-4 py-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                            Clínica
                          </p>
                          <p className="text-xs text-gray-400 mb-0.5">
                            {fmtBRL(PRECO_BASE_CLINICA)}
                            {' + '}
                            {fmtBRL(Number(session.valor_custo_fixo_clinica))}
                            {' ='}
                          </p>
                          <p className="text-lg font-black text-white">
                            {fmtBRL(
                              PRECO_BASE_CLINICA +
                                Number(session.valor_custo_fixo_clinica)
                            )}
                          </p>
                        </div>
                      )}
                      {session.valor_custo_fixo_entidade != null && (
                        <div className="bg-gray-800 rounded-lg px-4 py-3">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                            Entidade
                          </p>
                          <p className="text-xs text-gray-400 mb-0.5">
                            {fmtBRL(PRECO_BASE_ENTIDADE)}
                            {' + '}
                            {fmtBRL(Number(session.valor_custo_fixo_entidade))}
                            {' ='}
                          </p>
                          <p className="text-lg font-black text-white">
                            {fmtBRL(
                              PRECO_BASE_ENTIDADE +
                                Number(session.valor_custo_fixo_entidade)
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-[10px] text-gray-500">
                      Base QWork + seu custo fixo
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Percent size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">
              Modelo de comissionamento não definido ainda.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Entre em contato com o comercial para configurar.
            </p>
          </div>
        )}
      </div>

      {/* Drawer lateral */}
      {drawer && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setDrawer(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-900">
                {DRAWER_TITLE[drawer]}
              </h3>
              <button
                onClick={() => setDrawer(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {drawer === 'vendedores' &&
                (vendedores.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-12">
                    Nenhum vendedor na equipe.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {vendedores.map((v) => (
                      <div key={v.vinculo_id} className="border rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                            {v.vendedor_nome[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 text-sm truncate">
                              {v.vendedor_nome}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {v.vendedor_email}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-400 block">CPF</span>
                            <span className="font-mono font-medium text-gray-700">
                              {fmtCpf(v.vendedor_cpf)}
                            </span>
                          </div>
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <span className="text-gray-400 block">
                              Leads Ativos
                            </span>
                            <span className="font-bold text-indigo-700">
                              {v.leads_ativos}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {(drawer === 'leads' || drawer === 'leads_mes') &&
                (drawerLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent" />
                  </div>
                ) : !leadsEquipe || leadsEquipe.total === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-12">
                    Nenhum lead encontrado.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {leadsEquipe.por_vendedor.map((grupo) => (
                      <div key={grupo.vendedor_id}>
                        <div className="flex items-center gap-2 mb-2">
                          <UserCircle2 size={14} className="text-indigo-500" />
                          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                            {grupo.vendedor_nome}
                          </span>
                          <span className="ml-auto text-[10px] text-gray-400">
                            {grupo.leads.length} lead
                            {grupo.leads.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {grupo.leads.map((lead) => (
                            // eslint-disable-next-line @typescript-eslint/no-use-before-define
                            <LeadCard key={lead.id} lead={lead} />
                          ))}
                        </div>
                      </div>
                    ))}

                    {leadsEquipe.diretos.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target size={14} className="text-green-600" />
                          <span className="text-xs font-bold text-green-700 uppercase tracking-wider">
                            Diretos (sem vendedor)
                          </span>
                          <span className="ml-auto text-[10px] text-gray-400">
                            {leadsEquipe.diretos.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {leadsEquipe.diretos.map((lead) => (
                            // eslint-disable-next-line @typescript-eslint/no-use-before-define
                            <LeadCard key={lead.id} lead={lead} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {drawer === 'vinculos' &&
                (drawerLoading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent" />
                  </div>
                ) : vinculos.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-12">
                    Nenhum vínculo ativo.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {vinculos.map((v) => (
                      <div
                        key={v.id}
                        className="border rounded-xl p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Building2
                              size={14}
                              className="text-gray-400 flex-shrink-0"
                            />
                            <p className="font-semibold text-gray-900 text-sm">
                              {v.entidade_nome ?? `Vínculo #${v.id}`}
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
                        {v.data_expiracao && (
                          <p
                            className={`text-[10px] font-medium ${
                              (v.dias_para_expirar ?? 99) <= 30
                                ? 'text-red-500'
                                : 'text-gray-400'
                            }`}
                          >
                            Expira:{' '}
                            {new Date(v.data_expiracao).toLocaleDateString(
                              'pt-BR'
                            )}
                            {(v.dias_para_expirar ?? 99) <= 30 && (
                              <span className="ml-1 text-orange-500 font-bold">
                                ({v.dias_para_expirar}d)
                              </span>
                            )}
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
    </div>
  );
}

// ── Card de lead inline ──────────────────────────────────────────────────────
function LeadCard({ lead }: { lead: LeadItem }) {
  return (
    <div className="border rounded-lg p-3 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 leading-tight">
          {lead.razao_social || lead.contato_nome || `Lead #${lead.id}`}
        </p>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${STATUS_LEAD_CLS[lead.status] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {lead.status}
        </span>
      </div>
      {lead.cnpj && <p className="text-[11px] text-gray-400">{lead.cnpj}</p>}
      <p className="text-[10px] text-gray-400">
        {new Date(lead.criado_em).toLocaleDateString('pt-BR')}
      </p>
    </div>
  );
}
