'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';
import { KPIFinanceiro } from './KPIFinanceiro';
import { ParcelasTimeline } from './ParcelasTimeline';
import { TabelaResumoPorMes } from './TabelaResumoPorMes';
import type { FinanceiroResumo } from '@/lib/types/financeiro-resumo';

interface MiniDashboardFinanceiroProps {
  /** URL do endpoint — '/api/rh/financeiro-resumo' ou '/api/entidade/financeiro-resumo' */
  apiUrl: string;
}

// eslint-disable-next-line max-lines-per-function
export default function MiniDashboardFinanceiro({
  apiUrl,
}: MiniDashboardFinanceiroProps): React.JSX.Element {
  const [dados, setDados] = useState<FinanceiroResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mesSelecionado, setMesSelecionado] = useState<string | null>(null);
  const [expandirTimeline, setExpandirTimeline] = useState(true);
  const [expandirResumo, setExpandirResumo] = useState(true);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) {
        const errData = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setErro(errData.error ?? `Erro ${res.status}`);
        return;
      }
      const data = (await res.json()) as FinanceiroResumo;
      setDados(data);
    } catch {
      setErro('Falha ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          <span className="text-sm text-gray-600">
            Carregando resumo financeiro…
          </span>
        </div>
        {/* Skeleton KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-gray-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle size={16} />
          <span>{erro}</span>
          <button
            onClick={carregarDados}
            className="ml-2 text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!dados) return <></>;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Resumo Financeiro
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Parcelas, vencimentos e cronograma
          </p>
        </div>
        <button
          onClick={carregarDados}
          aria-label="Atualizar dados financeiros"
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* ── KPIs ── */}
        <KPIFinanceiro kpis={dados.kpis} />

        {/* ── Cronograma de Parcelas ── */}
        <div>
          <button
            onClick={() => setExpandirTimeline((v) => !v)}
            className="flex items-center gap-2 w-full text-left mb-3 group focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
            aria-expanded={expandirTimeline}
          >
            <h3 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
              Cronograma de Parcelas
            </h3>
            {mesSelecionado && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                Filtrado
              </span>
            )}
            <ChevronDown
              size={14}
              className={`ml-auto text-gray-400 transition-transform duration-200 ${
                expandirTimeline ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </button>

          {expandirTimeline && (
            <ParcelasTimeline
              parcelas={dados.parcelas}
              mesSelecionado={mesSelecionado}
            />
          )}
        </div>

        {/* ── Resumo Mensal ── */}
        <div>
          <button
            onClick={() => setExpandirResumo((v) => !v)}
            className="flex items-center gap-2 w-full text-left mb-3 group focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
            aria-expanded={expandirResumo}
          >
            <h3 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
              Resumo Mensal
            </h3>
            {mesSelecionado && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMesSelecionado(null);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 underline focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
              >
                Limpar filtro
              </button>
            )}
            <ChevronDown
              size={14}
              className={`ml-auto text-gray-400 transition-transform duration-200 ${
                expandirResumo ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </button>

          {expandirResumo && (
            <TabelaResumoPorMes
              resumo={dados.resumo_mensal}
              mesSelecionado={mesSelecionado}
              onMesSelecionado={setMesSelecionado}
            />
          )}
        </div>

        {/* ── Link para histórico ── */}
        <div className="pt-2 border-t border-gray-100">
          <a
            href="#dados-financeiros"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
          >
            Ver Histórico Completo de Pagamentos
          </a>
        </div>
      </div>
    </div>
  );
}
