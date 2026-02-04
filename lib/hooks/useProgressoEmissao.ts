/**
 * Hook para monitorar progresso de emissão de laudo em tempo real
 *
 * Implementa polling para buscar status da emissão e exibir feedback ao usuário.
 * Usa Server-Sent Events (SSE) quando disponível, fallback para polling.
 *
 * Features:
 * - Progresso em tempo real
 * - Estimativa de tempo restante
 * - Tratamento de erros
 * - Auto-cleanup
 */

/* eslint-disable */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Estados possíveis da emissão
 */
export type StatusEmissao =
  | 'idle'
  | 'solicitando'
  | 'solicitado'
  | 'gerando_pdf'
  | 'enviando_storage'
  | 'finalizando'
  | 'concluido'
  | 'erro';

/**
 * Dados de progresso da emissão
 */
export interface ProgressoEmissao {
  status: StatusEmissao;
  mensagem: string;
  porcentagem: number;
  etapa: number;
  totalEtapas: number;
  tempoDecorrido?: number;
  tempoEstimado?: number;
  erro?: string;
}

/**
 * Configuração do hook
 */
export interface UseProgressoEmissaoConfig {
  /** ID do lote sendo emitido */
  loteId: number;
  /** Intervalo de polling em ms (default: 2000) */
  intervaloPolling?: number;
  /** Timeout total em ms (default: 300000 = 5min) */
  timeout?: number;
  /** Callback quando emissão for concluída */
  onConcluido?: (resultado: any) => void;
  /** Callback quando houver erro */
  onErro?: (erro: string) => void;
}

/**
 * Hook para monitorar progresso de emissão
 */
export function useProgressoEmissao(config: UseProgressoEmissaoConfig) {
  const {
    loteId,
    intervaloPolling = 2000,
    timeout = 300000,
    onConcluido,
    onErro,
  } = config;

  const [progresso, setProgresso] = useState<ProgressoEmissao>({
    status: 'idle',
    mensagem: 'Aguardando...',
    porcentagem: 0,
    etapa: 0,
    totalEtapas: 5,
  });

  const [monitorando, setMonitorando] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const inicioRef = useRef<number>();

  /**
   * Buscar status atual da emissão
   */
  const buscarStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/emissor/laudos/${loteId}/progresso`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar progresso');
      }

      const dados: ProgressoEmissao = await response.json();

      // Calcular tempo decorrido
      if (inicioRef.current) {
        dados.tempoDecorrido = Date.now() - inicioRef.current;

        // Estimar tempo restante baseado no progresso
        if (dados.porcentagem > 0 && dados.porcentagem < 100) {
          const tempoTotal = (dados.tempoDecorrido / dados.porcentagem) * 100;
          dados.tempoEstimado = tempoTotal - dados.tempoDecorrido;
        }
      }

      setProgresso(dados);

      // Verificar se concluiu
      if (dados.status === 'concluido') {
        pararMonitoramento();
        onConcluido?.(dados);
      } else if (dados.status === 'erro') {
        pararMonitoramento();
        onErro?.(dados.erro || 'Erro desconhecido');
      }

      // Verificar timeout
      if (inicioRef.current && Date.now() - inicioRef.current > timeout) {
        pararMonitoramento();
        setProgresso((prev) => ({
          ...prev,
          status: 'erro',
          mensagem: 'Tempo esgotado',
          erro: 'A emissão excedeu o tempo máximo permitido',
        }));
        onErro?.('Timeout na emissão');
      }
    } catch (erro) {
      console.error('[PROGRESSO] Erro ao buscar status:', erro);

      setProgresso((prev) => ({
        ...prev,
        status: 'erro',
        mensagem: 'Erro ao buscar progresso',
        erro: erro instanceof Error ? erro.message : 'Erro desconhecido',
      }));

      pararMonitoramento();
      onErro?.(erro instanceof Error ? erro.message : 'Erro desconhecido');
    }
  }, [loteId, timeout, onConcluido, onErro]);

  /**
   * Iniciar monitoramento
   */
  const iniciarMonitoramento = useCallback(() => {
    if (monitorando) return;

    console.log('[PROGRESSO] Iniciando monitoramento do lote', loteId);

    inicioRef.current = Date.now();
    setMonitorando(true);

    // Primeira busca imediata
    buscarStatus();

    // Configurar polling
    intervalRef.current = setInterval(() => {
      buscarStatus();
    }, intervaloPolling);
  }, [loteId, monitorando, intervaloPolling, buscarStatus]);

  /**
   * Parar monitoramento
   */
  const pararMonitoramento = useCallback(() => {
    console.log('[PROGRESSO] Parando monitoramento');

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    setMonitorando(false);
  }, []);

  /**
   * Resetar progresso
   */
  const resetar = useCallback(() => {
    pararMonitoramento();
    setProgresso({
      status: 'idle',
      mensagem: 'Aguardando...',
      porcentagem: 0,
      etapa: 0,
      totalEtapas: 5,
    });
    inicioRef.current = undefined;
  }, [pararMonitoramento]);

  /**
   * Cleanup ao desmontar
   */
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    progresso,
    monitorando,
    iniciarMonitoramento,
    pararMonitoramento,
    resetar,
  };
}

/**
 * Formatar tempo em segundos para exibição
 */
export function formatarTempo(ms: number): string {
  const segundos = Math.floor(ms / 1000);

  if (segundos < 60) {
    return `${segundos}s`;
  }

  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;

  return `${minutos}m ${segs}s`;
}

/**
 * Obter mensagem de progresso baseada no status
 */
export function getMensagemProgresso(status: StatusEmissao): string {
  const mensagens: Record<StatusEmissao, string> = {
    idle: 'Aguardando início...',
    solicitando: 'Solicitando emissão...',
    solicitado: 'Emissão solicitada',
    gerando_pdf: 'Gerando PDF do laudo...',
    enviando_storage: 'Enviando para armazenamento...',
    finalizando: 'Finalizando processo...',
    concluido: 'Emissão concluída com sucesso!',
    erro: 'Erro na emissão',
  };

  return mensagens[status] || status;
}

/**
 * Obter porcentagem baseada no status/etapa
 */
export function calcularPorcentagem(
  status: StatusEmissao,
  etapa: number,
  totalEtapas: number
): number {
  const porcentagens: Record<StatusEmissao, number> = {
    idle: 0,
    solicitando: 10,
    solicitado: 20,
    gerando_pdf: 50,
    enviando_storage: 80,
    finalizando: 95,
    concluido: 100,
    erro: 0,
  };

  // Usar porcentagem do status se disponível
  if (porcentagens[status] !== undefined) {
    return porcentagens[status];
  }

  // Caso contrário, calcular baseado na etapa
  if (totalEtapas > 0) {
    return Math.floor((etapa / totalEtapas) * 100);
  }

  return 0;
}
