'use client';

import { CheckCircle, ChevronDown } from 'lucide-react';
import { ResumoCiclosLegadas, fmt } from './types';

interface CiclosLegadasProps {
  legadas: ResumoCiclosLegadas | null;
  legadasExpanded: boolean;
  onToggle: () => void;
}

// eslint-disable-next-line max-lines-per-function
export function CiclosLegadas({
  legadas,
  legadasExpanded,
  onToggle,
}: CiclosLegadasProps) {
  if (!legadas || legadas.itens.length === 0) return null;
  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-green-50 hover:bg-green-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600" />
          <span className="text-sm font-semibold text-green-900">
            Comissões Pagas (Legadas)
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800">
            {legadas.itens.length} representante
            {legadas.itens.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-green-700 ml-1">
            — pagas antes do mecanismo de fechamento mensal
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-green-600 transition-transform ${legadasExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {legadasExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">
                  Representante
                </th>
                <th className="px-4 py-3 text-center font-semibold">Laudos</th>
                <th className="px-4 py-3 text-right font-semibold">
                  Valor Total Pago
                </th>
                <th className="px-4 py-3 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {legadas.itens.map((l) => (
                <tr
                  key={l.representante_id}
                  className="hover:bg-green-50/40 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {l.representante_nome}
                    </div>
                    {l.representante_codigo && (
                      <div className="text-xs text-gray-400 font-mono">
                        {l.representante_codigo}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 font-medium">
                    {l.qtd_comissoes}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {fmt(l.valor_total)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      Pago
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-green-50 font-semibold">
                <td className="px-4 py-2 text-green-900">Total</td>
                <td className="px-4 py-2 text-center text-green-900">
                  {legadas.qtd_comissoes}
                </td>
                <td className="px-4 py-2 text-right text-green-900">
                  {fmt(legadas.valor_total)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
