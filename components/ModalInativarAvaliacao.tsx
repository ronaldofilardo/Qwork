'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ModalInativarAvaliacaoProps {
  avaliacaoId: number;
  funcionarioNome: string;
  funcionarioCpf: string;
  _loteId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface ValidacaoResponse {
  permitido: boolean;
  motivo?: string;
  total_inativacoes_consecutivas?: number;
  ultima_inativacao_lote?: string;
  pode_forcar?: boolean;
  aviso?: string;
  prioridade_alta?: boolean;
  aviso_prioridade?: string;
  avaliacao?: {
    id: number;
    status?: string;
    lote_codigo?: string | null;
    lote_ordem?: number | null;
    lote_emitido?: boolean;
    lote_emissao_solicitada?: boolean;
  };
}

export default function ModalInativarAvaliacao({
  avaliacaoId,
  funcionarioNome,
  funcionarioCpf,
  _loteId,
  onClose,
  onSuccess,
}: ModalInativarAvaliacaoProps) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validacao, setValidacao] = useState<ValidacaoResponse | null>(null);
  const [motivo, setMotivo] = useState('');
  const [forcar, setForcar] = useState(false);
  const [confirmarPrioridadeAlta, setConfirmarPrioridadeAlta] = useState(false);
  const [submetendo, setSubmetendo] = useState(false);
  const motivoRef = React.useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // sempre foca o campo de motivo quando carregado
    if (!loading) {
      setTimeout(() => motivoRef.current?.focus(), 50);
    }
  }, [loading]);

  const carregarValidacao = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/avaliacoes/inativar?avaliacao_id=${avaliacaoId}&funcionario_cpf=${funcionarioCpf}`,
        { method: 'GET' }
      );

      if (response.ok) {
        const data = await response.json();
        setValidacao(data);
      } else {
        console.error('Erro ao validar inativação');
        setValidacao({
          permitido: false,
          motivo: 'Erro ao validar. Tente novamente.',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar validação:', error);
      setValidacao({
        permitido: false,
        motivo: 'Erro ao validar. Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  }, [avaliacaoId, funcionarioCpf]);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';

    // Carregar validação
    carregarValidacao();

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submetendo) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      setMounted(false);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, submetendo, carregarValidacao]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const minimoCaracteres = forcar ? 50 : 10;
    if (motivo.trim().length < minimoCaracteres) {
      alert(`O motivo deve ter pelo menos ${minimoCaracteres} caracteres.`);
      return;
    }

    if (!validacao) {
      alert('Erro: validação não carregada. Tente novamente.');
      return;
    }

    if (
      !confirm(
        `Tem certeza que deseja ${
          forcar ? 'FORÇAR a ' : ''
        }inativar a avaliação de ${funcionarioNome}?\n\n` +
          `${
            validacao.prioridade_alta
              ? '⚠️ ATENÇÃO: Esta é uma avaliação de PRIORIDADE ALTA!\n\n'
              : ''
          }` +
          `Motivo: ${motivo.trim()}\n\n` +
          `Esta ação não pode ser desfeita.` +
          `${
            validacao.prioridade_alta
              ? '\n\nO funcionário será incluído automaticamente no próximo lote.'
              : ''
          }`
      )
    ) {
      return;
    }

    setSubmetendo(true);

    try {
      const response = await fetch('/api/avaliacoes/inativar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avaliacao_id: avaliacaoId,
          funcionario_cpf: funcionarioCpf,
          motivo: motivo.trim(),
          forcar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert('Erro: ' + (data.error || 'Erro ao inativar avaliação'));
        setSubmetendo(false);
        return;
      }

      alert(data.mensagem || '✅ Avaliação inativada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao inativar:', error);
      alert('Erro ao processar inativação');
      setSubmetendo(false);
    }
  };

  if (!mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !submetendo) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            ⚠️ Inativar Avaliação
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Validando...</p>
            </div>
          ) : validacao ? (
            <>
              {/* Informações do Funcionário */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-600">Funcionário</div>
                <div className="font-semibold text-gray-800">
                  {funcionarioNome}
                </div>
                <div className="text-xs text-gray-500 font-mono mt-1">
                  {funcionarioCpf}
                </div>
              </div>

              {/* Aviso de Bloqueio */}
              {!validacao.permitido && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">🚫</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-800 mb-2">
                        Inativação Bloqueada
                      </h3>
                      <p className="text-sm text-red-700 whitespace-pre-line">
                        {validacao.motivo}
                      </p>
                      {validacao.ultima_inativacao_lote && (
                        <div className="mt-2 text-xs text-red-600">
                          Último lote inativado:{' '}
                          <span className="font-mono">
                            {validacao.ultima_inativacao_lote}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso se lote já foi emitido (laudo gerado) - inativação é proibida */}
              {validacao.avaliacao?.lote_emitido && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">🔒</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-800 mb-2">
                        Impossível Inativar - Laudo Emitido
                      </h3>
                      <p className="text-sm text-red-700">
                        O laudo deste lote já foi emitido. Depois de emitido, as
                        avaliações são consideradas imutáveis para garantir
                        integridade e rastreabilidade. Se você acredita que há
                        um erro crítico, contate o suporte técnico.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso se emissão do laudo foi solicitada - inativação é proibida */}
              {validacao.avaliacao?.lote_emissao_solicitada && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">🔒</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-800 mb-2">
                        Impossível Inativar - Emissão Solicitada
                      </h3>
                      <p className="text-sm text-red-700">
                        A emissão do laudo para este lote já foi solicitada.
                        Depois de solicitar, as avaliações são consideradas
                        imutáveis para garantir integridade e rastreabilidade do
                        laudo. Se você acredita que há um erro crítico, contate
                        o suporte técnico.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso Normal */}
              {validacao.permitido && validacao.aviso && (
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">⚠️</div>
                    <div className="flex-1">
                      <p className="text-sm text-yellow-700">
                        {validacao.aviso}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Aviso de Prioridade Alta */}
              {validacao.prioridade_alta && validacao.aviso_prioridade && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex items-start">
                    <div className="text-3xl mr-3">🚨</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-red-800 mb-2">
                        AVALIAÇÃO DE PRIORIDADE ALTA
                      </h3>
                      <p className="text-sm text-red-700 whitespace-pre-line mb-3">
                        {validacao.aviso_prioridade}
                      </p>
                      <div className="bg-red-100 border border-red-300 rounded p-3">
                        <label className="flex items-start cursor-pointer">
                          <input
                            type="checkbox"
                            checked={confirmarPrioridadeAlta}
                            onChange={(e) =>
                              setConfirmarPrioridadeAlta(e.target.checked)
                            }
                            className="w-4 h-4 text-red-600 bg-white border-red-300 rounded focus:ring-red-500 mt-0.5 mr-3"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-red-800">
                              Confirmar Inativação
                            </div>
                            <p className="text-sm text-red-700 mt-1">
                              Entendo que esta avaliação é prioritária e mesmo
                              assim desejo inativá-la. O funcionário será
                              incluído automaticamente no próximo lote de
                              avaliações.
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Opção de Forçar */}
              {!validacao.permitido &&
                validacao.pode_forcar &&
                !validacao.avaliacao?.lote_emitido && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="forcar"
                        checked={forcar}
                        onChange={(e) => setForcar(e.target.checked)}
                        className="w-5 h-5 text-orange-600 bg-white border-orange-300 rounded focus:ring-orange-500 mt-0.5 mr-3"
                      />
                      <label htmlFor="forcar" className="flex-1 cursor-pointer">
                        <div className="font-semibold text-orange-800">
                          Forçar Inativação
                        </div>
                        <p className="text-sm text-orange-700 mt-1">
                          Marque esta opção para forçar a inativação em casos
                          excepcionais (ex: licença médica prolongada,
                          afastamento legal).
                          <strong className="block mt-1">
                            Justificativa mínima: 50 caracteres.
                          </strong>
                        </p>
                      </label>
                    </div>
                  </div>
                )}

              {/* Formulário - sempre mostrar quando permitido ou pode forçar */}
              {!validacao.avaliacao?.lote_emitido &&
                (validacao.permitido ||
                  validacao.pode_forcar ||
                  (validacao.prioridade_alta && confirmarPrioridadeAlta)) && (
                  <form
                    onSubmit={handleSubmit}
                    className="mt-6 pt-4 border-t border-gray-200"
                  >
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motivo da Inativação *
                        <span className="text-xs text-gray-500 ml-2">
                          (mínimo {forcar ? 50 : 10} caracteres)
                        </span>
                      </label>
                      <textarea
                        ref={motivoRef}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder={
                          forcar
                            ? 'Descreva detalhadamente o motivo excepcional para forçar esta inativação (ex: funcionário afastado por licença médica de 6 meses, atestado médico anexado ao processo...).'
                            : 'Ex: Funcionário desligado da empresa, férias prolongadas, afastamento temporário...'
                        }
                        rows={forcar ? 6 : 4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        maxLength={500}
                        required
                      />
                      <div className="text-xs text-gray-500 mt-1 text-right">
                        {motivo.length}/500 caracteres
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={submetendo}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={
                          submetendo ||
                          motivo.trim().length < (forcar ? 50 : 10) ||
                          (validacao.prioridade_alta &&
                            !confirmarPrioridadeAlta)
                        }
                        className={`flex-1 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          forcar
                            ? 'bg-orange-600 text-white hover:bg-orange-700'
                            : validacao.prioridade_alta
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {submetendo
                          ? '⏳ Processando...'
                          : forcar
                            ? '🔓 Forçar Inativação'
                            : '✅ Confirmar Inativação'}
                      </button>
                    </div>
                  </form>
                )}

              {/* Botão de fechar se bloqueado e não pode forçar */}
              {!validacao.permitido && !validacao.pode_forcar && (
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Fechar
                </button>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">❌</div>
              <p className="text-gray-600">Erro ao carregar validação</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
