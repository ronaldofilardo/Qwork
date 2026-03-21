'use client';

import { useEffect, useState, useCallback } from 'react';

interface VendedorPerf {
  id: number;
  nome: string;
  email: string;
  total_leads: number;
  leads_convertidos: number;
  volume_negociado: string;
  volume_convertido: string;
}

interface ResumoKPI {
  total_leads: string;
  total_convertidos: string;
  valor_total_negociado: string;
  vinculos_ativos: string;
}

export default function MetricasRepresentante() {
  const [data, setData] = useState<{
    vendedores: VendedorPerf[];
    resumo: ResumoKPI;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/representante/metricas');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
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
      <div className="p-8 text-center animate-pulse">
        Carregando métricas...
      </div>
    );
  if (!data)
    return (
      <div className="p-8 text-center text-red-500">Erro ao carregar dados</div>
    );

  const taxaConversao =
    data.resumo.total_leads !== '0'
      ? (
          (parseInt(data.resumo.total_convertidos) /
            parseInt(data.resumo.total_leads)) *
          100
        ).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Métricas da Equipe</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total de Leads',
            val: data.resumo.total_leads,
            cor: 'text-gray-900',
          },
          {
            label: 'Conversões',
            val: data.resumo.total_convertidos,
            cor: 'text-green-700',
          },
          {
            label: 'Volume Negociado',
            val: fmt(data.resumo.valor_total_negociado),
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

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">
            Performance por Vendedor
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-[10px]">
              <tr>
                <th className="px-6 py-3">Vendedor</th>
                <th className="px-6 py-3 text-center">Leads Totais</th>
                <th className="px-6 py-3 text-center">Convertidos</th>
                <th className="px-6 py-3 text-right">Volume Convertido</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.vendedores.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{v.nome}</p>
                    <p className="text-xs text-gray-400">{v.email}</p>
                  </td>
                  <td className="px-6 py-4 text-center font-medium bg-gray-50/50">
                    {v.total_leads}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full font-bold">
                      {v.leads_convertidos}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    {fmt(v.volume_convertido)}
                  </td>
                </tr>
              ))}
              {data.vendedores.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    Nenhum vendedor vinculado à sua equipe
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
