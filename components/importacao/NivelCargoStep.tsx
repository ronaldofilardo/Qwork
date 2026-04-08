'use client';

import { useCallback, useMemo, useState } from 'react';
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
  /** Algum funcionário existente nesta função tem nivel_cargo = null no banco */
  temNivelNuloExistente: boolean;
  /** Detalhes dos funcionários que mudaram para esta função (apenas isMudancaRole=true) */
  funcionariosComMudanca?: Array<{
    nomeMascarado: string;
    funcaoAnterior: string;
    nivelAtual: 'gestao' | 'operacional' | null;
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

/** Modal contextual para funções com troca de cargo */
function MudancaRoleModal({
  funcao,
  funcionarios,
  nivelAtual,
  onChange,
  onClose,
}: {
  funcao: string;
  funcionarios: NonNullable<FuncaoNivelInfo['funcionariosComMudanca']>;
  nivelAtual: NivelCargo;
  onChange: (nivel: NivelCargo) => void;
  onClose: () => void;
}) {
  const handleSelect = (nivel: 'gestao' | 'operacional') => {
    onChange(nivel);
    onClose();
  };

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
            <ArrowRight size={18} className="text-amber-500" />
            <h3 className="text-sm font-semibold text-gray-900">
              Mudança de Função
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Fechar modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs text-gray-500 mb-3">
            Funcionários abaixo mudaram de função para{' '}
            <strong className="text-gray-800">{funcao}</strong>. Revise e
            escolha o nível de cargo para este cargo.
          </p>

          {/* Employee table */}
          <table className="w-full text-xs mb-4 border border-gray-100 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="px-3 py-2 font-medium">Era</th>
                <th className="px-3 py-2 font-medium text-right">Nível atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {funcionarios.map((f, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-gray-800 font-medium">
                    {f.nomeMascarado}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{f.funcaoAnterior}</td>
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
                      <span className="text-gray-400 italic">não definido</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Choose level */}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-700 mb-2 font-semibold">
              Qual nível para &ldquo;{funcao}&rdquo;?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelect('gestao')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg border-2 transition-colors ${
                  nivelAtual === 'gestao'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-purple-700 border-purple-300 hover:bg-purple-50'
                }`}
              >
                G — Gestão
              </button>
              <button
                onClick={() => handleSelect('operacional')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg border-2 transition-colors ${
                  nivelAtual === 'operacional'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-blue-700 border-blue-300 hover:bg-blue-50'
                }`}
              >
                O — Operacional
              </button>
            </div>
          </div>
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
  const [modalFuncao, setModalFuncao] = useState<string | null>(null);

  const modalInfo = useMemo(
    () => (modalFuncao ? funcoesNivelInfo.find((f) => f.funcao === modalFuncao) : null),
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

  // --- Planilha já tem coluna nivel_cargo ---
  if (temNivelCargoDirecto) {
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
            const temMudanca =
              info.isMudancaRole &&
              (info.funcionariosComMudanca?.length ?? 0) > 0;

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
                      className="text-sm text-gray-800 font-medium truncate"
                      title={info.funcao}
                    >
                      {info.funcao}
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400">
                      {info.qtdFuncionarios} func.
                      {info.qtdExistentes > 0 &&
                        ` · ${info.qtdExistentes} existente${info.qtdExistentes > 1 ? 's' : ''}`}
                    </span>
                    {temMudanca && (
                      <button
                        onClick={() => setModalFuncao(info.funcao)}
                        className="inline-flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 hover:underline font-semibold"
                      >
                        <Users size={10} />
                        {info.funcionariosComMudanca!.length} troca
                        {info.funcionariosComMudanca!.length > 1 ? 's' : ''} — ver detalhes
                      </button>
                    )}
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

      {/* Role-change modal */}
      {modalInfo && modalFuncao && (
        <MudancaRoleModal
          funcao={modalFuncao}
          funcionarios={modalInfo.funcionariosComMudanca ?? []}
          nivelAtual={nivelCargoMap[modalFuncao] ?? ''}
          onChange={(nivel) => onChange(modalFuncao, nivel)}
          onClose={() => setModalFuncao(null)}
        />
      )}
    </div>
  );
}
