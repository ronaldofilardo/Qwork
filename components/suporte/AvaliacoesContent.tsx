'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Building2,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';

interface LoteAvaliacao {
  lote_id: number;
  tipo: string;
  status: string;
  laudo_status: string;
  liberado_em: string;
  emitido_em: string | null;
  enviado_em: string | null;
  laudo_enviado_em: string | null;
  solicitacao_emissao_em: string | null;
  pago_em: string | null;
  status_pagamento: string | null;
  numero_ordem: number;
  tomador_nome: string;
  tomador_tipo: string;
  empresa_nome: string | null;
  avaliacoes_liberadas: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

type StatusDisplay = {
  label: string;
  classes: string;
};

function getStatusDisplay(lote: LoteAvaliacao): StatusDisplay & { data?: string } {
  // Prioridade 1: Cancelado
  if (lote.status === 'cancelado') {
    return { label: 'Cancelado', classes: 'bg-red-100 text-red-700' };
  }

  // Prioridade 2: Laudo Enviado (baseado em laudos.status)
  if (lote.laudo_status === 'enviado' && lote.enviado_em) {
    return {
      label: 'Laudo Enviado',
      classes: 'bg-green-100 text-green-700',
      data: lote.enviado_em,
    };
  }

  // Prioridade 3: Laudo Emitido (baseado em laudos.status)
  if (lote.laudo_status === 'emitido' && lote.emitido_em) {
    return {
      label: 'Laudo Emitido',
      classes: 'bg-purple-100 text-purple-700',
      data: lote.emitido_em,
    };
  }

  // Fallback: Verificar campos da tabela lotes_avaliacao também
  if (lote.enviado_em || lote.laudo_enviado_em) {
    return {
      label: 'Laudo Enviado',
      classes: 'bg-green-100 text-green-700',
      data: lote.enviado_em || lote.laudo_enviado_em,
    };
  }

  // Prioridade 4: Pagamento Concluído, Aguardando Emissão
  if (lote.pago_em || lote.status_pagamento === 'pago') {
    return {
      label: 'Pago, Aguardando Emissão',
      classes: 'bg-blue-100 text-blue-700',
    };
  }

  // Prioridade 5: Aguardando Pagamento
  if (
    lote.status_pagamento === 'aguardando_cobranca' ||
    lote.status_pagamento === 'aguardando_pagamento'
  ) {
    return {
      label: 'Aguardando Pagamento',
      classes: 'bg-yellow-100 text-yellow-700',
    };
  }

  // Prioridade 6: Concluído mas sem pagamento/emissão (status intermediário)
  if (lote.status === 'concluido') {
    return {
      label: 'Aguardando Emissão',
      classes: 'bg-amber-100 text-amber-700',
    };
  }

  // Padrão: Em Andamento (avaliações ainda sendo coletadas)
  return { label: 'Em Andamento', classes: 'bg-blue-100 text-blue-700' };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const date = d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
}

function getLaudoDataDisplay(lote: LoteAvaliacao): string {
  const status = getStatusDisplay(lote);
  if (status.data) {
    return formatDateTime(status.data);
  }
  return '—';
}

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'aguardando_emissao', label: 'Aguardando Emissão' },
  { value: 'laudo_emitido', label: 'Laudo Emitido' },
  { value: 'laudo_enviado', label: 'Laudo Enviado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export function AvaliacoesContent() {
  const [lotes, setLotes] = useState<LoteAvaliacao[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [page, setPage] = useState(1);

  const fetchLotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (dataInicio) params.set('data_inicio', dataInicio);
      if (dataFim) params.set('data_fim', dataFim);
      // Adiciona timestamp para forçar refresh (bypass cache)
      params.set('_t', Date.now().toString());

      const res = await fetch(`/api/suporte/avaliacoes?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || 'Erro ao carregar avaliações');
      }
      const data = (await res.json()) as {
        lotes: LoteAvaliacao[];
        pagination: Pagination;
      };
      
      // Debug: Log para diagnosticar dados retornados
      if (data.lotes.length > 0) {
        console.log('📊 Primeiro lote retornado:', {
          id: data.lotes[0].lote_id,
          status: data.lotes[0].status,
          laudo_status: data.lotes[0].laudo_status,
          emitido_em: data.lotes[0].emitido_em,
          enviado_em: data.lotes[0].enviado_em,
          laudo_enviado_em: data.lotes[0].laudo_enviado_em,
          pago_em: data.lotes[0].pago_em,
          status_pagamento: data.lotes[0].status_pagamento,
          statusDisplay: getStatusDisplay(data.lotes[0]),
        });
      }
      
      setLotes(data.lotes);
      setPagination(data.pagination);
    } catch (err: unknown) {
      setError((err as Error).message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, dataInicio, dataFim]);

  useEffect(() => {
    fetchLotes();
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchLotes, 30000);
    return () => clearInterval(interval);
  }, [fetchLotes]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleFilterChange = (setter: (v: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter || dataInicio || dataFim;

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchLotes();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Cabeçalho */}
      <div className="mb-6 flex items-center gap-3">
        <ClipboardList className="text-blue-600" size={24} />
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Avaliações</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Acompanhamento de lotes liberados — da liberação ao envio do laudo
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar tomador ou empresa..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Buscar
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || loading}
            className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Atualizar dados"
          >
            <RefreshCw
              size={16}
              className={`inline ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
          className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">De:</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => handleFilterChange(setDataInicio, e.target.value)}
            className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 whitespace-nowrap">
            Até:
          </label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => handleFilterChange(setDataFim, e.target.value)}
            className="py-2 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSearch('');
              setSearchInput('');
              setStatusFilter('');
              setDataInicio('');
              setDataFim('');
              setPage(1);
            }}
            className="py-2 px-3 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Contagem */}
      {!loading && !error && (
        <p className="text-xs text-gray-500 mb-3">
          {pagination.total === 0
            ? 'Nenhum lote encontrado'
            : `${pagination.total} lote${pagination.total !== 1 ? 's' : ''} encontrado${pagination.total !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Estado de erro */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                Tomador / Empresa
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                Lote
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                Liberação
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                Solicitação
              </th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                Laudos
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <span className="text-sm">Carregando...</span>
                  </div>
                </td>
              </tr>
            ) : lotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <ClipboardList size={32} className="text-gray-300" />
                    <span className="text-sm">Nenhum lote encontrado</span>
                    {hasActiveFilters && (
                      <span className="text-xs">Tente ajustar os filtros</span>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              lotes.map((lote) => {
                const statusDisplay = getStatusDisplay(lote);

                return (
                  <tr
                    key={lote.lote_id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* Tomador / Empresa */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <Building2
                          size={15}
                          className="mt-0.5 shrink-0 text-gray-400"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {lote.tomador_nome}
                          </p>
                          {lote.empresa_nome && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {lote.empresa_nome}
                            </p>
                          )}
                          <span className="inline-block mt-1 text-xs text-gray-400">
                            {lote.tomador_tipo === 'clinica'
                              ? 'Clínica'
                              : 'Entidade'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Lote */}
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-medium text-gray-800">
                        #{lote.lote_id}
                      </p>
                    </td>

                    {/* Liberação */}
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                      {formatDate(lote.liberado_em)}
                    </td>

                    {/* Solicitação */}
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {formatDate(lote.solicitacao_emissao_em)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {lote.solicitacao_emissao_em
                            ? new Date(lote.solicitacao_emissao_em)
                                .toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false,
                                })
                            : '—'}
                        </span>
                      </div>
                    </td>

                    {/* Laudos */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full w-fit ${statusDisplay.classes}`}
                        >
                          {statusDisplay.label}
                        </span>
                        {getLaudoDataDisplay(lote) !== '—' && (
                          <span className="text-xs text-gray-500">
                            {getLaudoDataDisplay(lote)}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {!loading && pagination.pages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Página {pagination.page} de {pagination.pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={pagination.page >= pagination.pages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Próxima
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
