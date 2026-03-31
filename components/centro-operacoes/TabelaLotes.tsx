'use client';

import { AlertCircle, Building2, FolderOpen } from 'lucide-react';
import type { LoteMonitor } from './types';
import {
  formatarData,
  BadgeLoteStatus,
  BadgeLaudoStatus,
  getStatusEfetivoLote,
  isLoteTotalmenteInativado,
} from './helpers';

interface TabelaLotesProps {
  lotes: LoteMonitor[];
  loading: boolean;
  erro: string | null;
  onNavigate?: (url: string) => void;
}

export function TabelaLotes({
  lotes,
  loading,
  erro,
  onNavigate,
}: TabelaLotesProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center gap-3">
        <AlertCircle className="text-red-500 flex-shrink-0" size={24} />
        <p className="text-red-700 text-sm">{erro}</p>
      </div>
    );
  }

  if (lotes.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <FolderOpen className="mx-auto text-gray-300 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Nenhum lote encontrado</p>
        <p className="text-gray-400 text-sm mt-1">
          Os lotes das suas empresas clientes aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Empresa
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Lote
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status Lote
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Avaliações
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Laudo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Liberado em
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Emitido em
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {lotes.map((lote) => {
            const pct =
              lote.total_avaliacoes > 0
                ? Math.round(
                    (lote.avaliacoes_concluidas / lote.total_avaliacoes) * 100
                  )
                : 0;
            const todasInativadas = isLoteTotalmenteInativado(lote);

            return (
              <tr key={lote.id} className="hover:bg-gray-50 transition-colors">
                {/* Empresa */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Building2
                      size={14}
                      className="text-gray-400 flex-shrink-0"
                    />
                    <span className="font-medium text-gray-800">
                      {lote.empresa_nome}
                    </span>
                  </div>
                </td>

                {/* Lote */}
                <td className="px-4 py-3">
                  <button
                    onClick={() =>
                      onNavigate?.(`/rh/empresa/${lote.empresa_id}`)
                    }
                    className="text-primary hover:underline font-medium"
                  >
                    #{lote.id}
                  </button>
                  {lote.descricao && (
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                      {lote.descricao}
                    </p>
                  )}
                </td>

                {/* Status Lote */}
                <td className="px-4 py-3">
                  <BadgeLoteStatus status={getStatusEfetivoLote(lote)} />
                  {todasInativadas && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Todas inativadas
                    </p>
                  )}
                </td>

                {/* Avaliações */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-700">
                      <span className="font-semibold text-gray-900">
                        {lote.avaliacoes_concluidas}
                      </span>
                      /{lote.total_avaliacoes}
                    </span>
                    {lote.total_avaliacoes > 0 && (
                      <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                    <span className="text-xs text-gray-500">{pct}%</span>
                  </div>
                </td>

                {/* Laudo */}
                <td className="px-4 py-3">
                  {todasInativadas ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                      N/A
                    </span>
                  ) : lote.emissao_solicitada &&
                    lote.laudo_status === 'rascunho' ? (
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                        Aguardando Emissor
                      </span>
                      {lote.emissao_solicitado_em && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          desde {formatarData(lote.emissao_solicitado_em)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <BadgeLaudoStatus status={lote.laudo_status} />
                  )}
                </td>

                {/* Liberado em */}
                <td className="px-4 py-3 text-xs text-gray-500">
                  {formatarData(lote.liberado_em)}
                </td>

                {/* Emitido em */}
                <td className="px-4 py-3 text-xs text-gray-500">
                  {formatarData(lote.emitido_em)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
