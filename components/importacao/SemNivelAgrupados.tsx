'use client';

import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { FuncaoNivelInfo, NivelCargo } from './NivelCargoStep';

interface SemNivelAgrupadosProps {
  funcoesNivelInfo: FuncaoNivelInfo[];
  nivelCargoMap: Record<string, NivelCargo>;
  onChange: (funcao: string, nivel: NivelCargo) => void;
}

export default function SemNivelAgrupados({
  funcoesNivelInfo,
  nivelCargoMap,
  onChange,
}: SemNivelAgrupadosProps) {
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      Map<string, { qtd: number; nomes: string[] }>
    >();
    for (const funcaoInfo of funcoesNivelInfo) {
      if (!funcaoInfo.funcionariosSemNivel?.length) continue;
      for (const entry of funcaoInfo.funcionariosSemNivel) {
        const empresa = entry.empresa || '(sem empresa)';
        if (!map.has(empresa)) map.set(empresa, new Map());
        const funcaoMap = map.get(empresa)!;
        if (!funcaoMap.has(funcaoInfo.funcao)) {
          funcaoMap.set(funcaoInfo.funcao, { qtd: 0, nomes: [] });
        }
        const e = funcaoMap.get(funcaoInfo.funcao)!;
        e.qtd++;
        if (entry.nome) e.nomes.push(entry.nome);
      }
    }
    return map;
  }, [funcoesNivelInfo]);

  // Fallback: sem dados de empresa → lista flat
  if (grouped.size === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-50">
          {funcoesNivelInfo.map((info) => {
            const nivel = nivelCargoMap[info.funcao] ?? '';
            return (
              <div
                key={info.funcao}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800">
                    {info.funcao === 'Não informado'
                      ? 'Sem função'
                      : info.funcao}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {info.qtdSemNivelNaPlanilha ?? 0} sem nível
                  </p>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() =>
                      onChange(info.funcao, nivel === 'gestao' ? '' : 'gestao')
                    }
                    className={`w-8 h-8 text-xs font-bold rounded-lg border-2 transition-colors ${
                      nivel === 'gestao'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                    }`}
                  >
                    G
                  </button>
                  <button
                    onClick={() =>
                      onChange(
                        info.funcao,
                        nivel === 'operacional' ? '' : 'operacional'
                      )
                    }
                    className={`w-8 h-8 text-xs font-bold rounded-lg border-2 transition-colors ${
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
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from(grouped.entries()).map(([empresa, funcaoMap]) => (
        <div
          key={empresa}
          className="bg-white border border-gray-300 rounded-lg overflow-hidden"
        >
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-300 font-semibold text-sm text-gray-800">
            {empresa}
          </div>

          <div className="divide-y divide-gray-200">
            {Array.from(funcaoMap.entries()).map(([funcao, { qtd, nomes }]) => {
              const nivel = nivelCargoMap[funcao] ?? '';
              const semFuncao = funcao === 'Não informado';
              return (
                <div key={funcao} className="p-4">
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
                        {qtd} funcionário{qtd !== 1 ? 's' : ''} sem nível
                        definido
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0 ml-4">
                      <button
                        onClick={() =>
                          onChange(funcao, nivel === 'gestao' ? '' : 'gestao')
                        }
                        className={`w-8 h-8 text-xs font-bold rounded-lg border-2 transition-colors ${
                          nivel === 'gestao'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                        }`}
                      >
                        G
                      </button>
                      <button
                        onClick={() =>
                          onChange(
                            funcao,
                            nivel === 'operacional' ? '' : 'operacional'
                          )
                        }
                        className={`w-8 h-8 text-xs font-bold rounded-lg border-2 transition-colors ${
                          nivel === 'operacional'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        O
                      </button>
                    </div>
                  </div>

                  {nomes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {nomes.map((nome, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full"
                        >
                          {nome}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
