'use client';

import { useEffect, useState, useCallback } from 'react';
import { DollarSign } from 'lucide-react';

interface Comissao {
  id: number;
  representante_nome: string;
  mes_emissao: string;
  valor_comissao: number;
  valor_laudo: number;
  status: string;
  data_emissao_laudo: string | null;
}

interface PagamentosResponse {
  pagamentos: Comissao[];
  total: number;
  totais: { total_pago: number; total_pendente: number };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  paga: { label: 'Paga', color: 'bg-green-100 text-green-700' },
  liberada: { label: 'Liberada', color: 'bg-blue-100 text-blue-700' },
  pendente_nf: { label: 'Pendente NF', color: 'bg-amber-100 text-amber-700' },
  nf_enviada: { label: 'NF Enviada', color: 'bg-cyan-100 text-cyan-700' },
  nf_aprovada: { label: 'NF Aprovada', color: 'bg-indigo-100 text-indigo-700' },
  congelada: { label: 'Congelada', color: 'bg-gray-100 text-gray-700' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
};

export default function VendedorComissoesPage() {
  const [data, setData] = useState<PagamentosResponse>({
    pagamentos: [],
    total: 0,
    totais: { total_pago: 0, total_pendente: 0 },
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/vendedor/relatorios/pagamentos');
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Comissões</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Histórico e pipeline de pagamentos
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-700">
              A Receber
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-900">
            {fmtBRL(data.totais.total_pendente)}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-green-600" />
            <span className="text-sm font-semibold text-green-700">
              Total Recebido
            </span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {fmtBRL(data.totais.total_pago)}
          </p>
        </div>
      </div>

      {data.pagamentos.length === 0 ? (
        <div className="bg-gray-50 border border-dashed rounded-xl p-12 text-center">
          <DollarSign size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            Nenhuma comissão registrada ainda.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Representante</th>
                <th className="px-4 py-3 text-left">Mês</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Valor Laudo</th>
                <th className="px-4 py-3 text-right">Comissão</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.pagamentos.map((c) => {
                const badge = STATUS_LABELS[c.status] ?? {
                  label: c.status,
                  color: 'bg-gray-100 text-gray-700',
                };
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {c.representante_nome}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.mes_emissao}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {fmtBRL(c.valor_laudo)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">
                      {fmtBRL(c.valor_comissao)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
