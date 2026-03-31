'use client';

import { useState, useCallback } from 'react';
import { X, ShieldCheck } from 'lucide-react';

export type NivelCargo = 'gestao' | 'operacional' | '';

export interface NivelCargoEntry {
  funcao: string;
  nivel: NivelCargo;
}

interface NivelCargoModalProps {
  funcoes: string[];
  initialMap?: Record<string, string>;
  contexto?: 'inicial' | 'mudanca_funcao';
  onConfirm: (mapeamento: Record<string, NivelCargo>) => void;
  onSkip: () => void;
}

export default function NivelCargoModal({
  funcoes,
  initialMap,
  contexto = 'inicial',
  onConfirm,
  onSkip,
}: NivelCargoModalProps) {
  const [mapa, setMapa] = useState<Record<string, NivelCargo>>(() => {
    const initial: Record<string, NivelCargo> = {};
    for (const f of funcoes) {
      const preset = initialMap?.[f];
      initial[f] =
        preset === 'gestao' || preset === 'operacional' ? preset : '';
    }
    return initial;
  });

  const handleToggle = useCallback((funcao: string, nivel: NivelCargo) => {
    setMapa((prev) => ({
      ...prev,
      [funcao]: prev[funcao] === nivel ? '' : nivel,
    }));
  }, []);

  const handleDefinirTodos = useCallback((nivel: NivelCargo) => {
    setMapa((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) next[k] = nivel;
      return next;
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-primary" />
            <h2 className="text-base font-semibold text-gray-900">
              Classificar Nível de Cargo
            </h2>
          </div>
          <button
            onClick={onSkip}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X size={18} />
          </button>
        </div>

        <p className="px-5 pt-3 pb-1 text-sm text-gray-600">
          {contexto === 'mudanca_funcao' ? (
            <>
              Alguns funcionários <strong>mudaram de função</strong> nesta
              planilha. Revise ou reclassifique o nível de cargo para cada nova
              função abaixo.
            </>
          ) : (
            <>
              A planilha não tem coluna <strong>Nível de Cargo</strong>.
              Classifique cada cargo abaixo ou pule essa etapa.
            </>
          )}
        </p>

        {/* Ação rápida */}
        <div className="px-5 py-2 flex items-center gap-2 text-xs">
          <span className="text-gray-500">Definir todos como:</span>
          <button
            onClick={() => handleDefinirTodos('gestao')}
            className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200"
          >
            Gestão
          </button>
          <button
            onClick={() => handleDefinirTodos('operacional')}
            className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200"
          >
            Operacional
          </button>
          <button
            onClick={() => handleDefinirTodos('')}
            className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            Não definido
          </button>
        </div>

        {/* Lista de cargos */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100 px-5">
          {funcoes.map((funcao) => {
            const nivel = mapa[funcao];
            return (
              <div
                key={funcao}
                className="flex items-center justify-between py-2 gap-3"
              >
                <span
                  className="text-sm text-gray-800 flex-1 truncate"
                  title={funcao}
                >
                  {funcao}
                </span>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(funcao, 'gestao')}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                      nivel === 'gestao'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    G
                  </button>
                  <button
                    onClick={() => handleToggle(funcao, 'operacional')}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                      nivel === 'operacional'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    O
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Resumo + Botões */}
        <div className="border-t border-gray-200 p-5 space-y-3">
          <div className="text-xs text-gray-500 flex gap-4">
            <span>
              Gestão:{' '}
              <strong>
                {Object.values(mapa).filter((v) => v === 'gestao').length}
              </strong>
            </span>
            <span>
              Operacional:{' '}
              <strong>
                {Object.values(mapa).filter((v) => v === 'operacional').length}
              </strong>
            </span>
            <span>
              Não definido:{' '}
              <strong>
                {Object.values(mapa).filter((v) => v === '').length}
              </strong>
            </span>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onSkip}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Pular
            </button>
            <button
              onClick={() => onConfirm(mapa)}
              className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover"
            >
              Confirmar e Importar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
