'use client';

import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Send,
} from 'lucide-react';
import type { LaudoMonitor } from './types';
import { formatarData, BadgeLaudoStatus } from './helpers';

interface TabelaLaudosProps {
  laudos: LaudoMonitor[];
  loading: boolean;
  erro: string | null;
  onNavigate?: (url: string) => void;
}

export function TabelaLaudos({
  laudos,
  loading,
  erro,
  onNavigate,
}: TabelaLaudosProps) {
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

  if (laudos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <FileText className="mx-auto text-gray-300 mb-4" size={48} />
        <p className="text-gray-500 font-medium">Nenhum laudo encontrado</p>
        <p className="text-gray-400 text-sm mt-1">
          Os laudos das suas empresas clientes aparecerão aqui
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
              Status Laudo
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Avaliações
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Emissor
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Emitido em
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Enviado em
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {laudos.map((laudo) => (
            <tr key={laudo.id} className="hover:bg-gray-50 transition-colors">
              {/* Empresa */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Building2
                    size={14}
                    className="text-gray-400 flex-shrink-0"
                  />
                  <span className="font-medium text-gray-800">
                    {laudo.empresa_nome}
                  </span>
                </div>
              </td>

              {/* Lote */}
              <td className="px-4 py-3">
                <button
                  onClick={() =>
                    onNavigate?.(`/rh/empresa/${laudo.empresa_id}`)
                  }
                  className="text-primary hover:underline font-medium"
                >
                  #{laudo.lote_id}
                </button>
                {laudo.lote_descricao && (
                  <p className="text-xs text-gray-500 truncate max-w-[180px]">
                    {laudo.lote_descricao}
                  </p>
                )}
              </td>

              {/* Status Laudo */}
              <td className="px-4 py-3">
                <BadgeLaudoStatus status={laudo.laudo_status} />
                {laudo.hash_pdf && (
                  <p
                    className="text-xs text-gray-400 mt-0.5 font-mono truncate max-w-[160px]"
                    title={laudo.hash_pdf}
                  >
                    {laudo.hash_pdf.slice(0, 12)}…
                  </p>
                )}
              </td>

              {/* Avaliações */}
              <td className="px-4 py-3 text-xs text-gray-700">
                <span className="font-semibold text-gray-900">
                  {laudo.avaliacoes_concluidas}
                </span>
                /{laudo.total_avaliacoes} concluídas
              </td>

              {/* Emissor */}
              <td className="px-4 py-3 text-xs text-gray-500">
                {laudo.emissor_nome ?? '—'}
              </td>

              {/* Emitido em */}
              <td className="px-4 py-3">
                {laudo.emitido_em ? (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <CheckCircle size={12} className="text-green-500" />
                    {formatarData(laudo.emitido_em)}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    Pendente
                  </div>
                )}
              </td>

              {/* Enviado em */}
              <td className="px-4 py-3">
                {laudo.enviado_em ? (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Send size={12} className="text-blue-500" />
                    {formatarData(laudo.enviado_em)}
                  </div>
                ) : laudo.arquivo_remoto_url ? (
                  <div>
                    <div className="flex items-center gap-1 text-xs text-teal-600">
                      <CheckCircle size={12} className="text-teal-500" />
                      No bucket
                    </div>
                    {laudo.arquivo_remoto_uploaded_at && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatarData(laudo.arquivo_remoto_uploaded_at)}
                      </p>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
