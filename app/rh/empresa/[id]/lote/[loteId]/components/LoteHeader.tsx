'use client';

import React, { useState } from 'react';
import { formatarData } from '@/lib/lote/utils';
import ModalSetorRelatorioPDF from '@/components/ModalSetorRelatorioPDF';
import type { LoteInfo, Estatisticas } from '../types';

interface LoteHeaderProps {
  lote: LoteInfo;
  estatisticas: Estatisticas;
  gerarRelatorioLote: () => void;
  gerarRelatorioSetor: (setor: string) => Promise<void>;
  setores: string[];
  onBack: () => void;
  children?: React.ReactNode;
}

export default function LoteHeader({
  lote,
  estatisticas,
  gerarRelatorioLote,
  gerarRelatorioSetor,
  setores,
  onBack,
  children,
}: LoteHeaderProps) {
  const [showSetorModal, setShowSetorModal] = useState(false);
  const laudoEmitido =
    lote.laudo_status === 'emitido' || lote.laudo_status === 'enviado';

  return (
    <>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 text-sm"
        >
          ← Voltar para Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Lote ID
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-gray-900">{lote.id}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    lote.status === 'cancelado'
                      ? 'bg-red-100 text-red-800'
                      : lote.status === 'concluido'
                        ? 'bg-green-100 text-green-800'
                        : lote.status === 'finalizado'
                          ? 'bg-teal-100 text-teal-800'
                          : lote.status === 'ativo'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {lote.status === 'cancelado'
                    ? 'Cancelado'
                    : lote.status === 'concluido'
                      ? 'Concluído'
                      : lote.status === 'finalizado'
                        ? 'Finalizado'
                        : lote.status === 'ativo'
                          ? 'Ativo'
                          : lote.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
                <div>
                  <span className="text-gray-500">Empresa:</span>{' '}
                  <span className="font-medium">{lote.empresa_nome}</span>
                </div>
                <div>
                  <span className="text-gray-500">Tipo:</span>{' '}
                  <span className="font-medium">
                    {lote.tipo === 'completo'
                      ? 'Completo'
                      : lote.tipo === 'operacional'
                        ? 'Operacional'
                        : 'Gestão'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Liberado em:</span>{' '}
                  <span className="font-medium">
                    {formatarData(lote.liberado_em)}
                  </span>
                </div>
                {lote.liberado_por_nome && (
                  <div>
                    <span className="text-gray-500">Liberado por:</span>{' '}
                    <span className="font-medium">
                      {lote.liberado_por_nome}
                    </span>
                  </div>
                )}
              </div>
              {lote.descricao && (
                <p className="mt-3 text-sm text-gray-600 italic">
                  {lote.descricao}
                </p>
              )}
            </div>

            <div className="w-full md:w-auto lg:w-72">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="w-full sm:w-44 md:w-48 flex-shrink-0 flex flex-col gap-2">
                  <button
                    onClick={gerarRelatorioLote}
                    disabled={!laudoEmitido}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                    aria-label="Gerar Relatório PDF do Lote"
                    title={
                      !laudoEmitido
                        ? 'Aguardando emissão do laudo'
                        : 'Gerar relatório PDF do lote'
                    }
                  >
                    {laudoEmitido
                      ? '📊 Gerar Relatório PDF'
                      : '⏳ Aguardando emissão'}
                  </button>

                  <button
                    onClick={() => setShowSetorModal(true)}
                    disabled={!laudoEmitido || setores.length === 0}
                    className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
                    aria-label="Gerar Relatório PDF por Setor"
                    title={
                      !laudoEmitido
                        ? 'Aguardando emissão do laudo'
                        : setores.length === 0
                          ? 'Nenhum setor cadastrado neste ciclo'
                          : 'Gerar relatório por setor'
                    }
                  >
                    {laudoEmitido
                      ? '📊 Gerar relatório PDF por SETOR'
                      : '⏳ Aguardando emissão'}
                  </button>

                  {estatisticas.avaliacoes_inativadas > 0 && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600 text-sm">⚠️</span>
                        <div>
                          <p className="font-medium mb-1">
                            Avaliações inativadas
                          </p>
                          <p className="text-xs">
                            {estatisticas.avaliacoes_inativadas} avaliação
                            {estatisticas.avaliacoes_inativadas !== 1
                              ? 'ões'
                              : ''}{' '}
                            inativada
                            {estatisticas.avaliacoes_inativadas !== 1
                              ? 's'
                              : ''}
                            . Contam no denominador dos 70% — o lote pode ser
                            liberado sem que sejam concluídas.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {children}
        </div>
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
