'use client';

import { Search, Filter, Calendar } from 'lucide-react';

interface CobrancaFiltersProps {
  limit: number;
  setLimit: (v: number) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortDir: 'asc' | 'desc';
  setSortDir: (v: 'asc' | 'desc') => void;
  busca: string;
  setBusca: (v: string) => void;
  cnpjFilter: string;
  setCnpjFilter: (v: string) => void;
  filtroTipo: 'todos' | 'clinica' | 'entidade';
  setFiltroTipo: (v: 'todos' | 'clinica' | 'entidade') => void;
  filtroStatus: string;
  setFiltroStatus: (v: string) => void;
  page: number;
  totalFiltrados: number;
  onFilterCnpj: (cnpj: string, page: number) => void;
}

export function CobrancaFilters({
  limit,
  setLimit,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  busca,
  setBusca,
  cnpjFilter,
  setCnpjFilter,
  filtroTipo,
  setFiltroTipo,
  filtroStatus,
  setFiltroStatus,
  page,
  totalFiltrados,
  onFilterCnpj,
}: CobrancaFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <select
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
            className="pl-3 w-full px-4 py-2 border border-gray-300 rounded-md"
            title="Registros por página"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="relative">
          <select
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [sb, sd] = e.target.value.split(':');
              setSortBy(sb);
              setSortDir(sd as 'asc' | 'desc');
            }}
            className="pl-3 w-full px-4 py-2 border border-gray-300 rounded-md"
            title="Ordenar"
          >
            <option value="data_pagamento:desc">Data Pagamento (desc)</option>
            <option value="data_pagamento:asc">Data Pagamento (asc)</option>
            <option value="plano_preco:desc">Plano Preço (desc)</option>
            <option value="plano_preco:asc">Plano Preço (asc)</option>
          </select>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou CNPJ"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Filtro por CNPJ */}
        <div className="relative">
          <input
            type="text"
            placeholder="Filtrar por CNPJ"
            value={cnpjFilter}
            onChange={(e) => setCnpjFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div className="relative">
          <button
            onClick={() => onFilterCnpj(cnpjFilter.replace(/\D/g, ''), 1)}
            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
            title="Filtrar por CNPJ"
          >
            Filtrar CNPJ
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() =>
              onFilterCnpj(cnpjFilter.replace(/\D/g, ''), Math.max(page - 1, 1))
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            title="Página anterior"
          >
            Anterior
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() =>
              onFilterCnpj(cnpjFilter.replace(/\D/g, ''), page + 1)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            title="Próxima página"
          >
            Próxima
          </button>
        </div>

        {/* Filtro por tipo */}
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <select
            value={filtroTipo}
            onChange={(e) =>
              setFiltroTipo(e.target.value as 'todos' | 'clinica' | 'entidade')
            }
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="todos">Todos os tipos</option>
            <option value="clinica">Clínicas</option>
            <option value="entidade">Entidades</option>
          </select>
        </div>

        {/* Filtro por status */}
        <div className="relative">
          <Calendar className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="todos">Todos os status</option>
            <option value="ativo">Ativos</option>
            <option value="vencido">Vencidos</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        {/* Total filtrado */}
        <div className="flex items-center justify-end">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">{totalFiltrados}</span> contrato(s)
            encontrado(s)
          </div>
        </div>
      </div>
    </div>
  );
}
