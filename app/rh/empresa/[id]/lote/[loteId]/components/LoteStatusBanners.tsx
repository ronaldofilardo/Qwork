'use client';

import React from 'react';
import toast from 'react-hot-toast';
import {
  XCircle,
  CheckCircle2,
  CreditCard,
  ClipboardList,
  Download,
  Lock,
  Copy,
  SendHorizontal,
} from 'lucide-react';
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
  estatisticas: _estatisticas,
  solicitarEmissao,
  downloadLaudo,
}: LoteStatusBannersProps) {
  // Regra 70% (Migration 1130): o trigger DB seta status='concluido' quando >= 70% concluidas.
  const canSolicitarEmissao =
    lote.status === 'concluido' && !lote.emissao_solicitada && !lote.tem_laudo;

  return (
    <>
      {/* Lote Cancelado */}
      {lote.status === 'cancelado' && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-l-4 border-red-300 rounded-lg">
            <div className="flex-shrink-0 w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-900 mb-0.5">Lote Cancelado</h4>
              <p className="text-sm text-red-700">
                Todas as avaliacoes foram removidas. O lote nao pode mais ser editado ou emitido.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botao de Solicitacao de Emissao */}
      {canSolicitarEmissao && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-l-4 border-emerald-400 rounded-lg mb-3">
            <div className="flex-shrink-0 w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Pronto para emissao</h4>
              <p className="text-sm text-gray-600">
                70% ou mais das avaliacoes foram concluidas. Solicite a emissao do laudo.
              </p>
            </div>
          </div>
          <button
            onClick={solicitarEmissao}
            className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <SendHorizontal className="w-4 h-4" />
            Solicitar Emissao do Laudo
          </button>
        </div>
      )}

      {/* Aguardando Pagamento */}
      {lote.emissao_solicitada &&
        !lote.tem_laudo &&
        lote.status_pagamento === 'aguardando_pagamento' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-l-4 border-amber-400 rounded-lg">
              <div className="flex-shrink-0 w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Aguardando Pagamento</h4>
                <p className="text-sm text-gray-600">
                  O link de pagamento foi gerado. Aguardando confirmacao para iniciar a emissao.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Pagamento Confirmado - Aguardando Emissao */}
      {lote.emissao_solicitada &&
        !lote.tem_laudo &&
        lote.status_pagamento === 'pago' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-l-4 border-blue-400 rounded-lg">
              <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">
                  Pagamento confirmado — aguardando emissao
                </h4>
                <p className="text-sm text-gray-600">
                  Solicitado em{' '}
                  {lote.emissao_solicitado_em
                    ? formatDate(lote.emissao_solicitado_em)
                    : 'data nao disponivel'}
                  . O laudo esta na fila de emissao.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Emissao Solicitada (aguardando cobranca) */}
      {lote.emissao_solicitada &&
        !lote.tem_laudo &&
        lote.status_pagamento !== 'aguardando_pagamento' &&
        lote.status_pagamento !== 'pago' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-l-4 border-blue-400 rounded-lg">
              <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">Emissao Solicitada</h4>
                <p className="text-sm text-gray-600">
                  Solicitado em{' '}
                  {lote.emissao_solicitado_em
                    ? formatDate(lote.emissao_solicitado_em)
                    : 'data nao disponivel'}
                  . O laudo esta sendo processado pelo emissor.
                </p>
              </div>
            </div>
          </div>
        )}

      {/* Laudo Emitido */}
      {lote.tem_laudo && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-l-4 border-emerald-400 rounded-lg mb-3">
            <div className="flex-shrink-0 w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-0.5">
                Laudo Emitido{lote.laudo_status === 'enviado' ? ' e Enviado' : ''}
              </h4>
              <p className="text-sm text-gray-600">
                {lote.emitido_em ? <>Emitido em {formatDate(lote.emitido_em)}.</> : 'Laudo disponivel.'}
                {lote.emissor_nome && <> Por {lote.emissor_nome}.</>}
              </p>
            </div>
          </div>

          {/* Botao Download */}
          {lote.laudo_id && lote.arquivo_remoto_url && (
            <button
              onClick={downloadLaudo}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors mb-3"
            >
              <Download className="w-4 h-4" />
              Ver Laudo / Baixar PDF
            </button>
          )}

          {/* Hash de Integridade */}
          {lote.hash_pdf && (
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3 h-3" />
                  Verificacao do PDF (SHA-256)
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard
                      .writeText(lote.hash_pdf!)
                      .then(() => toast.success('Hash copiado!'))
                      .catch(() => toast.error('Erro ao copiar hash'));
                  }}
                  className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs hover:bg-gray-200 transition-colors border border-gray-200"
                >
                  <Copy className="w-3 h-3" />
                  Copiar
                </button>
              </div>
              <code className="text-[10px] font-mono text-gray-600 break-all block">
                {lote.hash_pdf}
              </code>
              <p className="text-xs text-gray-400 mt-1.5">
                Compare este hash para verificar a autenticidade do PDF.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
