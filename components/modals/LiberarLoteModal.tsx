'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Rocket, Info } from 'lucide-react';
import {
  useLiberarLote,
  type LiberarLoteParams,
} from '@/lib/hooks/useLiberarLote';
import {
  useLiberarLoteEntidade,
  type LiberarLoteEntidadeParams,
} from '@/lib/hooks/useLiberarLoteEntidade';

interface EmpresaShort {
  id: number;
  nome: string;
}

interface EntidadeLiberarResponse {
  success: boolean;
  message?: string;
  resultados?: {
    empresaId: number;
    empresaNome: string;
    created: boolean;
    loteId?: number;
    codigo?: string;
    numero_ordem?: number;
    avaliacoesCriadas?: number;
    funcionariosConsiderados?: number;
    message?: string;
  }[];
}

interface LiberarLoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Para uso em contexto de clínica podemos pré-definir a empresa.
  // Em contexto de entidade, deixamos opcional e exibimos um seletor interno.
  empresaId?: number;
  empresaNome?: string;
  onSuccess?: (loteId: number) => void;
  // Define o contexto de uso do modal: 'rh' (padrão) ou 'entidade'
  mode?: 'rh' | 'entidade';
}

export function LiberarLoteModal({
  isOpen,
  onClose,
  empresaId,
  empresaNome,
  onSuccess,
  mode = 'rh',
}: LiberarLoteModalProps) {
  const isEntidade = mode === 'entidade';

  const rhHook = useLiberarLote();
  const entidadeHook = useLiberarLoteEntidade();

  const loadingState = isEntidade ? entidadeHook.loading : rhHook.loading;
  const errorState = isEntidade ? entidadeHook.error : rhHook.error;
  const resultState = isEntidade ? entidadeHook.result : rhHook.result;
  const resetState = isEntidade ? entidadeHook.reset : rhHook.reset;

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<'completo' | 'operacional' | 'gestao'>(
    'completo'
  );
  const [dataFiltro, setDataFiltro] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [entidadeResponse, setEntidadeResponse] =
    useState<EntidadeLiberarResponse | null>(null);

  const [empresas, setEmpresas] = useState<EmpresaShort[]>([]);
  const [empresaIdLocal, setEmpresaIdLocal] = useState<number | null>(
    empresaId || null
  );
  const [empresaNomeLocal, setEmpresaNomeLocal] = useState<string>(
    empresaNome || ''
  );
  const [companyError, setCompanyError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitulo('');
      setDescricao('');
      setTipo('completo');
      setDataFiltro('');
      setShowSuccess(false);
      setCompanyError(null);
      // Se a empresa foi passada como prop, manter; caso contrário, reset local
      if (!empresaId) {
        setEmpresaIdLocal(null);
        setEmpresaNomeLocal('');
      }
      // reset do hook correspondente
      resetState();
      setEntidadeResponse(null);
    }
  }, [isOpen, resetState, empresaId]);

  // Carregar lista de empresas apenas quando não for pré-definida E não for contexto de entidade
  useEffect(() => {
    if (!empresaId && !isEntidade) {
      fetch('/api/rh/empresas')
        .then((res) => {
          if (!res.ok) throw new Error('Falha ao buscar empresas');
          return res.json();
        })
        .then((data) => setEmpresas(data || []))
        .catch((err) => console.error('Erro ao carregar empresas:', err));
    }
  }, [empresaId, isEntidade]);

  const handleClose = useCallback(() => {
    if (!loadingState) {
      onClose();
    }
  }, [loadingState, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loadingState) return;

    if (isEntidade) {
      // Montar params para entidade
      const params: LiberarLoteEntidadeParams = {
        tipo,
      };

      if (titulo.trim()) params.titulo = titulo.trim();
      if (descricao.trim()) params.descricao = descricao.trim();
      if (dataFiltro) params.dataFiltro = dataFiltro;

      const response = await entidadeHook.liberarLote(params);

      if (response && response.success) {
        setShowSuccess(true);
        setEntidadeResponse(response);

        // Notificar o caller - deixar a página pai decidir se fecha o modal
        if (onSuccess) {
          // quando vários lotes são criados, não há um único id; passar -1 para indicar sucesso
          onSuccess(-1);
        }
      }

      return;
    }

    const finalEmpresaId = empresaId ?? empresaIdLocal;

    if (!finalEmpresaId) {
      setCompanyError('Selecione uma empresa para continuar');
      return;
    }

    const params: LiberarLoteParams = {
      empresaId: finalEmpresaId,
      tipo,
    };

    if (titulo.trim()) {
      params.titulo = titulo.trim();
    }

    if (descricao.trim()) {
      params.descricao = descricao.trim();
    }

    if (dataFiltro) {
      params.dataFiltro = dataFiltro;
    }

    const response = await rhHook.liberarLote(params);

    if (response.success && response.lote) {
      setShowSuccess(true);

      // Notificar o caller - deixar a página pai decidir se fecha o modal
      if (onSuccess) {
        onSuccess(response.lote!.id);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1001] flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loadingState) {
          handleClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Rocket className="text-primary" size={24} />
            <div>
              <h2 id="modal-title" className="text-xl font-bold text-gray-900">
                Iniciar Ciclo de Coletas Avaliativas
              </h2>
              <p className="text-sm text-gray-600">
                {isEntidade
                  ? empresaNome ||
                    empresaNomeLocal ||
                    'Entidade — apenas funcionários da minha instituição'
                  : empresaNome || empresaNomeLocal || 'Selecione a empresa'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loadingState}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fechar modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && !isEntidade && (resultState as any)?.lote && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle
                className="text-green-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900">
                  Lote liberado com sucesso!
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  {(resultState as any)?.message}
                </p>
                <div className="mt-2 text-sm text-green-800">
                  <strong>Código:</strong> {(resultState as any).lote?.codigo} |{' '}
                  <strong>Lote nº:</strong>{' '}
                  {(resultState as any).lote?.numero_ordem}
                </div>
              </div>
            </div>
          </div>
        )}

        {showSuccess &&
          isEntidade &&
          (
            (entidadeResponse?.resultados ??
              (resultState as EntidadeLiberarResponse | null)?.resultados) ||
            []
          ).length > 0 && (
            <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle
                  className="text-green-600 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900">
                    Lotes criados com sucesso!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Foram processadas as empresas a seguir:
                  </p>
                  <ul className="mt-2 text-sm text-green-800 list-disc list-inside">
                    {(
                      entidadeResponse?.resultados ??
                      (resultState as EntidadeLiberarResponse | null)
                        ?.resultados ??
                      []
                    ).map((r: any) => (
                      <li key={r.empresaId}>
                        <strong>{r.empresaNome}</strong>:{' '}
                        {r.created
                          ? `${r.avaliacoesCriadas} avaliações criadas`
                          : r.message}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

        {/* Error Message */}
        {errorState && !showSuccess && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle
                className="text-red-600 flex-shrink-0 mt-0.5"
                size={20}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">
                  Não foi possível criar o lote
                </h3>
                <p className="text-sm text-red-700 mt-1 whitespace-pre-line">
                  {errorState}
                </p>
                {!isEntidade && rhHook.errorHint && (
                  <p className="text-sm text-red-600 mt-2">
                    {rhHook.errorHint}
                  </p>
                )}
                {isEntidade &&
                  entidadeHook.result &&
                  (entidadeHook.result as any).detalhes && (
                    <div className="mt-3 p-3 bg-red-100 rounded text-xs text-red-800 whitespace-pre-line">
                      {(entidadeHook.result as any).detalhes}
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {!showSuccess && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info
                  className="text-blue-600 flex-shrink-0 mt-0.5"
                  size={20}
                />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">
                    Sistema de Elegibilidade Automática
                  </p>
                  <p>
                    O sistema selecionará automaticamente funcionários elegíveis
                    com base em:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                    <li>Funcionários novos (nunca avaliados)</li>
                    <li>Índices atrasados (faltou lote anterior)</li>
                    <li>Mais de 1 ano sem avaliação válida</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Seletor de empresa para contexto de clínica (opcional quando empresa não foi passada como prop) */}
            {!empresaId && !isEntidade && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Empresa *
                </label>
                <select
                  value={empresaIdLocal || ''}
                  onChange={(e) => {
                    const id = e.target.value ? parseInt(e.target.value) : null;
                    setEmpresaIdLocal(id);
                    const emp = empresas.find((p) => p.id === id);
                    setEmpresaNomeLocal(emp ? emp.nome : '');
                    setCompanyError(null);
                  }}
                  disabled={loadingState}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
                >
                  <option value="">Selecione uma empresa</option>
                  {empresas.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nome}
                    </option>
                  ))}
                </select>
                {companyError && (
                  <p className="text-xs text-red-600 mt-2">{companyError}</p>
                )}
              </div>
            )}

            {isEntidade && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <p className="font-medium">Observação</p>
                <p className="mt-1">
                  As liberações serão processadas para todas as empresas
                  vinculadas aos funcionários da sua entidade. Após a execução,
                  você verá um resumo dos resultados por empresa.
                </p>
              </div>
            )}

            {/* Tipo de Lote */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Lote *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    value: 'completo',
                    label: 'Completo',
                    desc: 'Todos os níveis',
                  },
                  {
                    value: 'operacional',
                    label: 'Operacional',
                    desc: 'Nível operacional',
                  },
                  { value: 'gestao', label: 'Gestão', desc: 'Nível gestão' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      tipo === option.value
                        ? 'border-primary bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo"
                      value={option.value}
                      checked={tipo === option.value}
                      onChange={(e) =>
                        setTipo(
                          e.target.value as
                            | 'completo'
                            | 'operacional'
                            | 'gestao'
                        )
                      }
                      className="sr-only"
                      disabled={loadingState}
                    />
                    <span className="font-medium text-gray-900">
                      {option.label}
                    </span>
                    <span className="text-xs text-gray-600 mt-1">
                      {option.desc}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Título (Opcional) */}
            <div>
              <label
                htmlFor="titulo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Título (Opcional)
              </label>
              <input
                id="titulo"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={loadingState}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ex: Avaliação Anual 2026"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se não informado, será gerado automaticamente
              </p>
            </div>

            {/* Descrição (Opcional) */}
            <div>
              <label
                htmlFor="descricao"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Descrição (Opcional)
              </label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                disabled={loadingState}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                placeholder="Adicione informações adicionais sobre este lote..."
              />
            </div>

            {/* Filtro por Data (Opcional) */}
            <div>
              <label
                htmlFor="dataFiltro"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Filtrar por Data de Admissão (Opcional)
              </label>
              <input
                id="dataFiltro"
                type="date"
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                disabled={loadingState}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Incluir apenas funcionários admitidos após esta data
              </p>
            </div>

            {/* Result Summary (RH only) */}
            {!isEntidade &&
              (resultState as any)?.resumoInclusao &&
              !showSuccess && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Resumo da Liberação
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Novos:</span>
                      <span className="font-medium">
                        {(resultState as any).resumoInclusao.funcionarios_novos}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Atrasados:</span>
                      <span className="font-medium">
                        {(resultState as any).resumoInclusao.indices_atrasados}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">&gt;1 ano:</span>
                      <span className="font-medium">
                        {
                          (resultState as any).resumoInclusao
                            .mais_de_1_ano_sem_avaliacao
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Regulares:</span>
                      <span className="font-medium">
                        {
                          (resultState as any).resumoInclusao
                            .renovacoes_regulares
                        }
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 col-span-2">
                      <span className="text-gray-900 font-medium">Total:</span>
                      <span className="font-bold text-primary">
                        {(resultState as any).estatisticas?.avaliacoesCreated ||
                          0}
                      </span>
                    </div>
                  </div>
                  {(resultState as any).resumoInclusao.prioridade_critica >
                    0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-orange-700 font-medium">
                        ⚠️{' '}
                        {(resultState as any).resumoInclusao.prioridade_critica}{' '}
                        funcionário(s) com prioridade CRÍTICA
                      </p>
                    </div>
                  )}
                </div>
              )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={loadingState}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loadingState}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loadingState ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Liberando...</span>
                  </>
                ) : (
                  <>
                    <Rocket size={18} />
                    <span>Iniciar Ciclo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
