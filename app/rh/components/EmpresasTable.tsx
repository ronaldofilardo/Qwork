'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Users } from 'lucide-react';
import type { EmpresaOverview } from '@/app/api/rh/empresas-overview/route';
import StatusBadge from './StatusBadge';

interface EmpresasTableProps {
  empresas: EmpresaOverview[];
  selecionadas: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onEditEmpresa: (empresaId: number) => void;
}

export default function EmpresasTable({
  empresas,
  selecionadas,
  onToggle,
  onToggleAll,
  onEditEmpresa,
}: EmpresasTableProps) {
  const router = useRouter();

  const elegiveisIds = empresas
    .filter((e) => e.elegibilidade.elegivel)
    .map((e) => e.id);

  const todasElegiveisSelected =
    elegiveisIds.length > 0 && elegiveisIds.every((id) => selecionadas.has(id));

  if (empresas.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
        <Users className="mx-auto text-gray-300 mb-3" size={48} />
        <p className="text-gray-600">
          Nenhuma empresa encontrada para os filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  title="Selecionar todas as elegíveis"
                  checked={todasElegiveisSelected}
                  onChange={onToggleAll}
                  disabled={elegiveisIds.length === 0}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Lote
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ciclo Atual
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Elegibilidade
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Laudos
              </th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empresas.map((empresa) => {
              const lote = empresa.lote_atual;
              const elegivel = empresa.elegibilidade.elegivel;
              const isSelected = selecionadas.has(empresa.id);

              return (
                <tr
                  key={empresa.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!elegivel}
                      onChange={() => onToggle(empresa.id)}
                      title={
                        !elegivel
                          ? (empresa.elegibilidade.motivo_bloqueio ??
                            'Não elegível')
                          : 'Selecionar para liberar ciclo'
                      }
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-40"
                    />
                  </td>

                  {/* Empresa */}
                  <td className="px-4 py-3">
                    <div>
                      <button
                        type="button"
                        onClick={() => onEditEmpresa(empresa.id)}
                        className="font-medium text-primary-600 hover:text-primary-800 hover:underline text-sm text-left"
                      >
                        {empresa.nome}
                      </button>
                      <p className="text-xs text-gray-400">{empresa.cnpj}</p>
                    </div>
                  </td>

                  {/* Lote */}
                  <td className="px-4 py-3">
                    {lote ? (
                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{lote.id}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Ciclo Atual */}
                  <td className="px-4 py-3">
                    {lote ? (
                      <StatusBadge
                        status={lote.status}
                        pagamento={
                          empresa.lote_anterior?.status_pagamento ?? undefined
                        }
                      />
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        Sem ciclo
                      </span>
                    )}
                  </td>

                  {/* Elegibilidade */}
                  <td className="px-4 py-3">
                    {elegivel ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
                          Elegível
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {empresa.elegibilidade.count_elegiveis} funcionário
                          {empresa.elegibilidade.count_elegiveis !== 1
                            ? 's'
                            : ''}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Bloqueado
                        </span>
                        {empresa.elegibilidade.motivo_bloqueio && (
                          <p
                            className="text-xs text-gray-400 mt-0.5 max-w-[140px] truncate"
                            title={empresa.elegibilidade.motivo_bloqueio}
                          >
                            {empresa.elegibilidade.motivo_bloqueio}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Laudos */}
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-0.5">
                      {empresa.laudos_status.aguardando_emissao > 0 && (
                        <p className="text-orange-600">
                          {empresa.laudos_status.aguardando_emissao} aguardando
                          link pgto
                        </p>
                      )}
                      {empresa.laudos_status.aguardando_pagamento > 0 && (
                        <p className="text-yellow-600">
                          {empresa.laudos_status.aguardando_pagamento} aguard.
                          pgto
                        </p>
                      )}
                      {empresa.laudos_status.pago > 0 && (
                        <p className="text-teal-600">
                          {empresa.laudos_status.pago} pago — aguard. emissão
                        </p>
                      )}
                      {empresa.laudos_status.laudo_emitido > 0 && (
                        <p className="text-green-600">
                          {empresa.laudos_status.laudo_emitido} disponível(eis)
                        </p>
                      )}
                      {empresa.laudos_status.aguardando_emissao === 0 &&
                        empresa.laudos_status.aguardando_pagamento === 0 &&
                        empresa.laudos_status.pago === 0 &&
                        empresa.laudos_status.laudo_emitido === 0 && (
                          <span className="text-gray-400">—</span>
                        )}
                    </div>
                  </td>

                  {/* Ação */}
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => router.push(`/rh/empresa/${empresa.id}`)}
                      title="Ver detalhes da empresa"
                      className="text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
