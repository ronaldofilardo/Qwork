'use client';

import { CheckCircle } from 'lucide-react';
import { CicloEnriquecido, ResumoCiclosLegadas, fmt } from './types';

interface CiclosComissoesPagasProps {
  ciclos: CicloEnriquecido[];
  legadas: ResumoCiclosLegadas | null;
  mesLabel: string;
}

function calcTotalQtd(ciclosPagos: CicloEnriquecido[], legadas: ResumoCiclosLegadas | null): number {
  return ciclosPagos.reduce((acc, c) => acc + c.qtd_comissoes, 0) + (legadas?.qtd_comissoes ?? 0);
}

function calcTotalValor(ciclosPagos: CicloEnriquecido[], legadas: ResumoCiclosLegadas | null): number {
  return ciclosPagos.reduce((acc, c) => acc + c.valor_total, 0) + (legadas?.valor_total ?? 0);
}

function calcBeneficiarios(ciclosPagos: CicloEnriquecido[], legadas: ResumoCiclosLegadas | null): number {
  return new Set([
    ...ciclosPagos.map((c) => c.beneficiario_nome),
    ...(legadas?.itens.map((l) => l.representante_nome) ?? []),
  ]).size;
}

export function CiclosComissoesPagas({ ciclos, legadas, mesLabel }: CiclosComissoesPagasProps) {
  const ciclosPagos = ciclos.filter((c) => c.status === 'pago');
  const temDados = ciclosPagos.length > 0 || (legadas && legadas.itens.length > 0);

  if (!temDados) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-green-900">Comissões Pagas em {mesLabel}</h3>
          <p className="text-sm text-green-700 mt-0.5">Resumo de todos os pagamentos realizados neste período</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white rounded-lg p-2 border border-green-200">
          <div className="text-xs text-green-600 font-medium">Comissões Pagas</div>
          <div className="text-lg font-bold text-green-900">
            {calcTotalQtd(ciclosPagos, legadas)}
          </div>
          {ciclosPagos.length > 0 && (
            <div className="text-xs text-green-500 mt-0.5">
              {ciclosPagos.length} ciclo{ciclosPagos.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg p-2 border border-green-200">
          <div className="text-xs text-green-600 font-medium">Valor Total</div>
          <div className="text-lg font-bold text-green-900">
            {fmt(calcTotalValor(ciclosPagos, legadas))}
          </div>
        </div>
        <div className="bg-white rounded-lg p-2 border border-green-200">
          <div className="text-xs text-green-600 font-medium">Beneficiários</div>
          <div className="text-lg font-bold text-green-900">
            {calcBeneficiarios(ciclosPagos, legadas)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-2 border border-green-200">
          <div className="text-xs text-green-600 font-medium">Comissões</div>
          <div className="text-lg font-bold text-green-900">
            {calcTotalQtd(ciclosPagos, legadas)}
          </div>
        </div>
      </div>
    </div>
  );
}
