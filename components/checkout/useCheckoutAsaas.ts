'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import type { FormaPagamento, PaymentData } from './types';

interface UseCheckoutAsaasOptions {
  tomadorId: number;
  numeroFuncionarios: number;
  valor: number;
  contratoId: number | null;
  loteId: number | null;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function useCheckoutAsaas({
  tomadorId,
  numeroFuncionarios,
  valor,
  contratoId,
  loteId,
  onSuccess,
  onError,
}: UseCheckoutAsaasOptions) {
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const [pollingPayment, setPollingPayment] = useState(false);

  // Poll para verificar status do pagamento
  useEffect(() => {
    if (!paymentData || !pollingPayment) return;

    let attempts = 0;
    const maxAttempts = 72; // 6 minutos (5s × 72)

    const interval = setInterval(async () => {
      attempts++;

      try {
        const response = await fetch('/api/pagamento/asaas/sincronizar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pagamento_id: paymentData.pagamento.id }),
        });
        const data = await response.json();

        if (data.status === 'pago') {
          clearInterval(interval);
          setPollingPayment(false);
          toast.success('🎉 Pagamento confirmado! Redirecionando...');

          setTimeout(() => {
            if (onSuccess) {
              onSuccess();
            } else {
              window.location.href = '/dashboard';
            }
          }, 2000);
        }

        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setPollingPayment(false);
          console.warn(
            '[Checkout] Timeout na verificação de pagamento após 6 minutos'
          );
        }
      } catch (pollError) {
        console.error('[Checkout] Erro ao verificar status:', pollError);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentData, pollingPayment, onSuccess]);

  const iniciarPagamento = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/pagamento/asaas/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tomador_id: tomadorId,
          contrato_id: contratoId,
          numero_funcionarios: numeroFuncionarios,
          valor_total: valor,
          metodo: formaPagamento,
          lote_id: loteId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      setPaymentData(data);

      if (formaPagamento === 'PIX') {
        setPollingPayment(true);
        toast.success('QR Code PIX gerado! Escaneie para pagar.');
      }

      if (formaPagamento === 'CREDIT_CARD' && data.paymentUrl) {
        window.open(data.paymentUrl, '_blank', 'noopener,noreferrer');
        setPollingPayment(true);
        toast.success(
          '💳 Checkout aberto em nova aba. Conclua o pagamento lá — esta página detectará automaticamente a confirmação.',
          { duration: 6000 }
        );
      }

      if (formaPagamento === 'BOLETO') {
        setPollingPayment(true);
        toast.success(
          '🧾 Boleto gerado! Esta página detectará automaticamente a confirmação após o pagamento.',
          { duration: 8000 }
        );
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao iniciar pagamento';
      setError(errorMessage);
      toast.error(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [
    tomadorId,
    contratoId,
    numeroFuncionarios,
    valor,
    formaPagamento,
    loteId,
    onError,
  ]);

  const copiarCodigoPix = useCallback(() => {
    if (!paymentData?.pixQrCode?.payload) return;
    navigator.clipboard.writeText(paymentData.pixQrCode.payload);
    toast.success('Código PIX copiado!');
  }, [paymentData]);

  const verificarPagamentoBoleto = useCallback(async () => {
    if (!paymentData) return;
    setLoading(true);
    try {
      const response = await fetch('/api/pagamento/asaas/sincronizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagamento_id: paymentData.pagamento.id }),
      });
      const data = await response.json();

      if (data.status === 'pago') {
        setPollingPayment(false);
        toast.success('🎉 Pagamento confirmado! Redirecionando...');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          else window.location.href = '/dashboard';
        }, 2000);
      } else {
        toast(
          '⏳ Pagamento ainda não confirmado pelo banco. Tente novamente em instantes.',
          { icon: 'ℹ️', duration: 5000 }
        );
      }
    } catch {
      toast.error('Erro ao verificar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [paymentData, onSuccess]);

  const resetPayment = useCallback(() => {
    setPaymentData(null);
  }, []);

  return {
    formaPagamento,
    setFormaPagamento,
    loading,
    paymentData,
    error,
    pollingPayment,
    setPollingPayment,
    iniciarPagamento,
    copiarCodigoPix,
    verificarPagamentoBoleto,
    resetPayment,
  };
}

export function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch {
    return dateString;
  }
}
