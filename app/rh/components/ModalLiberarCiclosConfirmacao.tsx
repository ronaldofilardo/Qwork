'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Zap,
  X,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import type { EmpresaOverview } from '@/app/api/rh/empresas-overview/route';
import type { BulkLiberarResponse } from '@/app/api/rh/empresas-bulk/liberar-ciclos/route';

interface ModalLiberarCiclosConfirmacaoProps {
  isOpen: boolean;
  empresas: EmpresaOverview[];
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStage = 'resumo' | 'confirmacao' | 'loading' | 'result';

export default function ModalLiberarCiclosConfirmacao({
  isOpen,
  empresas,
  onClose,
  onSuccess,
}: ModalLiberarCiclosConfirmacaoProps) {
  const [stage, setStage] = useState<ModalStage>('resumo');
  const [resultado, setResultado] = useState<BulkLiberarResponse | null>(null);
  const [motivo, setMotivo] = useState('');

  if (!isOpen) return null;

  const totalFuncionarios = empresas.reduce(
    (acc, e) => acc + e.elegibilidade.count_elegiveis,
    0
  );

  async function handleConfirmar() {
    setStage('loading');
    try {
      const res = await fetch('/api/rh/empresas-bulk/liberar-ciclos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa_ids: empresas.map((e) => e.id),
          motivo: motivo.trim() || undefined,
        }),
      });
      const data: BulkLiberarResponse = await res.json();
      setResultado(data);
      setStage('result');
      if (data.total_liberado > 0) {
        onSuccess();
      }
    } catch {
      setResultado({
        sucesso: false,
        total_processado: empresas.length,
        total_liberado: 0,
        total_erros: empresas.length,
        detalhes: empresas.map((e) => ({
          empresa_id: e.id,
          empresa_nome: e.nome,
          sucesso: false,
          erro: 'Erro de comunicação',
        })),
      });
      setStage('result');
    }
  }

  function handleFechar() {
    setStage('resumo');
    setResultado(null);
    setMotivo('');
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
              <Zap size={18} className="text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">
              {stage === 'result'
                ? 'Resultado da Operação'
                : stage === 'confirmacao'
                  ? 'Confirmar Liberação'
                  : 'Liberar Ciclos de Avaliação'}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleFechar}
            disabled={stage === 'loading'}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo: Resumo (1ª tela) */}
        {stage === 'resumo' && (
          <div className="px-6 py-5 space-y-4">
            {/* Totalizador */}
            <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{empresas.length}</span> empresa
                {empresas.length !== 1 ? 's' : ''} selecionada
                {empresas.length !== 1 ? 's' : ''}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{totalFuncionarios}</span>{' '}
                funcionário{totalFuncionarios !== 1 ? 's' : ''} elegíve
                {totalFuncionarios !== 1 ? 'is' : 'l'} no total
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{totalFuncionarios}</span>{' '}
                avaliação{totalFuncionarios !== 1 ? 'ões' : ''} será
                {totalFuncionarios !== 1 ? 'ão' : ''} liberada
                {totalFuncionarios !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Lista de empresas com contagens */}
            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
              {empresas.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between px-3 py-2.5"
                >
                  <span className="text-sm text-gray-800 truncate">
                    {e.nome}
                  </span>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0 bg-gray-100 rounded px-2 py-0.5">
                    {e.elegibilidade.count_elegiveis} func. elegíve
                    {e.elegibilidade.count_elegiveis !== 1 ? 'is' : 'l'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conteúdo: Confirmação final (2ª tela) */}
        {stage === 'confirmacao' && (
          <div className="px-6 py-5 space-y-4">
            {/* Aviso de irreversibilidade */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <AlertTriangle
                size={18}
                className="flex-shrink-0 text-amber-500 mt-0.5"
              />
              <p className="text-sm text-amber-800">
                Esta operação é <strong>irreversível</strong>. Um novo ciclo
                será criado para cada empresa selecionada e não poderá ser
                desfeito automaticamente.
              </p>
            </div>

            {/* Campo de nota de auditoria */}
            <div>
              <label
                htmlFor="motivo-liberacao"
                className="block text-xs font-medium text-gray-600 mb-1"
              >
                Nota de auditoria (opcional)
              </label>
              <textarea
                id="motivo-liberacao"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Justificativa ou observação sobre esta liberação em massa..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary-400"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {motivo.length}/500
              </p>
            </div>
          </div>
        )}

        {/* Conteúdo: Loading */}
        {stage === 'loading' && (
          <div className="px-6 py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 size={36} className="text-primary animate-spin" />
            <p className="text-sm text-gray-600">
              Processando liberação de ciclos...
            </p>
            <p className="text-xs text-gray-400">
              Isso pode levar alguns segundos para muitas empresas.
            </p>
          </div>
        )}

        {/* Conteúdo: Resultado */}
        {stage === 'result' && resultado && (
          <div className="px-6 py-5 space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-gray-50 rounded-lg py-3">
                <p className="text-xl font-bold text-gray-900">
                  {resultado.total_processado}
                </p>
                <p className="text-xs text-gray-500">Processadas</p>
              </div>
              <div className="text-center bg-green-50 rounded-lg py-3">
                <p className="text-xl font-bold text-green-700">
                  {resultado.total_liberado}
                </p>
                <p className="text-xs text-green-600">Liberadas</p>
              </div>
              <div className="text-center bg-red-50 rounded-lg py-3">
                <p className="text-xl font-bold text-red-700">
                  {resultado.total_erros}
                </p>
                <p className="text-xs text-red-600">Com erro</p>
              </div>
            </div>

            {/* Detalhes por empresa */}
            <div className="max-h-48 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
              {resultado.detalhes.map((d) => (
                <div
                  key={d.empresa_id}
                  className="flex items-start gap-2 px-3 py-2"
                >
                  {d.sucesso ? (
                    <CheckCircle
                      size={15}
                      className="flex-shrink-0 text-green-500 mt-0.5"
                    />
                  ) : (
                    <XCircle
                      size={15}
                      className="flex-shrink-0 text-red-500 mt-0.5"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">
                      {d.empresa_nome}
                    </p>
                    {d.sucesso ? (
                      <p className="text-xs text-gray-500">
                        Ciclo #{d.numero_ordem} — {d.avaliacoes_criadas}{' '}
                        avaliações
                      </p>
                    ) : (
                      <p className="text-xs text-red-500 truncate">{d.erro}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          {stage === 'resumo' && (
            <>
              <button
                type="button"
                onClick={handleFechar}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setStage('confirmacao')}
                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
              >
                Avançar →
              </button>
            </>
          )}
          {stage === 'confirmacao' && (
            <>
              <button
                type="button"
                onClick={() => setStage('resumo')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Zap size={15} />
                Confirmar Liberação
              </button>
            </>
          )}
          {stage === 'result' && (
            <button
              type="button"
              onClick={handleFechar}
              className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
