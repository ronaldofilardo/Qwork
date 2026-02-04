/**
 * Componente: Botão de Solicitação de Emissão de Laudo
 *
 * Exibe um card destacado quando o lote está no estado 'concluido',
 * permitindo que RH ou Entidades solicitem manualmente a emissão do laudo.
 *
 * Features:
 * - Só aparece quando lote está 'concluido' E não tem laudo emitido
 * - Validação client-side antes de request
 * - Confirmação antes de solicitar
 * - Loading state durante processamento
 * - Feedback visual de sucesso/erro
 * - Callback onSuccess para atualizar UI
 * - Respeita princípio de imutabilidade (não permite re-emissão)
 */

/* eslint-disable */
'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useValidacaoEmissao } from '@/lib/hooks/useValidacaoEmissao';

interface BotaoSolicitarEmissaoProps {
  loteId: number;
  loteStatus: string;
  totalAvaliacoes: number;
  avaliacoesConcluidas: number;
  avaliacoesInativadas: number;
  laudoId?: number | null;
  laudoStatus?: string | null;
  emissaoSolicitada?: boolean;
  emissaoSolicitadoEm?: string | null;
  temLaudo?: boolean;
  onSuccess?: () => void;
}

export function BotaoSolicitarEmissao({
  loteId,
  loteStatus,
  totalAvaliacoes,
  avaliacoesConcluidas,
  avaliacoesInativadas,
  laudoId,
  laudoStatus,
  emissaoSolicitada,
  emissaoSolicitadoEm,
  temLaudo,
  onSuccess,
}: BotaoSolicitarEmissaoProps) {
  const [loading, setLoading] = useState(false);

  // Validação client-side
  const validacao = useValidacaoEmissao({
    loteId,
    status: loteStatus,
    totalAvaliacoes,
    avaliacoesConcluidas,
    avaliacoesInativadas,
    temLaudo,
    laudoStatus,
    emissaoSolicitada,
  });

  // PRINCÍPIO DA IMUTABILIDADE:
  // Não exibir botão se:
  // 1. Lote não está concluído
  // 2. Já foi solicitada emissão
  // 3. Já tem laudo emitido ou enviado
  const temLaudoEmitido = Boolean(
    (laudoId && (laudoStatus === 'emitido' || laudoStatus === 'enviado')) ||
    temLaudo
  );

  const deveMostrarBotao =
    loteStatus === 'concluido' && !emissaoSolicitada && !temLaudoEmitido;

  const handleSolicitar = async () => {
    // Validar client-side antes de confirmar
    if (!validacao.podeEmitir) {
      toast.error(
        `Não é possível solicitar emissão:\n${validacao.erros.join('\n')}`,
        { duration: 5000 }
      );
      return;
    }

    // Mostrar avisos se houver
    if (validacao.avisos.length > 0) {
      const confirmadoAvisos = confirm(
        `Atenção:\n${validacao.avisos.join('\n')}\n\nDeseja continuar?`
      );

      if (!confirmadoAvisos) {
        return;
      }
    }

    // Confirmação antes de solicitar
    const confirmado = confirm(
      `Confirma a solicitação de emissão do laudo para o lote #${loteId}?\n\n` +
        `Avaliações concluídas: ${avaliacoesConcluidas}/${totalAvaliacoes - avaliacoesInativadas}\n` +
        'O laudo será gerado e enviado para o emissor responsável.'
    );

    if (!confirmado) {
      return;
    }

    setLoading(true);
    const toastId = 'solicitar-emissao';
    toast.loading('Solicitando emissão do laudo...', { id: toastId });

    try {
      const response = await fetch(`/api/lotes/${loteId}/solicitar-emissao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar emissão');
      }

      toast.success('Emissão solicitada com sucesso!', { id: toastId });

      // Chamar callback de sucesso
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (error) {
      console.error('[ERROR] Erro ao solicitar emissão:', error);

      const mensagemErro =
        error instanceof Error ? error.message : 'Erro ao solicitar emissão';

      toast.error(mensagemErro, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Card quando emissão já foi solicitada
  if (emissaoSolicitada && !temLaudo) {
    return (
      <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">📋</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Emissão Solicitada
            </h3>
            <p className="text-sm text-gray-700">
              A emissão do laudo foi solicitada
              {emissaoSolicitadoEm && (
                <span>
                  {' '}
                  em{' '}
                  {new Date(emissaoSolicitadoEm).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
              . O laudo está sendo processado pelo emissor.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Card quando laudo já foi emitido
  if (temLaudo || temLaudoEmitido) {
    return (
      <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-violet-50 border-2 border-purple-300 rounded-xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Laudo Emitido
            </h3>
            <p className="text-sm text-gray-700">
              O laudo deste lote já foi emitido
              {laudoStatus === 'enviado' && ' e enviado'}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Não mostrar nada se não deve mostrar o botão
  if (!deveMostrarBotao) {
    return null;
  }

  // Card com botão de solicitar emissão
  return (
    <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">✅</span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">
            Lote Concluído
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Todas as avaliações foram finalizadas. Você pode solicitar a emissão
            do laudo agora.
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Avaliações: {avaliacoesConcluidas}/
            {totalAvaliacoes - avaliacoesInativadas} concluídas
            {avaliacoesInativadas > 0 &&
              ` (${avaliacoesInativadas} inativadas)`}
          </p>
        </div>
      </div>

      {/* Exibir avisos se houver */}
      {validacao.avisos.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm font-semibold text-yellow-800 mb-1">
            ⚠️ Atenção:
          </p>
          <ul className="text-xs text-yellow-700 space-y-1">
            {validacao.avisos.map((aviso, idx) => (
              <li key={idx}>• {aviso}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Exibir erros se houver */}
      {validacao.erros.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm font-semibold text-red-800 mb-1">
            ❌ Não é possível emitir:
          </p>
          <ul className="text-xs text-red-700 space-y-1">
            {validacao.erros.map((erro, idx) => (
              <li key={idx}>• {erro}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleSolicitar}
        disabled={loading || !validacao.podeEmitir}
        className="
          w-full px-6 py-4 
          bg-gradient-to-r from-green-600 to-emerald-600 
          text-white rounded-lg 
          hover:from-green-700 hover:to-emerald-700
          active:from-green-800 active:to-emerald-800
          transition-all duration-200
          font-bold text-lg
          disabled:from-gray-400 disabled:to-gray-500
          disabled:cursor-not-allowed
          disabled:opacity-60
          flex items-center justify-center gap-3
          shadow-md hover:shadow-lg
          transform hover:scale-[1.02] active:scale-[0.98]
        "
        title={
          !validacao.podeEmitir
            ? 'Corrija os problemas antes de solicitar emissão'
            : ''
        }
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Solicitando emissão...</span>
          </>
        ) : (
          <>
            <span className="text-2xl">🚀</span>
            <span>Solicitar Emissão do Laudo</span>
          </>
        )}
      </button>

      {loading && (
        <p className="text-xs text-center text-gray-600 mt-3 animate-pulse">
          Aguarde, processando solicitação...
        </p>
      )}
    </div>
  );
}
