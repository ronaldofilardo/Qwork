'use client';

import { useState } from 'react';
import {
  validarMetodoPagamento,
  validarValor,
  MENSAGENS_ERRO,
} from '@/lib/validacoes-contratacao';

type MetodoPagamento = 'pix' | 'boleto' | 'cartao';

interface UseModalPagamentoActionsParams {
  tomadorId: number;
  contratoId: number;
  valor: number;
  onPagamentoConfirmado?: (data?: unknown) => void;
}

async function iniciarEConfirmar(
  tomadorId: number,
  contratoId: number,
  valor: number,
  metodo: MetodoPagamento
): Promise<{ pagamentoId: number; confirmaData: unknown }> {
  const response = await fetch('/api/pagamento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      acao: 'iniciar',
      tomador_id: tomadorId,
      contrato_id: contratoId,
      valor,
      metodo,
      plataforma_nome: 'Simulado',
    }),
  });
  const data = (await response.json()) as {
    error?: string;
    pagamento?: { id: number };
  };
  if (!response.ok) throw new Error(data.error ?? 'Erro ao iniciar pagamento');

  await new Promise((resolve) => setTimeout(resolve, 2000));

  const confirmaResponse = await fetch('/api/pagamento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      acao: 'confirmar',
      pagamento_id: data.pagamento?.id,
      plataforma_id: `SIM-${Date.now()}`,
      dados_adicionais: {
        metodo,
        simulado: true,
        timestamp: new Date().toISOString(),
      },
    }),
  });
  const confirmaData = (await confirmaResponse.json()) as { error?: string };
  if (!confirmaResponse.ok)
    throw new Error(confirmaData.error ?? 'Erro ao confirmar pagamento');
  return { pagamentoId: data.pagamento?.id ?? 0, confirmaData };
}

async function iniciarApenas(
  tomadorId: number,
  contratoId: number,
  valor: number,
  metodo: MetodoPagamento
): Promise<number> {
  const resp = await fetch('/api/pagamento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      acao: 'iniciar',
      tomador_id: tomadorId,
      contrato_id: contratoId,
      valor,
      metodo,
      plataforma_nome: 'Simulado',
    }),
  });
  const data = (await resp.json()) as {
    error?: string;
    pagamento?: { id: number };
  };
  if (!resp.ok) throw new Error(data.error ?? 'Erro ao iniciar pagamento');
  return data.pagamento?.id ?? 0;
}

function useModalPagamentoState() {
  const [processando, setProcessando] = useState(false);
  const [pagamentoRealizado, setPagamentoRealizado] = useState(false);
  const [erro, setErro] = useState('');
  const [pagamentoId, setPagamentoId] = useState<number | null>(null);
  const [confirmResponse, setConfirmResponse] = useState<unknown>(null);
  return {
    processando,
    setProcessando,
    pagamentoRealizado,
    setPagamentoRealizado,
    erro,
    setErro,
    pagamentoId,
    setPagamentoId,
    confirmResponse,
    setConfirmResponse,
  };
}

export function useModalPagamentoActions({
  tomadorId,
  contratoId,
  valor,
  onPagamentoConfirmado,
}: UseModalPagamentoActionsParams) {
  const s = useModalPagamentoState();

  const iniciarPagamento = async (metodo: MetodoPagamento | null) => {
    if (!validarMetodoPagamento(metodo)) {
      s.setErro(MENSAGENS_ERRO.METODO_PAGAMENTO_OBRIGATORIO);
      return;
    }
    if (!validarValor(valor)) {
      s.setErro(MENSAGENS_ERRO.VALOR_INVALIDO);
      return;
    }
    if (!tomadorId || !contratoId) {
      s.setErro('Dados de tomador ou contrato inválidos');
      return;
    }
    const metodoValidado = metodo as MetodoPagamento; // narrowed by validarMetodoPagamento above
    s.setProcessando(true);
    s.setErro('');
    try {
      const { pagamentoId: pid, confirmaData } = await iniciarEConfirmar(
        tomadorId,
        contratoId,
        valor,
        metodoValidado
      );
      s.setPagamentoId(pid);
      s.setConfirmResponse(confirmaData);
      s.setPagamentoRealizado(true);
      if (onPagamentoConfirmado)
        setTimeout(() => onPagamentoConfirmado(confirmaData), 1500);
    } catch (error) {
      s.setErro(
        error instanceof Error ? error.message : 'Erro ao processar pagamento'
      );
    } finally {
      s.setProcessando(false);
    }
  };

  const simularPagamento = async (
    metodo: MetodoPagamento | null,
    currentPagamentoId: number | null
  ) => {
    if (!validarMetodoPagamento(metodo)) {
      s.setErro(MENSAGENS_ERRO.METODO_PAGAMENTO_OBRIGATORIO);
      return;
    }
    const metodoValidado = metodo as MetodoPagamento; // narrowed by validarMetodoPagamento above
    s.setProcessando(true);
    s.setErro('');
    try {
      let pid = currentPagamentoId;
      if (!pid) {
        pid = await iniciarApenas(tomadorId, contratoId, valor, metodoValidado);
        s.setPagamentoId(pid);
      }
      const simResp = await fetch('/api/pagamento/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagamento_id: pid, metodo_pagamento: metodo }),
      });
      const simData = (await simResp.json()) as { error?: string };
      if (!simResp.ok)
        throw new Error(simData.error ?? 'Erro ao simular pagamento');
      s.setPagamentoRealizado(true);
      s.setPagamentoId(pid);
      if (onPagamentoConfirmado)
        setTimeout(() => onPagamentoConfirmado(), 1200);
    } catch (error) {
      s.setErro(
        error instanceof Error ? error.message : 'Erro ao simular pagamento'
      );
    } finally {
      s.setProcessando(false);
    }
  };

  const reset = () => {
    s.setProcessando(false);
    s.setPagamentoRealizado(false);
    s.setErro('');
    s.setPagamentoId(null);
  };

  return {
    processando: s.processando,
    pagamentoRealizado: s.pagamentoRealizado,
    erro: s.erro,
    pagamentoId: s.pagamentoId,
    confirmResponse: s.confirmResponse,
    iniciarPagamento,
    simularPagamento,
    reset,
  };
}
