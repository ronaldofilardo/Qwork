'use client';

import { useEffect, useState, useCallback } from 'react';
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

interface VendedorPerf {
  id: number;
  nome: string;
  email: string;
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

interface ResumoKPI {
  total_leads: string;
  total_convertidos: string;
  valor_total_negociado: string;
  vinculos_ativos: string;
}

const CHART_COLORS = [
  '#6366f1',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
];

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

export default function MetricasRepresentante() {
  const [data, setData] = useState<{
    vendedores: VendedorPerf[];
    evolucao: EvolucaoItem[];
    resumo: ResumoKPI;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/representante/metricas', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const fmt = (v: string | number) =>
    `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  if (!data)
    return (
      <div className="p-8 text-center text-red-500">Erro ao carregar dados</div>
    );

  const { vendedores, evolucao, resumo } = data;
  const temEquipe = vendedores.length > 0;

  const taxaConversao =
    parseInt(resumo.total_leads) > 0
      ? (
          (parseInt(resumo.total_convertidos) / parseInt(resumo.total_leads)) *
          100
        ).toFixed(1)
      : '0';

  // ── Dados dos gráficos ──────────────────────────────────────────────────
  const barGroupedData = {
    labels: vendedores.map((v) => v.nome.split(' ')[0]),
    datasets: [
      {
        label: 'Leads Totais',
        data: vendedores.map((v) => Number(v.total_leads)),
        backgroundColor: CHART_COLORS.slice(0, vendedores.length).map(
          (c) => c + 'dd'
        ),
        borderRadius: 5,
      },
      {
        label: 'Convertidos',
        data: vendedores.map((v) => Number(v.leads_convertidos)),
        backgroundColor: '#10b981bb',
        borderRadius: 5,
      },
    ],
  };

  const lineData = {
    labels: evolucao.map((e) => fmtMes(e.mes)),
    datasets: [
      {
        label: 'Total',
        data: evolucao.map((e) => Number(e.total)),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
      },
      {
        label: 'Convertidos',
        data: evolucao.map((e) => Number(e.convertidos)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
      },
    ],
  };

  const taxaData = {
    labels: vendedores.map((v) => v.nome.split(' ')[0]),
    datasets: [
      {
        label: 'Taxa de Conversão (%)',
        data: vendedores.map((v) => {
          const tot = Number(v.total_leads);
          return tot > 0
            ? Math.round((Number(v.leads_convertidos) / tot) * 100)
            : 0;
        }),
        backgroundColor: CHART_COLORS.slice(0, vendedores.length).map(
          (c) => c + 'cc'
        ),
        borderRadius: 5,
      },
    ],
  };

  const volumeData = {
    labels: vendedores.map((v) => v.nome.split(' ')[0]),
    datasets: [
      {
        data: vendedores.map((v) => parseFloat(v.volume_convertido || '0')),
        backgroundColor: CHART_COLORS.slice(0, vendedores.length),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: { font: { size: 10 }, padding: 8, boxWidth: 10 },
      },
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
        labels: { font: { size: 11 }, padding: 10, boxWidth: 10 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: number; label: string }) =>
            ` ${ctx.label}: ${fmt(ctx.parsed)}`,
        },
      },
    },
    cutout: '60%',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Métricas da Equipe</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total de Leads',
            val: resumo.total_leads,
            cor: 'text-gray-900',
          },
          {
            label: 'Conversões',
            val: resumo.total_convertidos,
            cor: 'text-green-700',
          },
          {
            label: 'Volume Negociado',
            val: fmt(resumo.valor_total_negociado),
            cor: 'text-blue-700',
          },
          {
            label: 'Taxa de Conversão',
            val: `${taxaConversao}%`,
            cor: 'text-purple-700',
          },
        ].map((k) => (
          <div key={k.label} className="bg-white p-4 rounded-xl border">
            <p className="text-xs text-gray-400 uppercase font-medium">
              {k.label}
            </p>
            <p className={`text-xl font-bold mt-1 ${k.cor}`}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* Evolução de leads — sempre mostrar */}
      <div className="bg-white rounded-xl border p-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Evolução de Leads — Últimos 6 Meses
        </p>
        <div className="h-56">
          {evolucao.length > 0 ? (
            <Line data={lineData} options={baseOpts} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300 text-sm">
              Sem dados históricos ainda
            </div>
          )}
        </div>
      </div>

      {temEquipe ? (
        <>
          {/* Leads por vendedor */}
          <div className="bg-white rounded-xl border p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Leads por Vendedor
              <span className="ml-2 normal-case font-normal">
                (totais vs convertidos)
              </span>
            </p>
            <div className="h-56">
              <Bar data={barGroupedData} options={baseOpts} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Taxa de conversão por vendedor */}
            <div className="bg-white rounded-xl border p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Taxa de Conversão por Vendedor (%)
              </p>
              <div className="h-52">
                <Bar
                  data={taxaData}
                  options={{
                    ...baseOpts,
                    indexAxis: 'y' as const,
                    plugins: {
                      ...baseOpts.plugins,
                      legend: { display: false },
                    },
                    scales: {
                      x: {
                        min: 0,
                        max: 100,
                        grid: { color: '#f3f4f6' },
                        ticks: {
                          font: { size: 10 },
                          callback: (v: number | string) => `${v}%`,
                        },
                      },
                      y: {
                        grid: { display: false },
                        ticks: { font: { size: 11 } },
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Volume negociado por vendedor */}
            <div className="bg-white rounded-xl border p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Volume Convertido por Vendedor
              </p>
              <div className="h-52">
                {vendedores.some((v) => parseFloat(v.volume_convertido) > 0) ? (
                  <Doughnut data={volumeData} options={doughnutOpts} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                    Nenhuma conversão registrada
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-sm font-semibold text-yellow-700">
            Adicione vendedores à sua equipe para ver gráficos comparativos de
            performance.
          </p>
        </div>
      )}
    </div>
  );
}
