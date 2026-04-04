'use client';

import type { ResumoPorMes } from '@/lib/types/financeiro-resumo';

interface ResumoPorMesProps {
  resumo: ResumoPorMes[];
  mesSelecionado: string | null;
  onMesSelecionado: (chave: string | null) => void;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function barraWidth(valor: number, maxValor: number): string {
  if (maxValor === 0) return '0%';
  const pct = Math.round((valor / maxValor) * 100);
  return `${Math.min(pct, 100)}%`;
}

export function TabelaResumoPorMes({
  resumo,
  mesSelecionado,
  onMesSelecionado,
}: ResumoPorMesProps): React.JSX.Element {
  if (resumo.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        Nenhum dado mensal disponível.
      </div>
    );
  }

  const maxValor = Math.max(
    ...resumo.map((r) => r.total_a_pagar + r.total_pago)
  );

  return (
    <div className="overflow-x-auto">
      <table
        className="w-full text-sm"
        role="table"
        aria-label="Resumo financeiro mensal"
      >
        <thead>
          <tr className="text-left">
            <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              Mês
            </th>
            <th className="pb-2 pr-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              A Pagar
            </th>
            <th className="pb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
              Pago
            </th>
          </tr>
        </thead>
        <tbody>
          {resumo.map((r) => {
            const chave = `${r.ano}-${String(r.mes).padStart(2, '0')}`;
            const selecionado = mesSelecionado === chave;

            return (
              <tr
                key={chave}
                onClick={() => onMesSelecionado(selecionado ? null : chave)}
                className={`cursor-pointer border-b border-gray-100 transition-colors duration-100 hover:bg-gray-50 focus-within:bg-gray-50 ${
                  selecionado ? 'bg-blue-50' : ''
                }`}
                role="row"
                tabIndex={0}
                aria-selected={selecionado}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onMesSelecionado(selecionado ? null : chave);
                  }
                }}
              >
                <td className="py-2 pr-4">
                  <span
                    className={`font-medium ${selecionado ? 'text-blue-700' : 'text-gray-900'}`}
                  >
                    {r.mes_ano}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[48px] max-w-[80px] overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-orange-400 rounded-full"
                        style={{ width: barraWidth(r.total_a_pagar, maxValor) }}
                        role="presentation"
                      />
                    </div>
                    <span
                      className={`whitespace-nowrap font-medium ${
                        r.total_a_pagar > 0
                          ? 'text-orange-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {r.total_a_pagar > 0
                        ? formatarMoeda(r.total_a_pagar)
                        : '—'}
                    </span>
                  </div>
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[48px] max-w-[80px] overflow-hidden hidden sm:block">
                      <div
                        className="h-full bg-green-400 rounded-full"
                        style={{ width: barraWidth(r.total_pago, maxValor) }}
                        role="presentation"
                      />
                    </div>
                    <span
                      className={`whitespace-nowrap font-medium ${
                        r.total_pago > 0 ? 'text-green-700' : 'text-gray-400'
                      }`}
                    >
                      {r.total_pago > 0 ? formatarMoeda(r.total_pago) : '—'}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
