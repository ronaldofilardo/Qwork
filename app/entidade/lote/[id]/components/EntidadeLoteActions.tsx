'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  FileText,
  SendHorizontal,
  ClipboardList,
  CheckCircle2,
  Lock,
  Copy,
  Download,
} from 'lucide-react';
import { formatDate } from '@/lib/lote/utils';
import ModalSetorRelatorioPDF from '@/components/ModalSetorRelatorioPDF';
import type { LoteInfoEntidade, EstatisticasEntidade } from '../types';

interface EntidadeLoteActionsProps {
  lote: LoteInfoEntidade;
  estatisticas: EstatisticasEntidade;
  handleDownloadReport: () => Promise<void>;
  handleDownloadLaudo: () => Promise<void>;
  solicitarEmissao: () => Promise<void>;
  gerarRelatorioSetor: (setor: string) => Promise<void>;
  setores: string[];
}

export default function EntidadeLoteActions({
  lote,
  estatisticas: _estatisticas,
  handleDownloadReport,
  handleDownloadLaudo,
  solicitarEmissao,
  gerarRelatorioSetor,
  setores,
}: EntidadeLoteActionsProps) {
  const [showSetorModal, setShowSetorModal] = useState(false);

  const laudoEmitido = lote.laudo_status === 'emitido';

  const canSolicitarEmissao =
    lote.status === 'concluido' && !lote.emissao_solicitada && !lote.tem_laudo;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
              Ações do Lote
            </h3>
            <p className="text-xs text-gray-500">
              Gerar relatórios e exportar dados
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadReport}
              disabled={!laudoEmitido}
              title={
                !laudoEmitido
                  ? 'Aguardando emissão do laudo'
                  : 'Gerar relatório PDF do lote'
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <FileText size={16} />
              Gerar Relatório PDF
            </button>
            <button
              onClick={() => setShowSetorModal(true)}
              disabled={!laudoEmitido || setores.length === 0}
              title={
                !laudoEmitido
                  ? 'Aguardando emissão do laudo'
                  : setores.length === 0
                    ? 'Nenhum setor cadastrado neste ciclo'
                    : 'Gerar relatório por setor'
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FileText size={16} />
              Por Setor
            </button>
          </div>
        </div>

        {/* Solicitar Emissão */}
        {canSolicitarEmissao && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-l-4 border-emerald-400 rounded-lg mb-3">
              <div className="flex-shrink-0 w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">
                  Pronto para emissão
                </h4>
                <p className="text-sm text-gray-600">
                  70% ou mais das avaliações foram concluídas. Avaliações em
                  andamento serão inativadas ao solicitar.
                </p>
              </div>
            </div>
            <button
              onClick={solicitarEmissao}
              className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm flex items-center justify-center gap-2"
            >
              <SendHorizontal className="w-4 h-4" />
              Solicitar Emissão do Laudo
            </button>
          </div>
        )}

        {/* Emissão Solicitada */}
        {lote.emissao_solicitada && !lote.tem_laudo && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-l-4 border-blue-400 rounded-lg">
              <div className="flex-shrink-0 w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">
                  Emissão Solicitada
                </h4>
                <p className="text-sm text-gray-600">
                  Solicitado em{' '}
                  {lote.emissao_solicitado_em
                    ? formatDate(lote.emissao_solicitado_em)
                    : 'data não disponível'}
                  . O laudo está sendo processado pelo emissor.
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
                  Laudo Emitido
                  {lote.laudo_status === 'enviado' ? ' e Enviado' : ''}
                </h4>
                <p className="text-sm text-gray-600">
                  {lote.emitido_em && (
                    <>Emitido em {formatDate(lote.emitido_em)}.</>
                  )}
                </p>
              </div>
            </div>

            {lote.arquivo_remoto_url && (
              <button
                onClick={handleDownloadLaudo}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors mb-3"
              >
                <Download className="w-4 h-4" />
                Ver Laudo / Baixar PDF
              </button>
            )}

            {lote.hash_pdf && (
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    Verificação do PDF (SHA-256)
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
      </div>

      <ModalSetorRelatorioPDF
        isOpen={showSetorModal}
        setores={setores}
        onClose={() => setShowSetorModal(false)}
        onConfirm={gerarRelatorioSetor}
      />
    </>
  );
}
