/**
 * Componente: Barra de Progresso de Emissão
 *
 * Exibe progresso em tempo real da emissão de laudo com:
 * - Barra de progresso visual
 * - Mensagem de status
 * - Tempo decorrido e estimado
 * - Indicador de etapas
 */

/* eslint-disable */
'use client';

import {
  useProgressoEmissao,
  formatarTempo,
} from '@/lib/hooks/useProgressoEmissao';
import type { StatusEmissao } from '@/lib/hooks/useProgressoEmissao';

interface BarraProgressoEmissaoProps {
  loteId: number;
  autoIniciar?: boolean;
  onConcluido?: (resultado: any) => void;
  onErro?: (erro: string) => void;
}

export function BarraProgressoEmissao({
  loteId,
  autoIniciar = false,
  onConcluido,
  onErro,
}: BarraProgressoEmissaoProps) {
  const { progresso, monitorando, iniciarMonitoramento, pararMonitoramento } =
    useProgressoEmissao({
      loteId,
      onConcluido,
      onErro,
    });

  // Auto-iniciar se solicitado
  if (autoIniciar && !monitorando) {
    iniciarMonitoramento();
  }

  const {
    status,
    mensagem,
    porcentagem,
    etapa,
    totalEtapas,
    tempoDecorrido,
    tempoEstimado,
    erro,
  } = progresso;

  // Cor da barra baseada no status
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const getCorBarra = (status: StatusEmissao): string => {
    switch (status) {
      case 'concluido':
        return 'bg-green-500';
      case 'erro':
        return 'bg-red-500';
      case 'gerando_pdf':
      case 'enviando_storage':
        return 'bg-blue-500 animate-pulse';
      default:
        return 'bg-blue-500';
    }
  };

  // Ícone baseado no status
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const getIcone = (status: StatusEmissao): string => {
    switch (status) {
      case 'concluido':
        return '✓';
      case 'erro':
        return '✗';
      case 'gerando_pdf':
        return '⚙';
      case 'enviando_storage':
        return '↑';
      default:
        return '○';
    }
  };

  if (!monitorando && status === 'idle') {
    return null;
  }

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getIcone(status)}</span>
          <div>
            <h3 className="font-semibold text-gray-900">
              {status === 'concluido' ? 'Emissão Concluída' : 'Emitindo Laudo'}
            </h3>
            <p className="text-sm text-gray-600">{mensagem}</p>
          </div>
        </div>

        {/* Porcentagem */}
        <div className="text-right">
          <span className="text-2xl font-bold text-gray-900">
            {porcentagem}%
          </span>
          <p className="text-xs text-gray-500">
            Etapa {etapa}/{totalEtapas}
          </p>
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getCorBarra(status)}`}
          style={{ width: `${porcentagem}%` }}
        />
      </div>

      {/* Informações de Tempo */}
      {(tempoDecorrido || tempoEstimado) &&
        status !== 'concluido' &&
        status !== 'erro' && (
          <div className="flex justify-between text-xs text-gray-600">
            {tempoDecorrido && (
              <span>Tempo decorrido: {formatarTempo(tempoDecorrido)}</span>
            )}
            {tempoEstimado && (
              <span>Estimado: {formatarTempo(tempoEstimado)}</span>
            )}
          </div>
        )}

      {/* Erro */}
      {erro && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800 font-medium">Erro:</p>
          <p className="text-sm text-red-700">{erro}</p>
        </div>
      )}

      {/* Indicadores de Etapas */}
      <div className="mt-4 flex justify-between items-center">
        {Array.from({ length: totalEtapas }, (_, i) => i + 1).map((num) => {
          const ativo = num <= etapa;
          const concluido = num < etapa || status === 'concluido';

          return (
            <div key={num} className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  concluido
                    ? 'bg-green-500 text-white'
                    : ativo
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {concluido ? '✓' : num}
              </div>
              <span className="text-xs text-gray-500">
                {getEtapaLabel(num)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Obter label para cada etapa
 */
function getEtapaLabel(etapa: number): string {
  const labels: Record<number, string> = {
    1: 'Solicitado',
    2: 'Gerando',
    3: 'Upload',
    4: 'Emitido',
    5: 'Concluído',
  };

  return labels[etapa] || `Etapa ${etapa}`;
}
