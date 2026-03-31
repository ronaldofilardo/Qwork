'use client';

import React from 'react';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/lote/utils';
import type { LoteInfo, Estatisticas } from '../types';

interface LoteStatusBannersProps {
  lote: LoteInfo;
  estatisticas: Estatisticas;
  solicitarEmissao: () => Promise<void>;
  downloadLaudo: () => Promise<void>;
}

export default function LoteStatusBanners({
  lote,
  estatisticas,
  solicitarEmissao,
  downloadLaudo,
}: LoteStatusBannersProps) {
  const canSolicitarEmissao =
    lote.status === 'concluido' &&
    estatisticas.avaliacoes_concluidas + estatisticas.avaliacoes_pendentes >
      0 &&
    estatisticas.avaliacoes_pendentes === 0 &&
    !lote.emissao_solicitada &&
    !lote.tem_laudo;

  return (
    <>
      {/* Lote Cancelado */}
      {lote.status === 'cancelado' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🚫</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">
                  Lote Cancelado
                </h4>
                <p className="text-sm text-red-700">
                  Todas as avaliações deste lote foram inativadas. O lote foi
                  cancelado automaticamente e não pode mais ser editado ou
                  emitido.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão de Solicitação de Emissão */}
      {canSolicitarEmissao && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Lote Concluído
                </h4>
                <p className="text-sm text-gray-700">
                  Todas as avaliações foram finalizadas. Você pode solicitar a
                  emissão do laudo.
                </p>
              </div>
            </div>
            <button
              onClick={solicitarEmissao}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-base flex items-center justify-center gap-2 shadow-md"
            >
              <span className="text-xl">🚀</span>
              <span>Solicitar Emissão do Laudo</span>
            </button>
          </div>
        </div>
      )}

      {/* Emissão Solicitada */}
      {lote.emissao_solicitada && !lote.tem_laudo && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Emissão Solicitada
                </h4>
                <p className="text-sm text-gray-700">
                  A emissão do laudo foi solicitada em{' '}
                  {lote.emissao_solicitado_em
                    ? formatDate(lote.emissao_solicitado_em)
                    : 'data não disponível'}
                  . O laudo está sendo processado pelo emissor.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Laudo Emitido */}
      {lote.tem_laudo && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-300 rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Laudo Emitido
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  O laudo deste lote já foi emitido{' '}
                  {lote.laudo_status === 'enviado' ? 'e enviado' : ''}.
                  {lote.emitido_em && (
                    <> Emitido em {formatDate(lote.emitido_em)}</>
                  )}
                </p>
                {lote.emissor_nome && (
                  <p className="text-xs text-purple-700">
                    Emissor: {lote.emissor_nome}
                  </p>
                )}
              </div>
            </div>

            {/* Botão Download Laudo */}
            {lote.laudo_id && lote.arquivo_remoto_url && (
              <button
                onClick={downloadLaudo}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors mb-3 font-medium"
              >
                📄 Ver Laudo / Baixar PDF
              </button>
            )}

            {/* Hash de Integridade */}
            {lote.hash_pdf && lote.arquivo_remoto_url && (
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-purple-800 uppercase">
                    🔒 Hash de Integridade (SHA-256)
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard
                        .writeText(lote.hash_pdf!)
                        .then(() => toast.success('Hash copiado!'))
                        .catch(() => toast.error('Erro ao copiar hash'));
                    }}
                    className="inline-flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                  >
                    📋 Copiar
                  </button>
                </div>
                <code className="text-[10px] font-mono text-gray-700 break-all block">
                  {lote.hash_pdf}
                </code>
                <p className="text-xs text-purple-600 mt-2">
                  Use este hash para verificar a autenticidade e integridade do
                  PDF
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
