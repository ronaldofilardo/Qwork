'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  Comissao,
  Resumo,
} from '@/app/representante/(portal)/comissoes/types';
import {
  fmt,
  STATUS_BADGE,
} from '@/app/representante/(portal)/comissoes/types';
import ComissoesTable from '@/app/representante/(portal)/comissoes/components/ComissoesTable';

export default function MinhasVendasComissoesPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (statusFiltro) params.set('status', statusFiltro);
      const res = await fetch(
        `/api/representante/minhas-vendas/comissoes?${params.toString()}`
      );
      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErro(
          `Erro ao carregar comissões (${res.status}): ${errData.error ?? res.statusText}`
        );
        return;
      }
      const data = (await res.json()) as {
        comissoes?: Comissao[];
        resumo?: Resumo;
        total?: number;
      };
      setComissoes(data.comissoes ?? []);
      setResumo(data.resumo ?? null);
      setTotal(data.total ?? 0);
    } catch (e) {
      setErro(
        `Falha de rede ao carregar comissões: ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setLoading(false);
    }
  }, [page, statusFiltro]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Comissões — Vendas Diretas
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Comissões geradas a partir dos seus leads diretos (sem intermediação
          de vendedores).
        </p>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {resumo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              label: 'A Receber',
              value: fmt(resumo.valor_pendente),
              icon: '⏳',
              cor: 'text-blue-700',
              bg: 'bg-blue-50',
              borderCor: 'border-blue-200',
              title: 'Parcelas pagas aguardando consolidação em ciclo',
            },
            {
              label: 'Liberado',
              value: fmt(resumo.valor_liberado),
              icon: '🟢',
              cor: 'text-purple-700',
              bg: 'bg-purple-50',
              borderCor: 'border-purple-200',
              title: 'NF do ciclo aprovada, aguardando pagamento no dia 15',
            },
            {
              label: 'Total Pago',
              value: fmt(resumo.valor_pago_total),
              icon: '✅',
              cor: 'text-green-700',
              bg: 'bg-green-50',
              borderCor: 'border-green-200',
              title: 'Valor histórico de comissões pagas',
            },
          ].map((c) => (
            <div
              key={c.label}
              className={`${c.bg} ${c.borderCor} rounded-2xl border-2 p-6 shadow-sm hover:shadow-md transition-shadow duration-200`}
              title={c.title}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-gray-600 text-sm font-semibold mb-3 tracking-wide">
                    {c.label}
                  </div>
                  <div className={`text-3xl font-bold ${c.cor}`}>{c.value}</div>
                </div>
                <span className="text-4xl ml-3">{c.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          Pipeline de Pagamento
        </h2>
        <div className="flex items-center gap-1 flex-wrap">
          {['retida', 'pendente_consolidacao', 'liberada', 'paga'].map(
            (s, i, arr) => (
              <div key={s} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setStatusFiltro(statusFiltro === s ? '' : s);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${STATUS_BADGE[s]?.cor ?? 'bg-gray-100 text-gray-600'} ${statusFiltro === s ? 'ring-2 ring-offset-1 ring-blue-400' : 'opacity-70 hover:opacity-100'}`}
                >
                  {STATUS_BADGE[s]?.label}
                </button>
                {i < arr.length - 1 && (
                  <span className="text-gray-300 text-xs">→</span>
                )}
              </div>
            )
          )}
          <span className="text-gray-200 mx-2">|</span>
          {[
            'congelada_rep_suspenso',
            'congelada_aguardando_admin',
            'cancelada',
          ].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFiltro(statusFiltro === s ? '' : s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${STATUS_BADGE[s]?.cor ?? 'bg-gray-100 text-gray-600'} ${statusFiltro === s ? 'ring-2 ring-offset-1 ring-blue-400' : 'opacity-70 hover:opacity-100'}`}
            >
              {STATUS_BADGE[s]?.label}
            </button>
          ))}
          {statusFiltro && (
            <button
              onClick={() => setStatusFiltro('')}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Limpar filtro
            </button>
          )}
        </div>
      </div>

      <ComissoesTable
        comissoes={comissoes}
        total={total}
        page={page}
        setPage={setPage}
        loading={loading}
      />
    </div>
  );
}
