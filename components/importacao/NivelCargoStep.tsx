'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
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
  /** Detalhes dos funcionários que mudaram para esta função (apenas isMudancaRole=true) */
  funcionariosComMudanca?: Array<{
    nomeMascarado: string;
    funcaoAnterior: string;
    nivelAtual: 'gestao' | 'operacional' | null;
  }>;
  /** Detalhes dos funcionários com nivel_cargo divergente entre planilha e banco */
  funcionariosComMudancaNivel?: Array<{
    nomeMascarado: string;
    nivelAtual: 'gestao' | 'operacional' | null;
    nivelProposto: 'gestao' | 'operacional' | null;
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
 * Modal unificado para classificação obrigatória (funções alteradas/novas)
 * e revisão manual ("ver detalhes").
 */
function ClassificarCargoModal({
  funcao,
  currentIndex,
  totalCount,
  isMudancaRole,
  isMudancaNivel,
  funcionariosComMudanca,
  funcionariosComMudancaNivel,
  nivelAtual,
  onSelect,
  onClose,
}: {
  funcao: string;
  currentIndex: number;
  totalCount: number;
  isMudancaRole: boolean;
  isMudancaNivel?: boolean;
  funcionariosComMudanca?: NonNullable<FuncaoNivelInfo['funcionariosComMudanca']>;
  funcionariosComMudancaNivel?: NonNullable<FuncaoNivelInfo['funcionariosComMudancaNivel']>;
  nivelAtual: NivelCargo;
  onSelect: (nivel: 'gestao' | 'operacional') => void;
  onClose: () => void;
}) {
  const restantes = totalCount - currentIndex - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {isMudancaRole ? (
              <ArrowRight size={18} className="text-amber-500" />
            ) : isMudancaNivel ? (
              <ArrowRight size={18} className="text-blue-500" />
            ) : (
              <Sparkles size={18} className="text-emerald-500" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {isMudancaRole ? 'Mudança de Função' : isMudancaNivel ? 'Mudança de Nível' : 'Nova Função'}
              </h3>
              {totalCount > 1 && (
                <p className="text-[11px] text-gray-400 leading-none mt-0.5">
                  {currentIndex + 1} de {totalCount}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded cursor-pointer"
            aria-label="Fechar modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs text-gray-500 mb-3">
            {isMudancaRole ? (
              <>
                Funcionários abaixo mudaram de função para{' '}
                <strong className="text-gray-800">{funcao}</strong>. Defina o
                nível de cargo.
              </>
            ) : isMudancaNivel ? (
              <>
                A planilha propõe alteração de nível para{' '}
                <strong className="text-gray-800">{funcao}</strong>. Confirme ou
                ajuste o nível que será gravado.
              </>
            ) : (
              <>
                A função <strong className="text-gray-800">{funcao}</strong> é
                nova nesta importação. Defina o nível de cargo.
              </>
            )}
          </p>

          {/* Tabela de funcionários — apenas em mudança de função */}
          {isMudancaRole &&
            funcionariosComMudanca &&
            funcionariosComMudanca.length > 0 && (
              <table className="w-full text-xs mb-4 border border-gray-100 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-3 py-2 font-medium">Nome</th>
                    <th className="px-3 py-2 font-medium">Era</th>
                    <th className="px-3 py-2 font-medium text-right">
                      Nível atual
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {funcionariosComMudanca.map((f, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-800 font-medium">
                        {f.nomeMascarado}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {f.funcaoAnterior}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {f.nivelAtual === 'gestao' ? (
                          <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-full font-medium">
                            G gestão
                          </span>
                        ) : f.nivelAtual === 'operacional' ? (
                          <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-full font-medium">
                            O operacional
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">
                            não definido
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          {/* Tabela de divergências — apenas em mudança de nivel_cargo */}
          {isMudancaNivel &&
            funcionariosComMudancaNivel &&
            funcionariosComMudancaNivel.length > 0 && (
              <table className="w-full text-xs mb-4 border border-gray-100 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr className="text-left text-gray-500">
                    <th className="px-3 py-2 font-medium">Nome</th>
                    <th className="px-3 py-2 font-medium">Banco atual</th>
                    <th className="px-3 py-2 font-medium text-right">
                      Planilha propõe
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {funcionariosComMudancaNivel.map((f, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-800 font-medium">
                        {f.nomeMascarado}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{f.nivelAtual === 'gestao' ? 'G gestão' : f.nivelAtual === 'operacional' ? 'O operacional' : '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-blue-700">{f.nivelProposto === 'gestao' ? 'G gestão' : f.nivelProposto === 'operacional' ? 'O operacional' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          {/* Escolha do nível */}
          <div className={isMudancaRole || isMudancaNivel ? 'border-t border-gray-100 pt-3' : ''}>
            <p className="text-xs text-gray-700 mb-2 font-semibold">
              Qual nível para &ldquo;{funcao}&rdquo;?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onSelect('gestao')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg border-2 transition-colors cursor-pointer ${
                  nivelAtual === 'gestao'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                }`}
              >
                G — Gestão
              </button>
              <button
                onClick={() => onSelect('operacional')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg border-2 transition-colors cursor-pointer ${
                  nivelAtual === 'operacional'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                }`}
              >
                O — Operacional
              </button>
            </div>
          </div>

          {/* Fuga: fechar e classificar manualmente */}
          {restantes > 0 && (
            <div className="mt-3 text-center">
              <button
                onClick={onClose}
                className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer"
              >
                Fechar — classificar manualmente ({restantes} restante
                {restantes !== 1 ? 's' : ''})
              </button>
            </div>
          )}
        </div>
      </div>
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
   * Fila de classificação obrigatória computada sincronamente no primeiro render
   * via useState lazy initializer — o modal já está aberto no primeiro frame.
   * Inclui: isMudancaRole=true (troca de função) e novas funções (qtdNovos>0).
   */
  const [initialQueue] = useState<string[]>(() =>
    funcoesNivelInfo
      .filter((f) => f.isMudancaRole || f.isMudancaNivel || f.qtdNovos > 0)
      .map((f) => f.funcao)
  );

  /** Ref com a fila atual (permite navegação sequencial sem re-render). */
  const queueRef = useRef<string[]>(initialQueue);
  /** Modal aberto via botão "ver detalhes" (fora da fila). */
  const isManualModeRef = useRef(false);

  /** Função atual no modal — inicia já no primeiro item da fila se houver. */
  const [modalFuncao, setModalFuncao] = useState<string | null>(
    initialQueue.length > 0 ? initialQueue[0] : null
  );
  const [modalQueueIndex, setModalQueueIndex] = useState(0);

  const modalInfo = useMemo(
    () =>
      modalFuncao
        ? funcoesNivelInfo.find((f) => f.funcao === modalFuncao)
        : null,
    [modalFuncao, funcoesNivelInfo]
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

  /** Seleção no modal: classifica e avança na fila (ou fecha em modo manual). */
  const handleModalSelect = useCallback(
    (nivel: 'gestao' | 'operacional') => {
      if (!modalFuncao) return;
      onChange(modalFuncao, nivel);

      if (isManualModeRef.current) {
        isManualModeRef.current = false;
        setModalFuncao(null);
        return;
      }

      const nextIndex = modalQueueIndex + 1;
      if (nextIndex < queueRef.current.length) {
        setModalQueueIndex(nextIndex);
        setModalFuncao(queueRef.current[nextIndex]);
      } else {
        setModalFuncao(null);
      }
    },
    [modalFuncao, modalQueueIndex, onChange]
  );

  /** Fecha toda a sequência — usuário classifica manualmente na tabela. */
  const handleModalClose = useCallback(() => {
    isManualModeRef.current = false;
    setModalFuncao(null);
  }, []);

  /** Abre modal para uma função específica (botão "ver detalhes"). */
  const handleOpenModalManual = useCallback((funcao: string) => {
    isManualModeRef.current = true;
    setModalFuncao(funcao);
  }, []);

  // --- Planilha já tem coluna nivel_cargo e SEM mudanças detectadas ---
  if (temNivelCargoDirecto && initialQueue.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle
            size={18}
            className="text-green-600 flex-shrink-0 mt-0.5"
          />
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
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
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
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
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

  const modalCurrentIndex = isManualModeRef.current ? 0 : modalQueueIndex;
  const modalTotalCount = isManualModeRef.current ? 1 : queueRef.current.length;

  return (
    <div className="space-y-4">
      {/* Banner auto-classificação */}
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

      {/* Tabela de funções */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Classificação de Nível de Cargo
            </span>
          </div>
          <span className="text-xs text-gray-500">
            {classificadas}/{totalFuncoes} classificadas
          </span>
        </div>

        {/* Ações em lote */}
        <div className="px-4 py-2 bg-white border-b border-gray-100 flex items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Definir todos:</span>
          <button
            onClick={() => handleDefinirTodos('gestao')}
            className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded hover:bg-purple-100 transition-colors cursor-pointer"
          >
            G — Gestão
          </button>
          <button
            onClick={() => handleDefinirTodos('operacional')}
            className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors cursor-pointer"
          >
            O — Operacional
          </button>
        </div>

        {/* Linhas das funções */}
        <div className="divide-y divide-gray-100">
          {funcoesNivelInfo.map((info) => {
            const nivel = nivelCargoMap[info.funcao] ?? '';
            return (
              <div
                key={info.funcao}
                className="px-4 py-3 flex items-center gap-3"
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {nivel ? (
                    <CheckCircle size={16} className="text-green-500" />
                  ) : (
                    <AlertTriangle size={16} className="text-amber-500" />
                  )}
                </div>

                {/* Função + badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {info.funcao}
                    </span>
                    {info.isMudancaRole && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        <ArrowRight size={10} />
                        mudança
                      </span>
                    )}
                    {info.qtdNovos > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                        <Sparkles size={10} />
                        {info.qtdNovos} novo{info.qtdNovos > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {info.qtdFuncionarios} funcionário
                      {info.qtdFuncionarios !== 1 ? 's' : ''}
                    </span>
                    {(info.isMudancaRole
                      ? (info.funcionariosComMudanca?.length ?? 0) > 0
                      : info.isMudancaNivel
                        ? (info.funcionariosComMudancaNivel?.length ?? 0) > 0
                        : false) && (
                        <button
                          onClick={() => handleOpenModalManual(info.funcao)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          ver detalhes
                        </button>
                      )}
                  </div>
                </div>

                {/* Botões G / O */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(info.funcao, 'gestao')}
                    className={`w-8 h-8 text-xs font-bold rounded-lg border-2 transition-colors cursor-pointer ${
                      nivel === 'gestao'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-purple-600 border-purple-200 hover:border-purple-400'
                    }`}
                    title="Gestão"
                  >
                    G
                  </button>
                  <button
                    onClick={() => handleToggle(info.funcao, 'operacional')}
                    className={`w-8 h-8 text-xs font-bold rounded-lg border-2 transition-colors cursor-pointer ${
                      nivel === 'operacional'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-blue-600 border-blue-200 hover:border-blue-400'
                    }`}
                    title="Operacional"
                  >
                    O
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-purple-600"></span>
          G = Gestão
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-blue-600"></span>
          O = Operacional
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          nível aplicado a todos da função
        </span>
      </div>

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
          </span>
        </div>
      )}

      {/* Botões de ação */}
      <div className="flex gap-3 justify-between pt-2">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
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

      {/* Modal de classificação — auto-abre para funções alteradas/novas */}
      {modalInfo && modalFuncao && (
        <ClassificarCargoModal
          funcao={modalFuncao}
          currentIndex={modalCurrentIndex}
          totalCount={modalTotalCount > 0 ? modalTotalCount : 1}
          isMudancaRole={modalInfo.isMudancaRole}
          isMudancaNivel={modalInfo.isMudancaNivel}
          funcionariosComMudanca={modalInfo.funcionariosComMudanca}
          funcionariosComMudancaNivel={modalInfo.funcionariosComMudancaNivel}
          nivelAtual={nivelCargoMap[modalFuncao] ?? ''}
          onSelect={handleModalSelect}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}