'use client';

import { Clock, ChevronDown } from 'lucide-react';
import { ComissaoProvisionada, fmt } from './types';

interface CiclosProvisionadasProps {
  provisionadas: ComissaoProvisionada[];
  provisionadasLoading: boolean;
  provisionadasExpanded: boolean;
  onToggle: () => void;
}

function ProvisionadasRow({ p }: { p: ComissaoProvisionada }) {
  return (
    <tr className="hover:bg-amber-50/40 transition-colors">
      <td className="px-4 py-3">
        <div className="font-medium text-gray-900">{p.representante_nome}</div>
        <div className="text-xs text-gray-400 font-mono">
          {p.representante_codigo}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-700">{p.entidade_nome}</td>
      <td className="px-4 py-3 text-right font-semibold text-gray-900">
        {fmt(p.valor_comissao)}{' '}
        <span className="text-xs text-gray-400 font-normal">
          ({p.percentual_comissao}%)
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-xs font-mono text-gray-700">
          {p.parcela_numero}/{p.total_parcelas}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {p.mes_pagamento
          ? new Date(p.mes_pagamento + 'T12:00:00Z').toLocaleDateString(
              'pt-BR',
              { month: 'short', year: 'numeric' }
            )
          : '—'}
      </td>
      <td className="px-4 py-3 text-center">
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
          Retida
        </span>
      </td>
    </tr>
  );
}

// eslint-disable-next-line max-lines-per-function
export function CiclosProvisionadas({
  provisionadas,
  provisionadasLoading,
  provisionadasExpanded,
  onToggle,
}: CiclosProvisionadasProps) {
  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-amber-600" />
          <span className="text-sm font-semibold text-amber-900">
            Comissões Provisionadas
          </span>
          {provisionadas.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
              {provisionadas.length}
            </span>
          )}
          <span className="text-xs text-amber-700 ml-1">
            — parcelas futuras aguardando pagamento
          </span>
        </div>
        <ChevronDown
          size={16}
          className={`text-amber-600 transition-transform ${provisionadasExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {provisionadasExpanded &&
        (provisionadasLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 rounded-full border-4 border-amber-400 border-t-transparent" />
          </div>
        ) : provisionadas.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            Nenhuma comissão provisionada no momento
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    Representante
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Comissão
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Parcela
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Mês Pag. Previsto
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {provisionadas.map((p) => (
                  <ProvisionadasRow key={p.id} p={p} />
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
