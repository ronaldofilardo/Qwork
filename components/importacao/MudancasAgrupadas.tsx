'use client';

import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { FuncaoNivelInfo, NivelCargo } from './NivelCargoStep';
import { groupMudancasByEmpresaAndFuncao } from './NivelCargoStep';

interface MudancasAgrupadasProps {
  funcoesNivelInfo: FuncaoNivelInfo[];
  nivelCargoMap: Record<string, NivelCargo>;
  onChange: (funcao: string, nivel: NivelCargo) => void;
}

function nivelLabel(v: 'gestao' | 'operacional' | null) {
  return v === 'gestao' ? (
    <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full font-medium text-xs">
      G gestão
    </span>
  ) : v === 'operacional' ? (
    <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium text-xs">
      O operacional
    </span>
  ) : (
    <span className="text-gray-400 italic text-xs">não definido</span>
  );
}

export default function MudancasAgrupadas({
  funcoesNivelInfo,
  nivelCargoMap,
  onChange,
}: MudancasAgrupadasProps) {
  const grouped = groupMudancasByEmpresaAndFuncao(funcoesNivelInfo);

  if (grouped.size === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle
          size={18}
          className="text-amber-600 flex-shrink-0 mt-0.5"
        />
        <div>
          <p className="text-sm font-medium text-amber-900">
            Mudanças de função detectadas
          </p>
          <p className="text-xs text-amber-800 mt-0.5">
            Revise e classifique o nível de cargo para cada mudança abaixo.
          </p>
        </div>
      </div>

      {Array.from(grouped.entries()).map(([empresa, funcaosMap]) => (
        <div
          key={empresa}
          className="bg-white border border-gray-300 rounded-lg overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-300 font-semibold text-sm text-gray-800">
            {empresa}
          </div>

          <div className="divide-y divide-gray-200">
            {Array.from(funcaosMap.entries()).map(
              ([funcao, { trocas, trocasNivel }]) => {
                const nivelClassificado = nivelCargoMap[funcao] ?? '';
                const semFuncao = funcao === 'Não informado';
                return (
                  <div key={`${empresa}-${funcao}`} className="p-4">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                      <div className="flex-1">
                        {semFuncao ? (
                          <p className="text-sm font-semibold text-amber-700 flex items-center gap-1">
                            <AlertTriangle size={13} className="inline" /> Sem
                            função definida
                          </p>
                        ) : (
                          <p className="text-sm font-semibold text-gray-800">
                            {funcao}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {trocas.length + trocasNivel.length} alteração
                          {trocas.length + trocasNivel.length !== 1
                            ? 'ões'
                            : ''}
                        </p>
                      </div>
                      {nivelClassificado && (
                        <div className="flex-shrink-0 ml-4">
                          <div className="flex items-center gap-2">
                            {nivelClassificado === 'gestao' ? (
                              <>
                                <CheckCircle
                                  size={14}
                                  className="text-purple-600"
                                />
                                <span className="text-xs font-medium text-purple-700">
                                  Gestão
                                </span>
                              </>
                            ) : nivelClassificado === 'operacional' ? (
                              <>
                                <CheckCircle
                                  size={14}
                                  className="text-blue-600"
                                />
                                <span className="text-xs font-medium text-blue-700">
                                  Operacional
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>

                    {trocas.length > 0 && (
                      <table className="w-full text-xs mb-3 border border-gray-100 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-gray-500">
                            <th className="px-3 py-2 font-medium">Nome</th>
                            <th className="px-3 py-2 font-medium">
                              Era (func.)
                            </th>
                            <th className="px-3 py-2 font-medium text-right">
                              Nível atual
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {trocas.map((troca, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-gray-800 font-medium">
                                {troca.nome}
                              </td>
                              <td className="px-3 py-2 text-gray-600">
                                {troca.funcaoAnterior}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {nivelLabel(troca.nivelAtual)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {trocasNivel.length > 0 && (
                      <table className="w-full text-xs mb-3 border border-gray-100 rounded-lg overflow-hidden">
                        <thead className="bg-gray-50">
                          <tr className="text-left text-gray-500">
                            <th className="px-3 py-2 font-medium">Nome</th>
                            <th className="px-3 py-2 font-medium">
                              Nível atual
                            </th>
                            <th className="px-3 py-2 font-medium text-right">
                              Proposto
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {trocasNivel.map((troca, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-gray-800 font-medium">
                                {troca.nome}
                              </td>
                              <td className="px-3 py-2">
                                {nivelLabel(troca.nivelAtual)}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {nivelLabel(troca.nivelProposto)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-700 mb-2 font-semibold">
                        {semFuncao ? (
                          'Qual nível para funcionários sem função definida?'
                        ) : (
                          <>Qual nível para &ldquo;{funcao}&rdquo;?</>
                        )}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onChange(funcao, 'gestao')}
                          className={`flex-1 py-2.5 text-sm font-bold rounded-lg border-2 transition-colors ${
                            nivelClassificado === 'gestao'
                              ? 'bg-purple-600 text-white border-purple-600'
                              : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                          }`}
                        >
                          G — Gestão
                        </button>
                        <button
                          onClick={() => onChange(funcao, 'operacional')}
                          className={`flex-1 py-2.5 text-sm font-bold rounded-lg border-2 transition-colors ${
                            nivelClassificado === 'operacional'
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          O — Operacional
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
