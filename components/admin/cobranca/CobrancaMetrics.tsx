'use client';

import { useMemo } from 'react';
import type { ContratoPlano } from './types';
import { formatarValor } from './utils';

interface CobrancaMetricsProps {
  contratos: ContratoPlano[];
  totalClinicas: number;
  totalEntidades: number;
}

export function CobrancaMetrics({
  contratos,
  totalClinicas,
  totalEntidades,
}: CobrancaMetricsProps) {
  const valorTotalPago = useMemo(() => {
    return contratos.reduce((sum, c) => {
      let firstPaid = 0;

      if (Array.isArray(c.parcelas_json) && c.parcelas_json.length > 0) {
        const first = c.parcelas_json.find((p) => Number(p.numero) === 1);
        if (first && (first.pago === true || first.status === 'pago')) {
          firstPaid += Number(first.valor || 0);
        }
      } else if (c.pagamento_status === 'pago' && c.pagamento_valor) {
        firstPaid += Number(c.pagamento_valor || 0);
      } else if (c.valor_pago) {
        firstPaid += Number(c.valor_pago || 0);
      }

      return sum + (Number.isFinite(Number(firstPaid)) ? firstPaid : 0);
    }, 0);
  }, [contratos]);

  const valorAReceber = useMemo(() => {
    return contratos.reduce((sum, c) => {
      let pendingThisMonth = 0;
      if (Array.isArray(c.parcelas_json) && c.parcelas_json.length > 0) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        pendingThisMonth += c.parcelas_json
          .filter((p) => {
            if (!p) return false;
            const statusPend = p.pago === false || p.status === 'pendente';
            if (!statusPend) return false;
            try {
              const d = new Date(p.data_vencimento);
              return (
                d.getMonth() === currentMonth && d.getFullYear() === currentYear
              );
            } catch {
              return false;
            }
          })
          .reduce((s, p) => s + Number(p.valor || 0), 0);
      }
      return (
        sum + (Number.isFinite(Number(pendingThisMonth)) ? pendingThisMonth : 0)
      );
    }, 0);
  }, [contratos]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-sm text-gray-600">Total Clínicas</div>
        <div className="text-2xl font-bold text-gray-900">{totalClinicas}</div>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-sm text-gray-600">Total Entidades</div>
        <div className="text-2xl font-bold text-gray-900">{totalEntidades}</div>
      </div>
      <div className="flex items-center justify-end gap-4 md:col-span-1">
        <div className="bg-white rounded-lg shadow-sm p-4 w-48">
          <div className="text-sm text-gray-600">Valor Total Pago</div>
          <div className="text-2xl font-bold text-green-600">
            {formatarValor(valorTotalPago)}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 w-40">
          <div className="text-sm text-gray-600">Valor a Receber</div>
          <div className="text-2xl font-bold text-orange-600">
            {formatarValor(valorAReceber)}
          </div>
        </div>
      </div>
    </div>
  );
}
