'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, Search, ArrowUpDown } from 'lucide-react';
import EmpresaFormModal from '@/components/clinica/EmpresaFormModal';
import SummaryStatsCards from './components/SummaryStatsCards';
import EmpresasTable from './components/EmpresasTable';
import AcoesEmMassaBar from './components/AcoesEmMassaBar';
import ModalLiberarCiclosConfirmacao from './components/ModalLiberarCiclosConfirmacao';
import FlowStepsExplainer from '@/components/FlowStepsExplainer';
import type {
  EmpresaOverview,
  ResumoKPI,
  EmpresasOverviewResponse,
} from '@/app/api/rh/empresas-overview/route';

type OrdenarPor = 'prioridade' | 'nome' | 'progresso';

const KPI_INICIAL: ResumoKPI = {
  total_empresas: 0,
  lotes_em_andamento: 0,
  percentual_medio_conclusao: 0,
  total_laudos_pendentes: 0,
  total_funcionarios: 0,
  total_funcionarios_inativos: 0,
  total_lotes: 0,
  total_lotes_pendentes: 0,
  total_laudos_emitidos: 0,
  total_laudos_aguardando_emissao: 0,
  total_laudos_aguardando_pagamento: 0,
};

// Empresa stub para handleEmpresaCreated (compatível com EmpresaFormModal callback)
interface EmpresaCreated {
  id: number;
  nome: string;
  cnpj: string;
  ativa: boolean;
  representante_nome: string;
  representante_fone: string;
  representante_email: string;
}

export default function RhPage() {
  const [empresas, setEmpresas] = useState<EmpresaOverview[]>([]);
  const [kpi, setKpi] = useState<ResumoKPI>(KPI_INICIAL);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [ordenar, setOrdenar] = useState<OrdenarPor>('prioridade');

  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set());
  const [isModalNovaEmpresa, setIsModalNovaEmpresa] = useState(false);
  const [isModalLiberar, setIsModalLiberar] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busca) params.set('busca', busca);
      if (ordenar !== 'prioridade') params.set('ordenar', ordenar);
      const res = await fetch(`/api/rh/empresas-overview?${params.toString()}`);
      if (res.ok) {
        const data: EmpresasOverviewResponse = await res.json();
        setEmpresas(data.empresas ?? []);
        setKpi(data.resumo_kpi ?? KPI_INICIAL);
      }
    } catch (err) {
      console.error('[RhPage] erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [busca, ordenar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Desmarcar seleções ao recarregar dados
  useEffect(() => {
    setSelecionadas(new Set());
  }, [empresas]);

  const handleToggle = useCallback((id: number) => {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleToggleAll = useCallback(() => {
    const elegiveisIds = empresas
      .filter((e) => e.elegibilidade.elegivel)
      .map((e) => e.id);

    const todasSelecionadas = elegiveisIds.every((id) => selecionadas.has(id));

    if (todasSelecionadas) {
      setSelecionadas(new Set());
    } else {
      setSelecionadas(new Set(elegiveisIds));
    }
  }, [empresas, selecionadas]);

  const handleEmpresaCreated = (_novaEmpresa: EmpresaCreated) => {
    setIsModalNovaEmpresa(false);
    loadData();
  };

  const empresasSelecionadas = empresas.filter((e) => selecionadas.has(e.id));

  if (loading && empresas.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-full">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestão de Empresas
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Gerencie ciclos de avaliação das empresas clientes
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadData}
                disabled={loading}
                title="Atualizar dados"
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  size={18}
                  className={loading ? 'animate-spin' : ''}
                />
              </button>
              <button
                type="button"
                onClick={() => setIsModalNovaEmpresa(true)}
                data-testid="nova-empresa-button"
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-sm text-sm font-medium"
              >
                <Plus size={17} />
                Nova Empresa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* Fluxo explicativo com tooltips */}
        <FlowStepsExplainer isClinica={true} />

        {/* Cards de resumo */}
        <SummaryStatsCards kpi={kpi} />

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou CNPJ..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown size={15} className="text-gray-400 flex-shrink-0" />
            <select
              value={ordenar}
              onChange={(e) => setOrdenar(e.target.value as OrdenarPor)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400 transition-colors"
            >
              <option value="prioridade">Ordenar: Prioridade</option>
              <option value="nome">Ordenar: Nome A-Z</option>
              <option value="progresso">Ordenar: Progresso</option>
            </select>
          </div>

          {selecionadas.size > 0 && (
            <p className="text-sm text-primary-600 font-medium">
              {selecionadas.size} selecionada
              {selecionadas.size !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Tabela */}
        <EmpresasTable
          empresas={empresas}
          selecionadas={selecionadas}
          onToggle={handleToggle}
          onToggleAll={handleToggleAll}
        />
      </div>

      {/* Barra de ações em massa (sticky bottom) */}
      <AcoesEmMassaBar
        totalSelecionadas={selecionadas.size}
        onLiberarCiclos={() => setIsModalLiberar(true)}
        onDesmarcarTodas={() => setSelecionadas(new Set())}
      />

      {/* Modal Nova Empresa */}
      <EmpresaFormModal
        isOpen={isModalNovaEmpresa}
        onClose={() => setIsModalNovaEmpresa(false)}
        onSuccess={handleEmpresaCreated}
      />

      {/* Modal Liberar Ciclos */}
      <ModalLiberarCiclosConfirmacao
        isOpen={isModalLiberar}
        empresas={empresasSelecionadas}
        onClose={() => setIsModalLiberar(false)}
        onSuccess={() => {
          setIsModalLiberar(false);
          setSelecionadas(new Set());
          loadData();
        }}
      />
    </div>
  );
}
