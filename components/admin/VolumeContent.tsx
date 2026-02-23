'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { RefreshCw } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface VolumeDiario {
  data: string;
  liberadas: number;
  concluidas: number;
  inativadas: number;
  taxa: number;
}

interface EntidadeOpcao {
  id: number;
  nome: string;
}

interface Props {
  activeSubSection: string;
}

const PERIODOS = [
  { label: '7 dias', valor: 7 },
  { label: '14 dias', valor: 14 },
  { label: '30 dias', valor: 30 },
];

function formatarData(dataStr: string): string {
  const parts = dataStr.split('-');
  return `${parts[2]}/${parts[1]}`;
}

function formatarDataCompleta(dataStr: string): string {
  const parts = dataStr.split('-');
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 5 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export function VolumeContent({ activeSubSection }: Props) {
  const tipo = activeSubSection === 'rh' ? 'rh' : 'entidade';

  const [dados, setDados] = useState<VolumeDiario[]>([]);
  const [entidades, setEntidades] = useState<EntidadeOpcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState(30);
  const [entidadeId, setEntidadeId] = useState<string>('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const params = new URLSearchParams({
        tipo,
        dias: String(periodo),
      });
      if (tipo === 'entidade' && entidadeId) {
        params.set('entidade_id', entidadeId);
      }

      const res = await fetch(`/api/admin/volume?${params.toString()}`);
      if (!res.ok) throw new Error('Falha ao carregar dados de volume');

      const json = await res.json();
      setDados(json.dados ?? []);
      setEntidades(json.entidades ?? []);
      setUltimaAtualizacao(new Date());
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [tipo, periodo, entidadeId]);

  // Resetar filtro de entidade ao trocar de aba
  useEffect(() => {
    setEntidadeId('');
  }, [tipo]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Totais do período
  const totais = dados.reduce(
    (acc, row) => ({
      liberadas: acc.liberadas + row.liberadas,
      concluidas: acc.concluidas + row.concluidas,
      inativadas: acc.inativadas + row.inativadas,
    }),
    { liberadas: 0, concluidas: 0, inativadas: 0 }
  );
  const taxaGeral =
    totais.liberadas > 0
      ? Math.round((totais.concluidas / totais.liberadas) * 100)
      : 0;

  // Gráfico: ordem cronológica (mais antigo primeiro)
  const dadosOrdenados = [...dados].reverse();
  const chartData = {
    labels: dadosOrdenados.map((d) => formatarData(d.data)),
    datasets: [
      {
        label: 'Liberadas',
        data: dadosOrdenados.map((d) => d.liberadas),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Concluídas',
        data: dadosOrdenados.map((d) => d.concluidas),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Inativadas',
        data: dadosOrdenados.map((d) => d.inativadas),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false },
      tooltip: {
        callbacks: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          afterBody: (ctx: any[]) => {
            const idx = ctx[0]?.dataIndex;
            if (idx === undefined) return '';
            const row = dadosOrdenados[idx];
            if (!row) return '';
            return [`Taxa: ${row.taxa}%`];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };

  const tituloSecao = tipo === 'entidade' ? 'Entidade' : 'RH';

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Volume de Avaliações — {tituloSecao}
          </h2>
          {ultimaAtualizacao && (
            <p className="text-xs text-gray-400 mt-0.5">
              Atualizado às{' '}
              {ultimaAtualizacao.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Presets de período */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {PERIODOS.map((p) => (
              <button
                key={p.valor}
                onClick={() => setPeriodo(p.valor)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  periodo === p.valor
                    ? 'bg-orange-500 text-white font-medium'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Filtro por entidade (apenas na sub-aba Entidade) */}
          {tipo === 'entidade' && entidades.length > 0 && (
            <select
              value={entidadeId}
              onChange={(e) => setEntidadeId(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="">Todas as entidades</option>
              {entidades.map((e) => (
                <option key={e.id} value={String(e.id)}>
                  {e.nome}
                </option>
              ))}
            </select>
          )}

          {/* Botão atualizar */}
          <button
            onClick={carregar}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

      {/* Gráfico */}
      {!erro && (
        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
          <div className="h-52">
            {loading ? (
              <div className="h-full flex items-end gap-2 px-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col gap-1 items-center justify-end"
                  >
                    <div
                      className="w-full bg-gray-200 rounded animate-pulse"
                      style={{ height: `${30 + ((i * 7) % 50)}%` }}
                    />
                    <div
                      className="w-full bg-gray-200 rounded animate-pulse"
                      style={{ height: `${15 + ((i * 5) % 35)}%` }}
                    />
                  </div>
                ))}
              </div>
            ) : dados.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                Sem dados no período selecionado
              </div>
            ) : (
              <Bar data={chartData} options={chartOptions} />
            )}
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-right">Liberadas</th>
              <th className="px-4 py-3 text-right">Concluídas</th>
              <th className="px-4 py-3 text-right">Inativadas</th>
              <th className="px-4 py-3 text-right">Taxa %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : dados.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-gray-400"
                >
                  Nenhum lote encontrado no período
                </td>
              </tr>
            ) : (
              dados.map((row) => {
                const discrepancia = row.liberadas - row.concluidas;
                const destacar = discrepancia > 5;
                return (
                  <tr
                    key={row.data}
                    className={`transition-colors ${
                      destacar
                        ? 'bg-amber-50 hover:bg-amber-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {formatarDataCompleta(row.data)}
                      {destacar && (
                        <span
                          className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-400"
                          title={`${discrepancia} avaliações liberadas ainda não concluídas`}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {row.liberadas}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 font-medium">
                      {row.concluidas}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500">
                      {row.inativadas}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          row.taxa >= 75
                            ? 'text-green-600'
                            : row.taxa >= 40
                              ? 'text-amber-600'
                              : 'text-red-500'
                        }`}
                      >
                        {row.taxa}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Rodapé com totais */}
          {!loading && dados.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-gray-700">
                <td className="px-4 py-3 text-xs uppercase text-gray-400">
                  Total ({dados.length} dias)
                </td>
                <td className="px-4 py-3 text-right">{totais.liberadas}</td>
                <td className="px-4 py-3 text-right text-green-600">
                  {totais.concluidas}
                </td>
                <td className="px-4 py-3 text-right text-red-500">
                  {totais.inativadas}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`font-bold ${
                      taxaGeral >= 75
                        ? 'text-green-600'
                        : taxaGeral >= 40
                          ? 'text-amber-600'
                          : 'text-red-500'
                    }`}
                  >
                    {taxaGeral}%
                  </span>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Legenda */}
      {!loading && dados.length > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
            Linha destacada: mais de 5 avaliações liberadas sem conclusão no dia
          </span>
          <span>
            Liberadas por <strong>data de criação</strong> &nbsp;|  Concluídas
            por <strong>data de envio</strong>
          </span>
          <span>
            <span className="text-green-600 font-semibold">Verde</span>: taxa ≥
            75% &nbsp;|&nbsp;
            <span className="text-amber-600 font-semibold">Amarelo</span>:
            40–74% &nbsp;|&nbsp;
            <span className="text-red-500 font-semibold">Vermelho</span>:
            &lt;40%
          </span>
        </div>
      )}
    </div>
  );
}
