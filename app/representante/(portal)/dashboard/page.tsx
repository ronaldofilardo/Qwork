'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { useRepresentante } from '../rep-context';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

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

interface VendedorPerf {
  id: number;
  nome: string;
  total_leads: number;
  leads_convertidos: number;
  volume_negociado: string;
  volume_convertido: string;
}

interface EvolucaoItem {
  mes: string;
  total: number;
  convertidos: number;
}

interface MetricasData {
  vendedores: VendedorPerf[];
  evolucao: EvolucaoItem[];
  resumo: {
    total_leads: string;
    total_convertidos: string;
    valor_total_negociado: string;
    vinculos_ativos: string;
  };
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

// ── Paleta de gráficos ──────────────────────────────────────────────────────
const CHART_COLORS = [
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#3b82f6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
];

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
const fmtMes = (ym: string) => {
  const [y, m] = ym.split('-');
  const meses = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  return `${meses[parseInt(m) - 1]}/${y.slice(2)}`;
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
  const [metricas, setMetricas] = useState<MetricasData | null>(null);
  const [loading, setLoading] = useState(true);

  // Drawer
  const [drawer, setDrawer] = useState<DrawerTipo>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [leadsEquipe, setLeadsEquipe] = useState<LeadsEquipe | null>(null);
  const [vinculos, setVinculos] = useState<VinculoItem[]>([]);
  const [copiado, setCopiado] = useState(false);

  const _chartRegistered = useRef(false);
  _chartRegistered.current = true;

  const load = useCallback(async () => {
    try {
      const [resumoRes, vendedoresRes, metricasRes] = await Promise.all([
        fetch('/api/representante/equipe/resumo'),
        fetch('/api/representante/equipe/vendedores?page=1'),
        fetch('/api/representante/metricas'),
      ]);
      if (resumoRes.ok) setResumo(await resumoRes.json());
      if (vendedoresRes.ok) {
        const d = await vendedoresRes.json();
        setVendedores(d.vendedores ?? []);
      }
      if (metricasRes.ok) setMetricas(await metricasRes.json());
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
        const res = await fetch(url);
        if (res.ok) setLeadsEquipe(await res.json());
      } else if (tipo === 'vinculos') {
        const res = await fetch('/api/representante/vinculos?status=ativo');
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

  const temEquipe = vendedores.length > 0;
  const evolucao = metricas?.evolucao ?? [];
  const vendPerf = metricas?.vendedores ?? [];

  const barLeadsVinculosData = {
    labels: ['Leads Ativos', 'Vínculos Ativos'],
    datasets: [
      {
        label: 'Total',
        data: [resumo?.leads_ativos ?? 0, resumo?.vinculos_ativos ?? 0],
        backgroundColor: ['#6366f1', '#10b981'],
        borderRadius: 6,
      },
    ],
  };

  const doughnutStatusData = {
    labels: ['Leads Ativos', 'Vínculos Ativos', 'Leads Este Mês'],
    datasets: [
      {
        data: [
          resumo?.leads_ativos ?? 0,
          resumo?.vinculos_ativos ?? 0,
          resumo?.leads_mes ?? 0,
        ],
        backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const lineEvolucaoData = {
    labels: evolucao.map((e) => fmtMes(e.mes)),
    datasets: [
      {
        label: 'Total',
        data: evolucao.map((e) => Number(e.total)),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
      },
      {
        label: 'Convertidos',
        data: evolucao.map((e) => Number(e.convertidos)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 3,
      },
    ],
  };

  const barVendedoresData =
    temEquipe && vendPerf.length > 0
      ? {
          labels: vendPerf.map((v) => v.nome.split(' ')[0]),
          datasets: [
            {
              label: 'Leads Totais',
              data: vendPerf.map((v) => Number(v.total_leads)),
              backgroundColor: CHART_COLORS.slice(0, vendPerf.length).map(
                (c) => c + 'cc'
              ),
              borderRadius: 5,
            },
            {
              label: 'Convertidos',
              data: vendPerf.map((v) => Number(v.leads_convertidos)),
              backgroundColor: '#10b981cc',
              borderRadius: 5,
            },
          ],
        }
      : null;

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } } },
    },
  };

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { font: { size: 11 }, padding: 12, boxWidth: 10 },
      },
    },
    cutout: '65%',
  };

  const lineOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { font: { size: 10 }, padding: 8, boxWidth: 8 },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 10 } } },
    },
  };

  const DRAWER_TITLE: Record<NonNullable<DrawerTipo>, string> = {
    vendedores: 'Vendedores na Equipe',
    leads: 'Leads Ativos',
    vinculos: 'Vínculos Ativos',
    leads_mes: 'Leads Este Mês',
  };

  const handleCopiarCodigo = async (): Promise<void> => {
    const codigo = session?.codigo ?? '';
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
              Seu código no sistema
            </p>
            <p className="font-mono font-bold text-blue-700 text-lg leading-tight">
              {session?.codigo ?? '—'}
            </p>
          </div>
        </div>
        <button
          onClick={handleCopiarCodigo}
          aria-label="Copiar código"
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

      {/* Seção de gráficos */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">
          Produtividade
        </h3>

        {temEquipe ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Leads × Vínculos
              </p>
              <div className="h-44">
                <Bar data={barLeadsVinculosData} options={chartOpts} />
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Visão Geral
              </p>
              <div className="h-44">
                <Doughnut data={doughnutStatusData} options={doughnutOpts} />
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Evolução de Leads
              </p>
              <div className="h-44">
                {evolucao.length > 0 ? (
                  <Line data={lineEvolucaoData} options={lineOpts} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                    Sem dados históricos
                  </div>
                )}
              </div>
            </div>

            {barVendedoresData && (
              <div className="bg-white rounded-xl border p-5 md:col-span-2 xl:col-span-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Leads por Vendedor
                  <span className="ml-2 normal-case font-normal text-gray-400">
                    (total vs convertidos)
                  </span>
                </p>
                <div className="h-48">
                  <Bar
                    data={barVendedoresData}
                    options={{
                      ...chartOpts,
                      plugins: {
                        ...chartOpts.plugins,
                        legend: {
                          display: true,
                          position: 'top' as const,
                          labels: {
                            font: { size: 10 },
                            padding: 8,
                            boxWidth: 10,
                          },
                        },
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Evolução dos Meus Leads
              </p>
              <div className="h-52">
                {evolucao.length > 0 ? (
                  <Line data={lineEvolucaoData} options={lineOpts} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2">
                    <TrendingUp size={28} />
                    <span className="text-sm">Sem dados ainda</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Distribuição (Leads × Vínculos)
              </p>
              <div className="h-52">
                <Doughnut data={doughnutStatusData} options={doughnutOpts} />
              </div>
            </div>

            <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-center">
              <Users2 size={28} className="mx-auto text-yellow-400 mb-2" />
              <p className="text-sm font-semibold text-yellow-700">
                Adicione vendedores para ver gráficos de produtividade da
                equipe.
              </p>
              <Link
                href="/representante/equipe"
                className="mt-3 inline-block text-sm text-blue-600 hover:underline"
              >
                Gerenciar Equipe →
              </Link>
            </div>
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
