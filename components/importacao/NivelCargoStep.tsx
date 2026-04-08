'use client';

import { useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
  Users,
  Sparkles,
} from 'lucide-react';

export type NivelCargo = 'gestao' | 'operacional' | '';

export interface FuncaoNivelInfo {
  funcao: string;
  qtdFuncionarios: number;
  qtdNovos: number;
  qtdExistentes: number;
  niveisAtuais: Array<'gestao' | 'operacional' | null>;
  isMudancaRole: boolean;
  isMudancaNivel?: boolean;
  temNivelNuloExistente: boolean;
  funcionariosComMudanca?: Array<{
    nomeMascarado: string;
    funcaoAnterior: string;
    nivelAtual: 'gestao' | 'operacional' | null;
    empresa: string;
  }>;
  funcionariosComMudancaNivel?: Array<{
    nomeMascarado: string;
    nivelAtual: 'gestao' | 'operacional' | null;
    nivelProposto: 'gestao' | 'operacional' | null;
    empresa: string;
  }>;
}

interface NivelCargoStepProps {
  funcoesNivelInfo: FuncaoNivelInfo[];
  nivelCargoMap: Record<string, NivelCargo>;
  onChange: (funcao: string, nivel: NivelCargo) => void;
  onConfirm: () => void;
  onBack: () => void;
  temNivelCargoDirecto: boolean;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Helper: agrupar mudanças por empresa > função
// ---------------------------------------------------------------------------

type TrocaInfo = NonNullable<FuncaoNivelInfo['funcionariosComMudanca']>[0];
type TrocaNivelInfo = NonNullable<FuncaoNivelInfo['funcionariosComMudancaNivel']>[0];

interface GrupoFuncao {
  trocas: TrocaInfo[];
  trocasNivel: TrocaNivelInfo[];
}

function groupMudancasByEmpresaAndFuncao(
  funcoesNivelInfo: FuncaoNivelInfo[]
): Map<string, Map<string, GrupoFuncao>> {
  const grouped = new Map<string, Map<string, GrupoFuncao>>();

  for (const funcaoInfo of funcoesNivelInfo) {
    const hasMudancaRole =
      funcaoInfo.isMudancaRole &&
      (funcaoInfo.funcionariosComMudanca?.length ?? 0) > 0;
    const hasMudancaNivel =
      funcaoInfo.isMudancaNivel &&
      (funcaoInfo.funcionariosComMudancaNivel?.length ?? 0) > 0;

    if (!hasMudancaRole && !hasMudancaNivel) continue;

    if (hasMudancaRole) {
      for (const troca of funcaoInfo.funcionariosComMudanca!) {
        const empresa = troca.empresa || '(sem empresa)';
        if (!grouped.has(empresa)) grouped.set(empresa, new Map());
        const empresaMap = grouped.get(empresa)!;
        if (!empresaMap.has(funcaoInfo.funcao)) {
          empresaMap.set(funcaoInfo.funcao, { trocas: [], trocasNivel: [] });
        }
        empresaMap.get(funcaoInfo.funcao)!.trocas.push(troca);
      }
    }

    if (hasMudancaNivel) {
      for (const troca of funcaoInfo.funcionariosComMudancaNivel!) {
        const empresa = troca.empresa || '(sem empresa)';
        if (!grouped.has(empresa)) grouped.set(empresa, new Map());
        const empresaMap = grouped.get(empresa)!;
        if (!empresaMap.has(funcaoInfo.funcao)) {
          empresaMap.set(funcaoInfo.funcao, { trocas: [], trocasNivel: [] });
        }
        empresaMap.get(funcaoInfo.funcao)!.trocasNivel.push(troca);
      }
    }
  }

  return grouped;
}

// ---------------------------------------------------------------------------
// Componente inline: mudanças agrupadas por empresa > função
// ---------------------------------------------------------------------------

function MudancasAgrupadas({
  funcoesNivelInfo,
  nivelCargoMap,
  onChange,
}: {
  funcoesNivelInfo: FuncaoNivelInfo[];
  nivelCargoMap: Record<string, NivelCargo>;
  onChange: (funcao: string, nivel: NivelCargo) => void;
}) {
  const grouped = groupMudancasByEmpresaAndFuncao(funcoesNivelInfo);
  if (grouped.size === 0) return null;

  const nivelBadge = (v: 'gestao' | 'operacional' | null) =>
    v === 'gestao' ? (
      <span className="text-purple-700 font-medium">G gestão</span>
    ) : v === 'operacional' ? (
      <span className="text-blue-700 font-medium">O operacional</span>
    ) : (
      <span className="text-gray-400 italic">—</span>
    );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
        <p className="text-xs font-semibold text-amber-800">
          Detalhes das mudanças — classifique o nível para cada função abaixo
        </p>
      </div>

      {Array.from(grouped.entries()).map(([empresa, funcaoMap]) => (
        <div key={empresa} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
            <Users size={13} className="text-gray-500 flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-700">{empresa}</span>
          </div>

          <div className="divide-y divide-gray-100">
            {Array.from(funcaoMap.entries()).map(([funcao, grupo]) => {
              const nivelClassificado = nivelCargoMap[funcao] ?? '';
              return (
                <div key={funcao} className="p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{funcao}</span>
                        {grupo.trocas.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                            <ArrowRight size={9} />
                            troca função
                          </span>
                        )}
                        {grupo.trocasNivel.length > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                            <ArrowRight size={9} />
                            nível alterado
                          </span>
                        )}
                      </div>
                      {nivelClassificado && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <CheckCircle size={12} className={nivelClassificado === 'gestao' ? 'text-purple-600' : 'text-blue-600'} />
                          <span className={`text-[11px] font-medium ${nivelClassificado === 'gestao' ? 'text-purple-700' : 'text-blue-700'}`}>
                            {nivelClassificado === 'gestao' ? 'Gestão' : 'Operacional'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => onChange(funcao, nivelCargoMap[funcao] === 'gestao' ? '' : 'gestao')}
                        className={`w-9 h-9 text-xs font-bold rounded-lg border-2 transition-colors cursor-pointer ${
                          nivelClassificado === 'gestao'
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-white text-purple-600 border-purple-200 hover:border-purple-400'
                        }`}
                        title="Gestão"
                      >
                        G
                      </button>
                      <button
                        onClick={() => onChange(funcao, nivelCargoMap[funcao] === 'operacional' ? '' : 'operacional')}
                        className={`w-9 h-9 text-xs font-bold rounded-lg border-2 transition-colors cursor-pointer ${
                          nivelClassificado === 'operacional'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400'
                        }`}
                        title="Operacional"
                      >
                        O
                      </button>
                    </div>
                  </div>

                  {grupo.trocas.length > 0 && (
                    <table className="w-full text-xs mb-2 border border-gray-100 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">Nome</th>
                          <th className="px-3 py-2 font-medium">Era (função)</th>
                          <th className="px-3 py-2 font-medium text-right">Nível atual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {grupo.trocas.map((t, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-800 font-medium">{t.nomeMascarado}</td>
                            <td className="px-3 py-2 text-gray-500">{t.funcaoAnterior}</td>
                            <td className="px-3 py-2 text-right">{nivelBadge(t.nivelAtual)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {grupo.trocasNivel.length > 0 && (
                    <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">Nome</th>
                          <th className="px-3 py-2 font-medium">Banco atual</th>
                          <th className="px-3 py-2 font-medium text-right">Planilha propõe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {grupo.trocasNivel.map((t, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2 text-gray-800 font-medium">{t.nomeMascarado}</td>
                            <td className="px-3 py-2">{nivelBadge(t.nivelAtual)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{nivelBadge(t.nivelProposto)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function NivelCargoStep({
  funcoesNivelInfo,
  nivelCargoMap,
  onChange,
  onConfirm,
  onBack,
  temNivelCargoDirecto,
  isLoading,
}: NivelCargoStepProps) {
  const temMudancas = useMemo(
    () =>
      funcoesNivelInfo.some(
        (f) =>
          (f.isMudancaRole && (f.funcionariosComMudanca?.length ?? 0) > 0) ||
          (f.isMudancaNivel && (f.funcionariosComMudancaNivel?.length ?? 0) > 0)
      ),
    [funcoesNivelInfo]
  );

  const totalFuncoes = funcoesNivelInfo.length;

  const classificadas = useMemo(
    () => funcoesNivelInfo.filter((f) => !!nivelCargoMap[f.funcao]).length,
    [funcoesNivelInfo, nivelCargoMap]
  );

  const todasClassificadas = classificadas === totalFuncoes;

  const autoClassificadas = useMemo(
    () =>
      funcoesNivelInfo.filter((f) => {
        const niveisValidos = f.niveisAtuais.filter(
          (n): n is 'gestao' | 'operacional' => n !== null
        );
        return (
          niveisValidos.length === 1 &&
          !f.niveisAtuais.includes(null) &&
          !!nivelCargoMap[f.funcao]
        );
      }).length,
    [funcoesNivelInfo, nivelCargoMap]
  );

  const handleToggle = useCallback(
    (funcao: string, nivel: NivelCargo) => {
      onChange(funcao, nivelCargoMap[funcao] === nivel ? '' : nivel);
    },
    [nivelCargoMap, onChange]
  );

  const handleDefinirTodos = useCallback(
    (nivel: NivelCargo) => {
      for (const info of funcoesNivelInfo) {
        onChange(info.funcao, nivel);
      }
    },
    [funcoesNivelInfo, onChange]
  );

  if (temNivelCargoDirecto && !temMudancas) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Nível de cargo mapeado diretamente da planilha
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              A coluna <strong>nivel_cargo</strong> foi identificada. Os valores
              serão importados sem necessidade de classificação manual.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-between pt-2">
          <button onClick={onBack} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            ← Voltar
          </button>
          <button onClick={onConfirm} disabled={isLoading} className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-60">
            {isLoading ? 'Importando...' : 'Confirmar e Importar →'}
          </button>
        </div>
      </div>
    );
  }

  if (totalFuncoes === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
          <Info size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">Nenhuma função encontrada para classificar.</p>
        </div>
        <div className="flex gap-3 justify-between pt-2">
          <button onClick={onBack} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
            ← Voltar
          </button>
          <button onClick={onConfirm} disabled={isLoading} className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-60">
            {isLoading ? 'Importando...' : 'Confirmar e Importar →'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {autoClassificadas > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
          <Sparkles size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            <span className="font-medium">
              {autoClassificadas === totalFuncoes
                ? 'Todas as funções foram classificadas automaticamente'
                : `${autoClassificadas} função${autoClassificadas > 1 ? 'ões' : ''} classificada${autoClassificadas > 1 ? 's' : ''} automaticamente`}
            </span>{' '}
            com base nos dados do banco. Revise se necessário.
          </p>
        </div>
      )}

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Classificação de Nível de Cargo</span>
          </div>
          <span className="text-xs text-gray-500">{classificadas}/{totalFuncoes} classificadas</span>
        </div>

        <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Definir todos:</span>
          <button onClick={() => handleDefinirTodos('gestao')} className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors cursor-pointer">
            G — Gestão
          </button>
          <button onClick={() => handleDefinirTodos('operacional')} className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors cursor-pointer">
            O — Operacional
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {funcoesNivelInfo.map((info) => {
            const nivel = nivelCargoMap[info.funcao] ?? '';
            return (
              <div key={info.funcao} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-shrink-0">
                  {nivel ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 truncate">{info.funcao}</span>
                    {info.isMudancaRole && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        <ArrowRight size={10} />
                        troca função
                      </span>
                    )}
                    {info.isMudancaNivel && !info.isMudancaRole && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">
                        <ArrowRight size={10} />
                        nível alterado
                      </span>
                    )}
                    {info.qtdNovos > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                        <Sparkles size={10} />
                        {info.qtdNovos} novo{info.qtdNovos > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 mt-0.5 block">
                    {info.qtdFuncionarios} funcionário{info.qtdFuncionarios !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(info.funcao, 'gestao')}
                    className={`w-8 h-8 text-xs font-bold rounded-lg border-2 transition-colors cursor-pointer ${nivel === 'gestao' ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-200 hover:border-purple-400'}`}
                    title="Gestão"
                  >G</button>
                  <button
                    onClick={() => handleToggle(info.funcao, 'operacional')}
                    className={`w-8 h-8 text-xs font-bold rounded-lg border-2 transition-colors cursor-pointer ${nivel === 'operacional' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400'}`}
                    title="Operacional"
                  >O</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {temMudancas && (
        <MudancasAgrupadas
          funcoesNivelInfo={funcoesNivelInfo}
          nivelCargoMap={nivelCargoMap}
          onChange={onChange}
        />
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-purple-600" />
          G = Gestão
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-blue-600" />
          O = Operacional
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          nível aplicado a todos da função
        </span>
      </div>

      {!todasClassificadas && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Classifique todas as funções para habilitar a importação.{' '}
            <strong>{totalFuncoes - classificadas} pendente{totalFuncoes - classificadas > 1 ? 's' : ''}</strong>.
          </span>
        </div>
      )}

      <div className="flex gap-3 justify-between pt-2">
        <button onClick={onBack} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
          ← Voltar
        </button>
        <button
          onClick={onConfirm}
          disabled={!todasClassificadas || isLoading}
          className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Importando...' : 'Confirmar e Importar →'}
        </button>
      </div>
    </div>
  );
}
