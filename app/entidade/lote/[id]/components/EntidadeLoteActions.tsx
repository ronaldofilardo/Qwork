'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FileText } from 'lucide-react';
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
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              A&#231;&#245;es do Lote
            </h3>
            <p className="text-sm text-gray-600">
              Gerar relat&#243;rios e exportar dados
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDownloadReport}
              disabled={!laudoEmitido}
              title={
                !laudoEmitido
                  ? 'Aguardando emissão do laudo'
                  : 'Gerar relatório PDF do lote'
              }
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FileText size={18} />
              Gerar Relat&#243;rio PDF
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
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <FileText size={18} />
              Gerar relat&#243;rio PDF por SETOR
            </button>
          </div>
        </div>

        {/* Solicitar Emiss&#227;o */}
        {canSolicitarEmissao && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">&#x2705;</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Lote Conclu&#237;do &#8212; Pronto para Emiss&#227;o
                  </h4>
                  <p className="text-sm text-gray-700">
                    Pelo menos 70% das avalia&#231;&#245;es foram
                    conclu&#237;das. Avalia&#231;&#245;es ainda em andamento
                    ser&#227;o inativadas automaticamente ao solicitar.
                  </p>
                </div>
              </div>
              <button
                onClick={solicitarEmissao}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold text-base flex items-center justify-center gap-2 shadow-md"
              >
                <span className="text-xl">&#x1F680;</span>
                <span>Solicitar Emiss&#227;o do Laudo</span>
              </button>
            </div>
          </div>
        )}

        {/* Emiss&#227;o Solicitada */}
        {lote.emissao_solicitada && !lote.tem_laudo && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">&#x1F4CB;</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Emiss&#227;o Solicitada
                  </h4>
                  <p className="text-sm text-gray-700">
                    A emiss&#227;o do laudo foi solicitada em{' '}
                    {lote.emissao_solicitado_em
                      ? formatDate(lote.emissao_solicitado_em)
                      : 'data n&#227;o dispon&#237;vel'}
                    . O laudo est&#225; sendo processado pelo emissor.
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
                  <span className="text-2xl">&#x2705;</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    Laudo Emitido
                  </h4>
                  <p className="text-sm text-gray-700 mb-2">
                    O laudo deste lote j&#225; foi emitido{' '}
                    {lote.laudo_status === 'enviado' ? 'e enviado' : ''}.
                    {lote.emitido_em && (
                      <> Emitido em {formatDate(lote.emitido_em)}</>
                    )}
                  </p>
                  {lote.emissor_cpf && (
                    <p className="text-xs text-purple-700">
                      Emissor: {lote.emissor_cpf}
                    </p>
                  )}
                </div>
              </div>

              {lote.arquivo_remoto_url && (
                <button
                  onClick={handleDownloadLaudo}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors mb-3 font-medium"
                >
                  &#x1F4C4; Ver Laudo / Baixar PDF
                </button>
              )}

              {lote.hash_pdf && (
                <div className="bg-white p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-purple-800 uppercase">
                      &#x1F512; Hash de Integridade (SHA-256)
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
                      &#x1F4CB; Copiar
                    </button>
                  </div>
                  <code className="text-[10px] font-mono text-gray-700 break-all block">
                    {lote.hash_pdf}
                  </code>
                  <p className="text-xs text-purple-600 mt-2">
                    Use este hash para verificar a autenticidade e integridade
                    do PDF
                  </p>
                </div>
              )}
            </div>
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
