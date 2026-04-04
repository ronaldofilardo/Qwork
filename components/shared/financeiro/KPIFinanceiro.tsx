'use client';

import {
  CalendarClock,
  TrendingDown,
  CheckCircle2,
  FileWarning,
} from 'lucide-react';
import type { KPIsFinanceiros } from '@/lib/types/financeiro-resumo';

interface KPIFinanceiroProps {
  kpis: KPIsFinanceiros;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarData(dataStr: string): string {
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

export function KPIFinanceiro({ kpis }: KPIFinanceiroProps): React.JSX.Element {
  const diasRestantes = kpis.proximo_vencimento.dias_restantes;
  const isVencimentoUrgente =
    diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 3;
  const isVencida = diasRestantes !== null && diasRestantes < 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Próximo Vencimento */}
      <div
        className={`bg-white rounded-lg border p-4 flex flex-col gap-1 ${
          isVencida
            ? 'border-red-300 bg-red-50'
            : isVencimentoUrgente
              ? 'border-yellow-300 bg-yellow-50'
              : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <CalendarClock
            size={20}
            className={
              isVencida
                ? 'text-red-600'
                : isVencimentoUrgente
                  ? 'text-yellow-600'
                  : 'text-blue-500'
            }
          />
          {isVencida && (
            <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
              Vencida
            </span>
          )}
          {isVencimentoUrgente && !isVencida && (
            <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
              Urgente
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">Próximo Vencimento</p>
        {kpis.proximo_vencimento.data ? (
          <>
            <p className="text-lg font-bold text-gray-900">
              {formatarMoeda(kpis.proximo_vencimento.valor)}
            </p>
            <p
              className={`text-xs ${
                isVencida
                  ? 'text-red-600'
                  : isVencimentoUrgente
                    ? 'text-yellow-600'
                    : 'text-gray-600'
              }`}
            >
              {formatarData(kpis.proximo_vencimento.data)}
              {diasRestantes !== null && diasRestantes >= 0 && (
                <span className="ml-1">
                  ({diasRestantes === 0 ? 'hoje' : `${diasRestantes}d`})
                </span>
              )}
              {diasRestantes !== null && diasRestantes < 0 && (
                <span className="ml-1">
                  ({Math.abs(diasRestantes)}d atraso)
                </span>
              )}
            </p>
          </>
        ) : (
          <p className="text-sm text-gray-500 mt-1">Nenhum pendente</p>
        )}
      </div>

      {/* Total Pendente no Mês */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <TrendingDown size={20} className="text-orange-500" />
        </div>
        <p className="text-xs text-gray-500 mt-1">A Pagar no Mês</p>
        <p className="text-lg font-bold text-gray-900">
          {formatarMoeda(kpis.total_pendente_mes)}
        </p>
        <p className="text-xs text-gray-500">
          parcelas com vencimento este mês
        </p>
      </div>

      {/* Total Pago no Mês */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <CheckCircle2 size={20} className="text-green-500" />
        </div>
        <p className="text-xs text-gray-500 mt-1">Pago no Mês</p>
        <p className="text-lg font-bold text-green-700">
          {formatarMoeda(kpis.total_pago_mes)}
        </p>
        <p className="text-xs text-gray-500">confirmado este mês</p>
      </div>

      {/* Parcelas em Aberto */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <FileWarning size={20} className="text-gray-500" />
          {kpis.parcelas_em_aberto > 0 && (
            <span className="text-xs font-bold text-white bg-orange-500 rounded-full min-w-[22px] h-[22px] inline-flex items-center justify-center px-1">
              {kpis.parcelas_em_aberto}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">Parcelas em Aberto</p>
        <p className="text-lg font-bold text-gray-900">
          {kpis.parcelas_em_aberto}
        </p>
        <p className="text-xs text-gray-500">não quitadas no total</p>
      </div>
    </div>
  );
}
