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
  /** Valores distintos de nivel_cargo dos funcionários existentes nesta função */
  niveisAtuais: Array<'gestao' | 'operacional' | null>;
  /** Função veio de mudança de função de funcionário já existente */
  isMudancaRole: boolean;
  /** Planilha propõe nivel_cargo diferente do banco para esta função */
  isMudancaNivel?: boolean;
  /** Algum funcionário existente nesta função tem nivel_cargo = null no banco */
  temNivelNuloExistente: boolean;
  /** Detalhes dos funcionários que mudaram para esta função (isMudancaRole=true) */
  funcionariosComMudanca?: Array<{
    nomeMascarado: string;
    funcaoAnterior: string;
    nivelAtual: 'gestao' | 'operacional' | null;
    empresa?: string;
  }>;
  /** Detalhes dos funcionários cujo nivel_cargo diverge entre planilha e banco */
  funcionariosComMudancaNivel?: Array<{
    nomeMascarado: string;
    nivelAtual: 'gestao' | 'operacional' | null;
    nivelProposto: 'gestao' | 'operacional' | null;
    empresa?: string;
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

type TrocaInfo = NonNullable<FuncaoNivelInfo['funcionariosComMudanca']>[0];
type TrocaNivelInfo = NonNullable<FuncaoNivelInfo['funcionariosComMudancaNivel']>[0];

interface GrupoFuncao {
  trocas: TrocaInfo[];
  trocasNivel: TrocaNivelInfo[];
}

/**
 * Agrupa mudancas de funcao e mudancas de nivel por empresa e depois por funcao.
 * Retorna Map<empresa, Map<funcao, GrupoFuncao>>
 */
export function groupMudancasByEmpresaAndFuncao(
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
// Helpers de renderizacao
// ---------------------------------------------------------------------------

function NivelLabel({ v }: { v: 'gestao' | 'operacional' | null }): JSX.Element {
  if (v === 'gestao') {
    return (
      <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full font-medium text-xs">
        G gestao
      </span>
    );
  }
  if (v === 'operacional') {
    return (
      <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium text-xs">
        O operacional
      </span>
    );
  }
  return <span className="text-gray-400 italic text-xs">nao definido</span>;
}

// ---------------------------------------------------------------------------
// MudancasAgrupadas — renderizacao inline por empresa > funcao
// ---------------------------------------------------------------------------

function MudancasAgrupadas({
  funcoesNivelInfo,
  nivelCargoMap,
  onChange,
}: {
  funcoesNivelInfo: FuncaoNivelInfo[];
  nivelCargoMap: Record<string, NivelCargo>;
  onChange: (funcao: string, nivel: NivelCargo) => void;
}): JSX.Element | null {
  const grouped = groupMudancasByEmpresaAndFuncao(funcoesNivelInfo);

  if (grouped.size === 0) return null;

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([empresa, funcaosMap]) => (
        <div key={empresa} className="bg-white border border-gray-300 rounded-lg overflow-hidden">
          {/* Cabecalho por Empresa */}
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-300 flex items-center gap-2">
            <Users size={14} className="text-gray-600 flex-shrink-0" />
            <span className="font-semibold text-sm text-gray-800">{empresa}</span>
          </div>

          <div className="divide-y divide-gray-200">
            {Array.from(funcaosMap.entries()).map(([funcao, grupo]) => {
              const nivelClassificado = nivelCargoMap[funcao] ?? '';
              const { trocas, trocasNivel } = grupo;
              const semFuncao = funcao === 'N\u00e3o informado';

              return (
                <div key={`${empresa}-${funcao}`} className="p-4">
                  {/* Cabecalho da funcao */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                    <div className="flex-1 flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${semFuncao ? 'text-amber-700' : 'text-gray-800'}`}>
                        {semFuncao ? 'Sem func\u00e3o definida' : funcao}
                      </span>
                      {trocas.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          <ArrowRight size={9} />
                          troca funcao
                        </span>
                      )}
                      {trocasNivel.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          nivel alterado
                        </span>
                      )}
                    </div>
                    {nivelClassificado && (
                      <div className="flex-shrink-0 ml-4 flex items-center gap-2">
                        <CheckCircle
                          size={14}
                          className={nivelClassificado === 'gestao' ? 'text-purple-600' : 'text-blue-600'}
                        />
                        <span
                          className={`text-xs font-medium ${
                            nivelClassificado === 'gestao' ? 'text-purple-700' : 'text-blue-700'
                          }`}
                        >
                          {nivelClassificado === 'gestao' ? 'Gestao' : 'Operacional'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tabela troca de funcao */}
                  {trocas.length > 0 && (
                    <table className="w-full text-xs mb-3 border border-gray-100 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">Nome</th>
                          <th className="px-3 py-2 font-medium">Era (func.)</th>
                          <th className="px-3 py-2 font-medium text-right">Nivel atual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {trocas.map((troca, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-gray-800 font-medium">{troca.nomeMascarado}</td>
                            <td className="px-3 py-2 text-gray-600">{troca.funcaoAnterior}</td>
                            <td className="px-3 py-2 text-right">
                              <NivelLabel v={troca.nivelAtual} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Tabela mudanca de nivel */}
                  {trocasNivel.length > 0 && (
                    <table className="w-full text-xs mb-3 border border-gray-100 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr className="text-left text-gray-500">
                          <th className="px-3 py-2 font-medium">Nome</th>
                          <th className="px-3 py-2 font-medium">Banco atual</th>
                          <th className="px-3 py-2 font-medium text-right">Planilha propoe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {trocasNivel.map((troca, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 text-gray-800 font-medium">{troca.nomeMascarado}</td>
                            <td className="px-3 py-2">
                              <NivelLabel v={troca.nivelAtual} />
                            </td>
                            <td className="px-3 py-2 text-right">
                              <NivelLabel v={troca.nivelProposto} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* Botoes de classificacao */}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-700 mb-2 font-semibold">
                      {semFuncao
                        ? 'Qual n\u00edvel para funcion\u00e1rios sem fun\u00e7\u00e3o?'
                        : <>Qual nível para &ldquo;{funcao}&rdquo;?</>}
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
                        G — Gestao
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
  const mudancasNaoConfirmadas = useMemo(
    () =>
      funcoesNivelInfo.filter(
        (f) => (f.isMudancaRole || f.isMudancaNivel) && !nivelCargoMap[f.funcao]
      ),
    [funcoesNivelInfo, nivelCargoMap]
  );

  // 'Nao informado' e OPCIONAL - nao bloqueia a importacao
  const funcoesBloqueantes = useMemo(
    () => funcoesNivelInfo.filter((f) => f.funcao !== 'Nao informado'),
    [funcoesNivelInfo]
  );

  const totalFuncoes = funcoesBloqueantes.length;

  const classificadas = useMemo(
    () => funcoesBloqueantes.filter((f) => !!nivelCargoMap[f.funcao]).length,
    [funcoesBloqueantes, nivelCargoMap]
  );

  const todasClassificadas = classificadas === totalFuncoes;

  const autoClassificadas = useMemo(
    () =>
      funcoesBloqueantes.filter((f) => {
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

  const temMudancas = useMemo(
    () =>
      funcoesNivelInfo.some(
        (f) =>
          (f.isMudancaRole && (f.funcionariosComMudanca?.length ?? 0) > 0) ||
          (f.isMudancaNivel && (f.funcionariosComMudancaNivel?.length ?? 0) > 0)
      ),
    [funcoesNivelInfo]
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

  // --- Planilha ja tem coluna nivel_cargo (SEM mudancas pendentes) ---
  if (temNivelCargoDirecto && mudancasNaoConfirmadas.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-800">
              Nivel de cargo mapeado diretamente da planilha
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              A coluna <strong>nivel_cargo</strong> foi identificada. Nenhuma
              mudanca de funcao detectada. Os valores serao importados sem
              necessidade de classificacao manual.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-between pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-60"
          >
            {isLoading ? 'Importando...' : 'Confirmar e Importar'}
          </button>
        </div>
      </div>
    );
  }

  // --- Planilha tem coluna nivel_cargo MAS ha mudancas de funcao pendentes ---
  if (temNivelCargoDirecto && mudancasNaoConfirmadas.length > 0) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Nivel de cargo mapeado + Mudancas de funcao detectadas
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              A coluna <strong>nivel_cargo</strong> existe, mas{' '}
              <strong>{mudancasNaoConfirmadas.length}</strong> funcao
              {mudancasNaoConfirmadas.length > 1 ? 's' : ''} teve mudanca
              {mudancasNaoConfirmadas.length > 1 ? 's' : ''} de pessoa. Confirme
              o nivel para cada mudanca antes de continuar.
            </p>
          </div>
        </div>

        <MudancasAgrupadas
          funcoesNivelInfo={funcoesNivelInfo}
          nivelCargoMap={nivelCargoMap}
          onChange={onChange}
        />

        {mudancasNaoConfirmadas.some((f) => !nivelCargoMap[f.funcao]) && (
          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>Confirme o nivel para as mudancas de funcao para prosseguir.</span>
          </div>
        )}

        <div className="flex gap-3 justify-between pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={
              mudancasNaoConfirmadas.some((f) => !nivelCargoMap[f.funcao]) ||
              isLoading
            }
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Importando...' : 'Confirmar e Importar'}
          </button>
        </div>
      </div>
    );
  }

  // --- Sem funcoes a classificar ---
  if (totalFuncoes === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
          <Info size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">Nenhuma funcao encontrada para classificar.</p>
        </div>
        <div className="flex gap-3 justify-between pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-60"
          >
            {isLoading ? 'Importando...' : 'Confirmar e Importar'}
          </button>
        </div>
      </div>
    );
  }

  // --- Fluxo principal: classificacao manual ---
  // Funcoes sem detalhes de mudanca (novas funcoes sem empresa conhecida)
  const funcoesComMudancaSet = new Set<string>();
  for (const f of funcoesNivelInfo) {
    if (
      (f.isMudancaRole && (f.funcionariosComMudanca?.length ?? 0) > 0) ||
      (f.isMudancaNivel && (f.funcionariosComMudancaNivel?.length ?? 0) > 0)
    ) {
      funcoesComMudancaSet.add(f.funcao);
    }
  }
  const funcoesSemDetalhes = funcoesNivelInfo.filter(
    (f) => !funcoesComMudancaSet.has(f.funcao)
  );

  return (
    <div className="space-y-4">
      {/* Banner auto-classificacao */}
      {autoClassificadas > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
          <Sparkles size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            <span className="font-medium">
              {autoClassificadas === totalFuncoes
                ? 'Nivel de cargo classificado automaticamente'
                : `${autoClassificadas} funcao${autoClassificadas > 1 ? 'oes' : ''} classificada${autoClassificadas > 1 ? 's' : ''} automaticamente`}
            </span>{' '}
            — com base no banco de dados. Revise e ajuste se necessario.
          </p>
        </div>
      )}

      {/* Header: contador + definir todos */}
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" />
          <span className="text-sm font-semibold text-gray-800">
            Classificacao de Nivel de Cargo
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              todasClassificadas
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {classificadas}/{totalFuncoes} classificadas
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-gray-400">Definir todos:</span>
          <button
            onClick={() => handleDefinirTodos('gestao')}
            className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 font-semibold"
          >
            G — Gestao
          </button>
          <button
            onClick={() => handleDefinirTodos('operacional')}
            className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold"
          >
            O — Operacional
          </button>
        </div>
      </div>

      {/* Boxes por empresa (mudancas detectadas) */}
      {temMudancas && (
        <MudancasAgrupadas
          funcoesNivelInfo={funcoesNivelInfo}
          nivelCargoMap={nivelCargoMap}
          onChange={onChange}
        />
      )}

      {/* Outras funcoes (novas, sem detalhes de empresa) */}
      {funcoesSemDetalhes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Users size={14} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-800">Outras funcoes</span>
            <span className="text-xs text-gray-400">
              {funcoesSemDetalhes.length} funcao{funcoesSemDetalhes.length > 1 ? 'oes' : ''}
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {funcoesSemDetalhes.map((info) => {
              const nivel = nivelCargoMap[info.funcao] ?? '';
              return (
                <div key={info.funcao} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-shrink-0 w-4">
                    {nivel ? (
                      <CheckCircle size={14} className="text-green-500" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-sm font-medium truncate ${info.funcao === 'N\u00e3o informado' ? 'text-amber-700 italic' : 'text-gray-800'}`}
                        title={info.funcao === 'N\u00e3o informado' ? 'Funcion\u00e1rios sem fun\u00e7\u00e3o definida' : info.funcao}
                      >
                        {info.funcao === 'N\u00e3o informado' ? 'Sem fun\u00e7\u00e3o' : info.funcao}
                      </span>
                      {info.qtdNovos > 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex-shrink-0">
                          {info.qtdNovos} novo{info.qtdNovos > 1 ? 's' : ''}
                        </span>
                      )}
                      {info.niveisAtuais.length > 1 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 flex-shrink-0">
                          <AlertTriangle size={9} />
                          conflito
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">
                      <span className="text-[10px] text-gray-400">
                        {info.qtdFuncionarios} func.
                        {info.qtdExistentes > 0 &&
                          ` · ${info.qtdExistentes} existente${info.qtdExistentes > 1 ? 's' : ''}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(info.funcao, 'gestao')}
                      className={`w-8 h-8 text-xs font-bold rounded-lg border-2 transition-colors ${
                        nivel === 'gestao'
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      G
                    </button>
                    <button
                      onClick={() => handleToggle(info.funcao, 'operacional')}
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
      )}

      {/* Blocker */}
      {!todasClassificadas && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Classifique todas as funcoes para habilitar a importacao.{' '}
            <strong>
              {totalFuncoes - classificadas} pendente
              {totalFuncoes - classificadas > 1 ? 's' : ''}
            </strong>
            .
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          onClick={onConfirm}
          disabled={!todasClassificadas || isLoading}
          className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Importando...' : 'Confirmar e Importar'}
        </button>
      </div>
    </div>
  );
}
