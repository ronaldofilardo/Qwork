'use client';

import { useEffect, useState, useCallback } from 'react';
import { CalendarClock } from 'lucide-react';

interface ParcelaAVencer {
  pagamento_id: number;
  entidade_nome: string;
  entidade_cnpj: string;
  lote_id: number | null;
  valor_total: number;
  valor_parcela: number;
  parcela_numero: number;
  total_parcelas: number;
  data_vencimento: string;
  metodo: string | null;
  vencida: boolean;
  dias_para_vencimento: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateString: string) {
  return new Date(dateString + 'T12:00:00').toLocaleDateString('pt-BR');
}

export function ParcelasAVencer() {
  const [parcelas, setParcelas] = useState<ParcelaAVencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/admin/parcelas-a-vencer');
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setErro(errData.error || `Erro ${res.status}`);
        return;
      }
      const data = await res.json();
      setParcelas(data.parcelas ?? []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha de rede');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
        {erro}
      </div>
    );
  }

  if (parcelas.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <CalendarClock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma parcela a vencer
        </h3>
        <p className="text-gray-600">
          Não há parcelas pendentes de pagamentos parcelados.
        </p>
      </div>
    );
  }

  // Resumo
  const totalVencidas = parcelas.filter((p) => p.vencida).length;
  const totalProximas = parcelas.filter(
    (p) => !p.vencida && p.dias_para_vencimento <= 7
  ).length;
  const valorTotalPendente = parcelas.reduce(
    (sum, p) => sum + p.valor_parcela,
    0
  );

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(valorTotalPendente)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Total pendente</div>
        </div>
        {totalVencidas > 0 && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <div className="text-2xl font-bold text-red-700">
              {totalVencidas}
            </div>
            <div className="text-xs text-red-600 mt-1">Vencidas</div>
          </div>
        )}
        {totalProximas > 0 && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="text-2xl font-bold text-amber-700">
              {totalProximas}
            </div>
            <div className="text-xs text-amber-600 mt-1">Vencem em 7 dias</div>
          </div>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-3 py-3 text-left">Cliente</th>
              <th className="px-3 py-3 text-left">Lote</th>
              <th className="px-3 py-3 text-right">Valor Total</th>
              <th className="px-3 py-3 text-right">Valor Parcela</th>
              <th className="px-3 py-3 text-center">Nº Parcela</th>
              <th className="px-3 py-3 text-left">Vencimento</th>
              <th className="px-3 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {parcelas.map((p) => {
              const statusColor = p.vencida
                ? 'bg-red-100 text-red-700'
                : p.dias_para_vencimento <= 7
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600';

              const statusLabel = p.vencida
                ? `Vencida (${Math.abs(p.dias_para_vencimento)}d)`
                : p.dias_para_vencimento === 0
                  ? 'Vence hoje'
                  : p.dias_para_vencimento <= 7
                    ? `${p.dias_para_vencimento}d`
                    : `${p.dias_para_vencimento}d`;

              return (
                <tr
                  key={`${p.pagamento_id}-${p.parcela_numero}`}
                  className="hover:bg-gray-50"
                >
                  <td className="px-3 py-3">
                    <div className="font-medium text-gray-900">
                      {p.entidade_nome}
                    </div>
                    {p.entidade_cnpj && (
                      <div className="text-xs text-gray-400 font-mono">
                        {p.entidade_cnpj.replace(
                          /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
                          '$1.$2.$3/$4-$5'
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-500 font-mono text-xs">
                    {p.lote_id ? `Lote #${p.lote_id}` : '—'}
                  </td>
                  <td className="px-3 py-3 text-right text-gray-700">
                    {formatCurrency(p.valor_total)}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(p.valor_parcela)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-xs">
                      {p.parcela_numero}/{p.total_parcelas}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-gray-700 text-xs">
                    {formatDate(p.data_vencimento)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
