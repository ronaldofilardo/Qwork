'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface DetalhesFuncionarioProps {
  cpf: string;
  onClose: () => void;
}

interface Avaliacao {
  id: number;
  status: string;
  status_display: string;
  inicio: string;
  envio: string | null;
  data_inativacao: string | null;
  motivo_inativacao: string | null;
  lote_id: number;
  lote_titulo: string;
  numero_ordem: number;
  liberado_em: string;
}

interface FuncionarioData {
  funcionario: {
    cpf: string;
    nome: string;
    setor: string;
    funcao: string;
    email: string;
    matricula: string | null;
    turno: string | null;
    escala: string | null;
    ativo: boolean;
    data_inclusao: string | null;
    indice_avaliacao: number;
    data_ultimo_lote: string | null;
    diasDesdeUltima: number | null;
    empresa_nome: string;
    clinica_nome: string;
  };
  avaliacoes: Avaliacao[];
  estatisticas: {
    totalAvaliacoes: number;
    concluidas: number;
    inativadas: number;
    pendentes: number;
  };
  pendencia: {
    prioridade: 'CRÍTICA' | 'ALTA' | 'MÉDIA';
    mensagem: string;
  } | null;
}

export default function DetalhesFuncionario({
  cpf,
  onClose,
}: DetalhesFuncionarioProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FuncionarioData | null>(null);

  const carregarDados = useCallback(async () => {
    try {
      const response = await fetch(`/api/rh/funcionarios/${cpf}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionário:', error);
    } finally {
      setLoading(false);
    }
  }, [cpf]);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';

    void carregarDados();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      setMounted(false);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [cpf, onClose, carregarDados]);

  if (!mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        ) : data ? (
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {data.funcionario.nome}
                </h2>
                <p className="text-sm text-gray-500 font-mono mt-1">
                  {data.funcionario.cpf}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Banner de Pendência */}
            {data.pendencia && (
              <div
                className={`border-l-4 p-4 mb-6 rounded ${
                  data.pendencia.prioridade === 'CRÍTICA'
                    ? 'bg-red-50 border-red-500'
                    : data.pendencia.prioridade === 'ALTA'
                      ? 'bg-orange-50 border-orange-500'
                      : 'bg-yellow-50 border-yellow-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">
                    {data.pendencia.prioridade === 'CRÍTICA'
                      ? '🔴'
                      : data.pendencia.prioridade === 'ALTA'
                        ? '🟠'
                        : '🟡'}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-bold mb-1 ${
                        data.pendencia.prioridade === 'CRÍTICA'
                          ? 'text-red-800'
                          : data.pendencia.prioridade === 'ALTA'
                            ? 'text-orange-800'
                            : 'text-yellow-800'
                      }`}
                    >
                      Atenção: Prioridade {data.pendencia.prioridade}
                    </h3>
                    <p
                      className={`text-sm ${
                        data.pendencia.prioridade === 'CRÍTICA'
                          ? 'text-red-700'
                          : data.pendencia.prioridade === 'ALTA'
                            ? 'text-orange-700'
                            : 'text-yellow-700'
                      }`}
                    >
                      {data.pendencia.mensagem}
                    </p>
                    <p className="text-xs mt-2 text-gray-600">
                      Este funcionário deve ser incluído prioritariamente no
                      próximo lote de avaliações.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Informações do Funcionário */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Empresa</div>
                <div className="text-sm font-medium text-gray-800">
                  {data.funcionario.empresa_nome}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Setor</div>
                <div className="text-sm font-medium text-gray-800">
                  {data.funcionario.setor}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Função</div>
                <div className="text-sm font-medium text-gray-800">
                  {data.funcionario.funcao}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Matrícula</div>
                <div className="text-sm font-medium text-gray-800">
                  {data.funcionario.matricula || '-'}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div
                  className={`text-sm font-medium ${
                    data.funcionario.ativo ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {data.funcionario.ativo ? '✅ Ativo' : '❌ Inativo'}
                </div>
              </div>
            </div>

            {/* Índice de Avaliação */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-600 font-medium mb-1">
                    Índice de Avaliação Atual
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {data.funcionario.indice_avaliacao === 0
                      ? 'Nunca avaliado'
                      : `#${data.funcionario.indice_avaliacao}`}
                  </div>
                  {data.funcionario.data_ultimo_lote && (
                    <div className="text-xs text-blue-600 mt-1">
                      Última avaliação:{' '}
                      {new Date(
                        data.funcionario.data_ultimo_lote
                      ).toLocaleDateString('pt-BR')}
                      {data.funcionario.diasDesdeUltima &&
                        ` (${data.funcionario.diasDesdeUltima} dias atrás)`}
                    </div>
                  )}
                </div>
                <div className="text-5xl">📊</div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-700">
                  {data.estatisticas.totalAvaliacoes}
                </div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {data.estatisticas.concluidas}
                </div>
                <div className="text-xs text-green-600">Concluídas</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-700">
                  {data.estatisticas.inativadas}
                </div>
                <div className="text-xs text-red-600">Inativadas</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-700">
                  {data.estatisticas.pendentes}
                </div>
                <div className="text-xs text-yellow-600">Pendentes</div>
              </div>
            </div>

            {/* Timeline de Avaliações */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📋 Histórico de Avaliações
              </h3>
              {data.avaliacoes.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-gray-600">Nenhuma avaliação registrada</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {data.avaliacoes.map((avaliacao) => (
                    <div
                      key={avaliacao.id}
                      className={`border rounded-lg p-4 ${
                        avaliacao.status === 'concluida' ||
                        avaliacao.status === 'concluido'
                          ? 'bg-green-50 border-green-200'
                          : avaliacao.status === 'inativada'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-semibold text-gray-800">
                            {avaliacao.lote_titulo}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            Lote #{avaliacao.lote_id}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            avaliacao.status === 'concluida' ||
                            avaliacao.status === 'concluido'
                              ? 'bg-green-100 text-green-800'
                              : avaliacao.status === 'inativada'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {avaliacao.status_display}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>
                          Liberado:{' '}
                          {new Date(avaliacao.liberado_em).toLocaleDateString(
                            'pt-BR'
                          )}
                        </div>
                        {avaliacao.envio && (
                          <div>
                            Concluído:{' '}
                            {new Date(avaliacao.envio).toLocaleDateString(
                              'pt-BR'
                            )}
                          </div>
                        )}
                        {avaliacao.data_inativacao && (
                          <div className="text-red-600">
                            Inativado:{' '}
                            {new Date(
                              avaliacao.data_inativacao
                            ).toLocaleDateString('pt-BR')}
                            {avaliacao.motivo_inativacao && (
                              <div className="mt-1 italic">
                                Motivo: {avaliacao.motivo_inativacao}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botão Fechar */}
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-gray-600 mb-4">Erro ao carregar funcionário</p>
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
