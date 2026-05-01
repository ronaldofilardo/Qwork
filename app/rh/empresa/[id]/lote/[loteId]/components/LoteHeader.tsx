'use client';

import React, { useState } from 'react';
import { formatarData } from '@/lib/lote/utils';
import ModalSetorRelatorioPDF from '@/components/ModalSetorRelatorioPDF';
import { ArrowLeft, FileText, BarChart2, AlertTriangle } from 'lucide-react';
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

  const statusMap: Record<string, { label: string; cls: string }> = {
    cancelado: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
    concluido: { label: 'Concluído', cls: 'bg-green-100 text-green-700' },
    finalizado: { label: 'Finalizado', cls: 'bg-teal-100 text-teal-700' },
    ativo: { label: 'Ativo', cls: 'bg-blue-100 text-blue-700' },
  };
  const badge = statusMap[lote.status] ?? {
    label: lote.status,
    cls: 'bg-gray-100 text-gray-600',
  };

  return (
    <>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1.5">
                Detalhes do Lote
              </p>
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-2xl font-bold text-gray-900">#{lote.id}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${badge.cls}`}
                >
                  {badge.label}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                <div className="flex gap-1.5">
                  <span className="text-gray-400 shrink-0">Empresa</span>
                  <span className="font-medium text-gray-800 truncate">
                    {lote.empresa_nome}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-gray-400 shrink-0">Tipo</span>
                  <span className="font-medium text-gray-800">
                    {lote.tipo === 'completo'
                      ? 'Completo'
                      : lote.tipo === 'operacional'
                        ? 'Operacional'
                        : 'Gestão'}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-gray-400 shrink-0">Liberado em</span>
                  <span className="font-medium text-gray-800">
                    {formatarData(lote.liberado_em)}
                  </span>
                </div>
                {lote.liberado_por_nome && (
                  <div className="flex gap-1.5">
                    <span className="text-gray-400 shrink-0">Liberado por</span>
                    <span className="font-medium text-gray-800 truncate">
                      {lote.liberado_por_nome}
                    </span>
                  </div>
                )}
              </div>
              {lote.descricao && (
                <p className="mt-3 text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3">
                  {lote.descricao}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 flex flex-col gap-2 lg:items-end">
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={gerarRelatorioLote}
                  disabled={!laudoEmitido}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  title={
                    !laudoEmitido
                      ? 'Aguardando emissão do laudo'
                      : 'Gerar relatório PDF do lote'
                  }
                >
                  <FileText size={15} />
                  {laudoEmitido ? 'Relatório PDF' : 'Aguardando laudo'}
                </button>

                <button
                  onClick={() => setShowSetorModal(true)}
                  disabled={!laudoEmitido || setores.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title={
                    !laudoEmitido
                      ? 'Aguardando emissão do laudo'
                      : setores.length === 0
                        ? 'Nenhum setor cadastrado neste ciclo'
                        : 'Gerar relatório por setor'
                  }
                >
                  <BarChart2 size={15} />
                  {laudoEmitido ? 'Por Setor' : 'Aguardando laudo'}
                </button>
              </div>

              {estatisticas.avaliacoes_inativadas > 0 && (
                <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 max-w-xs">
                  <AlertTriangle
                    size={13}
                    className="text-amber-500 mt-0.5 shrink-0"
                  />
                  <p>
                    <span className="font-semibold">
                      {estatisticas.avaliacoes_inativadas}
                    </span>{' '}
                    removida
                    {estatisticas.avaliacoes_inativadas !== 1 ? 's' : ''} —
                    contam no denominador dos 70%.
                  </p>
                </div>
              )}
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
