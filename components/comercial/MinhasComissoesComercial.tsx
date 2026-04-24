'use client';

import { useCallback, useEffect, useState } from 'react';
import { TrendingUp, DollarSign, FileText, Loader2 } from 'lucide-react';

interface MinhaComissao {
  id: number;
  representante_id: number;
  representante_nome: string;
  entidade_nome: string;
  laudo_id: number | null;
  parcela_numero: number;
  total_parcelas: number;
  valor_laudo: string;
  valor_parcela: string;
  percentual_comissao_comercial: string;
  valor_comissao_comercial: string;
  mes_emissao: string;
  data_aprovacao: string | null;
  data_pagamento: string | null;
  asaas_payment_id: string | null;
}

interface Resumo {
  total_laudos: string;
  total_recebido: string;
  media_por_laudo: string;
  valor_pendente: string;
  valor_liberado: string;
}

const fmt = (v: string | number) =>
  `R$ ${parseFloat(String(v) || '0').toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
  })}`;

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d.substring(0, 10) + 'T12:00:00').toLocaleDateString('pt-BR');
};

export function MinhasComissoesComercial() {
  const [comissoes, setComissoes] = useState<MinhaComissao[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      const res = await fetch(`/api/comercial/minhas-comissoes?page=${page}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setErro(
          `Erro ao carregar comissões (${res.status}): ${(d as { error?: string }).error ?? res.statusText}`
        );
        return;
      }
      const data = await res.json();
      setComissoes(data.comissoes ?? []);
      setResumo(data.resumo ?? null);
      setTotal(data.total ?? 0);
    } catch (e) {
      setErro(`Falha de rede: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Minhas Comissões</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Comissões recebidas via split de cada laudo pago
          </p>
        </div>
        <span className="text-sm text-gray-400">{total} registro(s)</span>
      </div>

      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
          {erro}
        </div>
      )}

      {/* Resumo */}
      {resumo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: 'A Receber',
              value: fmt(resumo.valor_pendente),
              icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
              cor: 'text-amber-700',
              title:
                'Comissões pendentes de liberação (retida ou aguardando admin)',
            },
            {
              label: 'Liberado',
              value: fmt(resumo.valor_liberado),
              icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
              cor: 'text-purple-700',
              title: 'Comissões liberadas aguardando pagamento',
            },
            {
              label: 'Total Recebido',
              value: fmt(resumo.total_recebido),
              icon: <DollarSign className="w-5 h-5 text-green-600" />,
              cor: 'text-green-700',
              title: 'Total histórico de comissões pagas',
            },
            {
              label: 'Laudos Pagos',
              value: resumo.total_laudos,
              icon: <FileText className="w-5 h-5 text-blue-600" />,
              cor: 'text-blue-700',
              title: 'Quantidade de laudos com comissão paga',
            },
            {
              label: 'Média por Laudo',
              value: fmt(resumo.media_por_laudo),
              icon: <TrendingUp className="w-5 h-5 text-slate-600" />,
              cor: 'text-slate-700',
              title: 'Média de comissão por laudo pago',
            },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-white rounded-xl border p-4 flex items-center gap-3"
              title={(c as { title?: string }).title}
            >
              <div className="p-2 bg-gray-50 rounded-lg">{c.icon}</div>
              <div>
                <div className={`text-xl font-bold ${c.cor}`}>{c.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-green-500" />
        </div>
      ) : comissoes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <DollarSign className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm">Nenhuma comissão recebida ainda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-3 py-3 text-left">Representante</th>
                  <th className="px-3 py-3 text-left">Laudo ID</th>
                  <th className="px-3 py-3 text-left">Contratante</th>
                  <th className="px-3 py-3 text-center">Parcela</th>
                  <th className="px-3 py-3 text-right">Valor Laudo</th>
                  <th className="px-3 py-3 text-right">Valor Parcela</th>
                  <th className="px-3 py-3 text-center">%</th>
                  <th className="px-3 py-3 text-right">Comissão</th>
                  <th className="px-3 py-3 text-left">Data Pagamento</th>
                  <th className="px-3 py-3 text-left">Asaas ID</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comissoes.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <div className="font-medium text-gray-900">
                        {c.representante_nome}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        #{c.representante_id}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-700 font-mono text-xs">
                      {c.laudo_id ? `#${c.laudo_id}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-gray-700">
                      {c.entidade_nome}
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-600">
                      {c.parcela_numero}/{c.total_parcelas}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700">
                      {fmt(c.valor_laudo)}
                    </td>
                    <td className="px-3 py-3 text-right text-gray-700">
                      {fmt(c.valor_parcela)}
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-gray-600">
                      {parseFloat(c.percentual_comissao_comercial || '0')}%
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-green-700">
                      {fmt(c.valor_comissao_comercial)}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-xs">
                      {fmtDate(c.data_pagamento)}
                    </td>
                    <td className="px-3 py-3 text-gray-400 font-mono text-xs">
                      {c.asaas_payment_id ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paginação */}
      {total > 30 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Pág. {page} de {Math.ceil(total / 30)}
          </span>
          <button
            disabled={page >= Math.ceil(total / 30)}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
