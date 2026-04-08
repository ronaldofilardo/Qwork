'use client';

import { useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
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
    nome: string;
    funcaoAnterior: string;
    nivelAtual: 'gestao' | 'operacional' | null;
    empresa?: string;
  }>;
  /** Detalhes dos funcionários cujo nivel_cargo diverge entre planilha e banco */
  funcionariosComMudancaNivel?: Array<{
    nome: string;
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

/**
 * Agrupa mudanças de função por empresa e depois por função.
 * Retorna Map<empresa, Map<funcao, { trocas, trocasNivel, nivelAtual }>>
 */
export function groupMudancasByEmpresaAndFuncao(
  funcoesNivelInfo: FuncaoNivelInfo[]
): Map<
  string,
  Map<
    string,
    {
      trocas: NonNullable<FuncaoNivelInfo['funcionariosComMudanca']>[number][];
      trocasNivel: NonNullable<
        FuncaoNivelInfo['funcionariosComMudancaNivel']
      >[number][];
      nivelAtual: string;
    }
  >
> {
  type EntryValue = {
    trocas: NonNullable<FuncaoNivelInfo['funcionariosComMudanca']>[number][];
    trocasNivel: NonNullable<
      FuncaoNivelInfo['funcionariosComMudancaNivel']
    >[number][];
    nivelAtual: string;
  };
  const grouped = new Map<string, Map<string, EntryValue>>();

  const ensureEntry = (
    empresa: string,
    funcao: string,
    nivelAtualStr: string
  ): EntryValue => {
    if (!grouped.has(empresa)) {
      grouped.set(empresa, new Map());
    }
    const empresaMap = grouped.get(empresa)!;
    if (!empresaMap.has(funcao)) {
      empresaMap.set(funcao, {
        trocas: [],
        trocasNivel: [],
        nivelAtual: nivelAtualStr,
      });
    }
    return empresaMap.get(funcao)!;
  };

  for (const funcaoInfo of funcoesNivelInfo) {
    const nivelAtualStr =
      (funcaoInfo.niveisAtuais.filter(Boolean) as Array<'operacional' | 'gestao'>)
        .join(' / ') || 'não definido';

    if (
      funcaoInfo.isMudancaRole &&
      funcaoInfo.funcionariosComMudanca &&
      funcaoInfo.funcionariosComMudanca.length > 0
    ) {
      for (const troca of funcaoInfo.funcionariosComMudanca) {
        const empresa = troca.empresa || '(sem empresa)';
        ensureEntry(empresa, funcaoInfo.funcao, nivelAtualStr).trocas.push(
          troca
        );
      }
    }

    if (
      funcaoInfo.isMudancaNivel &&
      funcaoInfo.funcionariosComMudancaNivel &&
      funcaoInfo.funcionariosComMudancaNivel.length > 0
    ) {
      for (const troca of funcaoInfo.funcionariosComMudancaNivel) {
        const empresa = troca.empresa || '(sem empresa)';
        ensureEntry(empresa, funcaoInfo.funcao, nivelAtualStr).trocasNivel.push(
          troca
        );
      }
    }
  }

  return grouped;
}

/**
 * Componente inline que exibe mudanças de função agrupadas por empresa e depois por função.
 * Sem modal sequencial — tudo renderizado em tabelas expansíveis por empresa.
 */
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

  if (grouped.size === 0) {
    return null;
  }

  const nivelLabel = (v: 'gestao' | 'operacional' | null) =>
    v === 'gestao' ? (
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
          {/* Cabeçalho por Empresa */}
          <div className="px-4 py-3 bg-gray-100 border-b border-gray-300 font-semibold text-sm text-gray-800">
            {empresa}
          </div>

          {/* Tabela de funções e trocas */}
          <div className="divide-y divide-gray-200">
            {Array.from(funcaosMap.entries()).map(
              ([funcao, { trocas, trocasNivel }]) => {
                const nivelClassificado = nivelCargoMap[funcao] ?? '';
                const semFuncao = funcao === 'Não informado';
                return (
                  <div key={`${empresa}-${funcao}`} className="p-4">
                    {/* Função + status */}
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

                    {/* Tabela de trocas de função */}
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

                    {/* Tabela de mudanças de nível */}
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

                    {/* Botões de classificação */}
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

export default function NivelCargoStep({
  funcoesNivelInfo,
  nivelCargoMap,
  onChange,
  onConfirm,
  onBack,
  temNivelCargoDirecto,
  isLoading,
}: NivelCargoStepProps) {
  /**
   * Funções com mudanças não confirmadas: isMudancaRole (troca de função)
   * OU isMudancaNivel (nivel_cargo alterado/removido na planilha) que ainda
   * não foram classificadas no nivelCargoMap. Ambas bloqueiam o avanço.
   */
  const mudancasNaoConfirmadas = useMemo(
    () =>
      funcoesNivelInfo.filter(
        (f) => (f.isMudancaRole || f.isMudancaNivel) && !nivelCargoMap[f.funcao]
      ),
    [funcoesNivelInfo, nivelCargoMap]
  );

  // 'Não informado' é OPCIONAL — não bloqueia a importação
  const funcoesBloqueantes = useMemo(
    () => funcoesNivelInfo.filter((f) => f.funcao !== 'Não informado'),
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
    [funcoesBloqueantes, nivelCargoMap]
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

  // --- Planilha já tem coluna nivel_cargo (SEM mudanças pendentes) ---
  if (temNivelCargoDirecto && mudancasNaoConfirmadas.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle
            size={18}
            className="text-green-600 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-green-800">
              ✓ Nível de cargo mapeado diretamente da planilha
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              A coluna <strong>nivel_cargo</strong> foi identificada. Nenhuma
              mudança de função detectada. Os valores serão importados sem
              necessidade de classificação manual.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-between pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-60"
          >
            {isLoading ? 'Importando...' : 'Confirmar e Importar →'}
          </button>
        </div>
      </div>
    );
  }

  // --- Planilha tem coluna nivel_cargo MAS há mudanças de função pendentes ---
  if (temNivelCargoDirecto && mudancasNaoConfirmadas.length > 0) {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle
            size={18}
            className="text-amber-600 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-medium text-amber-900">
              Nível de cargo mapeado + Alterações detectadas
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              A coluna <strong>nivel_cargo</strong> existe, mas{' '}
              <strong>{mudancasNaoConfirmadas.length}</strong> função
              {mudancasNaoConfirmadas.length > 1 ? 'ões' : ''} com alterações
              pendentes (troca de função ou nível alterado). Confirme o nível
              para cada uma antes de continuar.
            </p>
          </div>
        </div>

        {/* Lista rápida das mudanças detectadas */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2">
            Mudanças a confirmar ({mudancasNaoConfirmadas.length}):
          </p>
          <ul className="space-y-1 text-xs text-gray-600">
            {mudancasNaoConfirmadas.map((info) => (
              <li key={info.funcao} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                <strong>{info.funcao}</strong> ({info.qtdFuncionarios}
                {info.qtdFuncionarios > 1 ? ' func.' : ' func.'})
              </li>
            ))}
          </ul>
        </div>

        {/* MudancasAgrupadas inline — mostrar tabela agrupada por empresa */}
        <MudancasAgrupadas
          funcoesNivelInfo={funcoesNivelInfo}
          nivelCargoMap={nivelCargoMap}
          onChange={onChange}
        />

        {/* Blocker */}
        {mudancasNaoConfirmadas.length > 0 &&
          mudancasNaoConfirmadas.some((f) => !nivelCargoMap[f.funcao]) && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>
                Confirme o nível para todas as alterações pendentes antes de
                prosseguir.
              </span>
            </div>
          )}

        {/* Ações finais */}
        <div className="flex gap-3 justify-between pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={
              mudancasNaoConfirmadas.some((f) => !nivelCargoMap[f.funcao]) ||
              isLoading
            }
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Importando...' : 'Confirmar e Importar →'}
          </button>
        </div>
      </div>
    );
  }

  // --- Sem funções a classificar ---
  if (totalFuncoes === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
          <Info size={18} className="text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-700">
            Nenhuma função encontrada para classificar.
          </p>
        </div>
        <div className="flex gap-3 justify-between pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-60"
          >
            {isLoading ? 'Importando...' : 'Confirmar e Importar →'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Banner auto-classificação */}
      {autoClassificadas > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
          <Sparkles size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            <span className="font-medium">
              {autoClassificadas === totalFuncoes
                ? 'Nível de cargo classificado automaticamente'
                : `${autoClassificadas} função${autoClassificadas > 1 ? 'ões' : ''} classificada${autoClassificadas > 1 ? 's' : ''} automaticamente`}
            </span>{' '}
            — com base no banco de dados. Revise e ajuste se necessário.
          </p>
        </div>
      )}

      {/* Card com tabela de funções */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-primary" />
            <span className="text-sm font-semibold text-gray-800">
              Classificar Nível de Cargo
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                todasClassificadas
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {classificadas}/{totalFuncoes}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-400">Definir todos:</span>
            <button
              onClick={() => handleDefinirTodos('gestao')}
              className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 font-semibold"
            >
              G
            </button>
            <button
              onClick={() => handleDefinirTodos('operacional')}
              className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold"
            >
              O
            </button>
            <button
              onClick={() => handleDefinirTodos('')}
              className="px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50">
          {funcoesNivelInfo.map((info) => {
            const nivel = nivelCargoMap[info.funcao] ?? '';

            return (
              <div
                key={info.funcao}
                className="flex items-center gap-3 px-4 py-2.5"
              >
                {/* Status icon */}
                <div className="flex-shrink-0 w-4">
                  {nivel ? (
                    <CheckCircle size={14} className="text-green-500" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300" />
                  )}
                </div>

                {/* Function info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-sm font-medium truncate ${info.funcao === 'Não informado' ? 'text-amber-700 italic' : 'text-gray-800'}`}
                      title={
                        info.funcao === 'Não informado'
                          ? 'Funcionários sem função definida'
                          : info.funcao
                      }
                    >
                      {info.funcao === 'Não informado'
                        ? 'Sem função'
                        : info.funcao}
                    </span>
                    {info.isMudancaRole && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex-shrink-0">
                        <ArrowRight size={9} />
                        troca função
                      </span>
                    )}
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
                  {/* Campo nome: mostra nomes dos funcionários com mudança */}
                  {(() => {
                    const nomes = (
                      info.funcionariosComMudanca?.length
                        ? info.funcionariosComMudanca
                        : (info.funcionariosComMudancaNivel ?? [])
                    )
                      .map((f) => f.nome)
                      .filter(Boolean);
                    return nomes.length > 0 ? (
                      <div className="flex items-center gap-1 mt-0.5 min-w-0">
                        <span className="text-[10px] text-gray-600 truncate">
                          {nomes.slice(0, 2).join(', ')}
                          {nomes.length > 2 && (
                            <span className="text-gray-400">
                              {' '}
                              +{nomes.length - 2}
                            </span>
                          )}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400">
                      {info.qtdFuncionarios} func.
                      {info.qtdExistentes > 0 &&
                        ` · ${info.qtdExistentes} existente${info.qtdExistentes > 1 ? 's' : ''}`}
                    </span>
                  </div>
                </div>

                {/* G / O buttons */}
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

      {/* Detalhes de mudanças (troca de função / nível) quando existentes */}
      {funcoesNivelInfo.some(
        (f) =>
          (f.isMudancaRole && (f.funcionariosComMudanca?.length ?? 0) > 0) ||
          (f.isMudancaNivel && (f.funcionariosComMudancaNivel?.length ?? 0) > 0)
      ) && (
        <MudancasAgrupadas
          funcoesNivelInfo={funcoesNivelInfo}
          nivelCargoMap={nivelCargoMap}
          onChange={onChange}
        />
      )}

      {/* Blocker */}
      {!todasClassificadas && (
        <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Classifique todas as funções para habilitar a importação.{' '}
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
