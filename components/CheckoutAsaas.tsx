// components/CheckoutAsaas.tsx
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface CheckoutAsaasProps {
  tomadorId: number;
  planoId: number;
  numeroFuncionarios?: number;
  valor: number;
  contratoId?: number | null;
  loteId?: number | null; // ID do lote de emissão (opcional)
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

type FormaPagamento = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

interface PaymentData {
  pagamento: {
    id: number;
    status: string;
    asaas_payment_id: string;
    asaas_payment_url?: string;
    asaas_boleto_url?: string;
    asaas_invoice_url?: string;
    asaas_pix_qrcode?: string;
    asaas_pix_qrcode_image?: string;
    asaas_due_date?: string;
  };
  pixQrCode?: {
    payload: string;
    encodedImage: string;
  };
  bankSlipUrl?: string;
  paymentUrl?: string;
  dueDate?: string;
  billingType: FormaPagamento;
}

export default function CheckoutAsaas({
  tomadorId,
  planoId,
  numeroFuncionarios = 0,
  valor,
  contratoId = null,
  loteId = null,
  onSuccess,
  onError,
}: CheckoutAsaasProps) {
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState('');
  const [pollingPayment, setPollingPayment] = useState(false);

  // Poll para verificar status do pagamento — consulta o Asaas diretamente via /sincronizar
  // Funciona para PIX e CREDIT_CARD, independente de webhook
  useEffect(() => {
    if (!paymentData || !pollingPayment) return;

    let attempts = 0;
    const maxAttempts = 72; // 6 minutos (5s × 72)

    const interval = setInterval(async () => {
      attempts++;

      try {
        // POST /api/pagamento/asaas/sincronizar: consulta o Asaas em tempo real
        // e aciona a máquina de estados local se o pagamento foi confirmado no Asaas
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
    }, 5000); // Verifica a cada 5 segundos

    return () => clearInterval(interval);
  }, [paymentData, pollingPayment, onSuccess]);

  const iniciarPagamento = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/pagamento/asaas/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tomador_id: tomadorId,
          contrato_id: contratoId,
          plano_id: planoId,
          numero_funcionarios: numeroFuncionarios,
          valor_total: valor,
          metodo: formaPagamento,
          lote_id: loteId, // Incluir lote_id para emissões
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar pagamento');
      }

      setPaymentData(data);

      // Se for PIX, iniciar polling
      if (formaPagamento === 'PIX') {
        setPollingPayment(true);
        toast.success('QR Code PIX gerado! Escaneie para pagar.');
      }

      // Se for cartão: abre o checkout Asaas em nova aba (mantém esta página)
      // e inicia polling para detectar confirmação automaticamente
      if (formaPagamento === 'CREDIT_CARD' && data.paymentUrl) {
        window.open(data.paymentUrl, '_blank', 'noopener,noreferrer');
        setPollingPayment(true);
        toast.success(
          '💳 Checkout aberto em nova aba. Conclua o pagamento lá — esta página detectará automaticamente a confirmação.',
          { duration: 6000 }
        );
      }

      // Se for boleto, iniciar polling para detectar confirmação automaticamente
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

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const copiarCodigoPix = () => {
    if (!paymentData?.pixQrCode?.payload) return;

    navigator.clipboard.writeText(paymentData.pixQrCode.payload);
    toast.success('Código PIX copiado!');
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  // Verificação manual do pagamento do boleto (chamada pelo usuário após pagar)
  const verificarPagamentoBoleto = async () => {
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
          {
            icon: 'ℹ️',
            duration: 5000,
          }
        );
      }
    } catch {
      toast.error('Erro ao verificar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Tela de seleção de forma de pagamento
  if (!paymentData) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Finalizar Pagamento
        </h2>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-gray-700">
            <strong>Valor total:</strong> {formatCurrency(valor)}
          </p>
        </div>

        <h3 className="text-lg font-semibold mb-3 text-gray-700">
          Escolha a forma de pagamento:
        </h3>

        <div className="space-y-3 mb-6">
          {/* PIX */}
          <label
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formaPagamento === 'PIX'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="pagamento"
              value="PIX"
              checked={formaPagamento === 'PIX'}
              onChange={(e) =>
                setFormaPagamento(e.target.value as FormaPagamento)
              }
              className="mr-3 w-5 h-5"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="text-2xl mr-2">💳</span>
                <span className="font-semibold text-gray-800">PIX</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Pagamento instantâneo via QR Code
              </p>
            </div>
          </label>

          {/* Boleto */}
          <label
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formaPagamento === 'BOLETO'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="pagamento"
              value="BOLETO"
              checked={formaPagamento === 'BOLETO'}
              onChange={(e) =>
                setFormaPagamento(e.target.value as FormaPagamento)
              }
              className="mr-3 w-5 h-5"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="text-2xl mr-2">📄</span>
                <span className="font-semibold text-gray-800">
                  Boleto Bancário
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Vencimento em 3 dias úteis
              </p>
            </div>
          </label>

          {/* Cartão de Crédito */}
          <label
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formaPagamento === 'CREDIT_CARD'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="pagamento"
              value="CREDIT_CARD"
              checked={formaPagamento === 'CREDIT_CARD'}
              onChange={(e) =>
                setFormaPagamento(e.target.value as FormaPagamento)
              }
              className="mr-3 w-5 h-5"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="text-2xl mr-2">💳</span>
                <span className="font-semibold text-gray-800">
                  Cartão de Crédito
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Parcelamento disponível
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <button
          onClick={iniciarPagamento}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processando...' : 'Continuar para Pagamento'}
        </button>

        <p className="mt-4 text-xs text-center text-gray-500">
          Pagamento seguro processado por Asaas
        </p>
      </div>
    );
  }

  // Tela de PIX
  if (formaPagamento === 'PIX' && paymentData.pixQrCode) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          📱 Pague com PIX
        </h2>

        {pollingPayment && (
          <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-lg">
            <p className="font-semibold">Aguardando pagamento...</p>
            <p className="text-sm">
              A página atualizará automaticamente após confirmação
            </p>
          </div>
        )}

        <div className="mb-4">
          {paymentData.pixQrCode.encodedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`data:image/png;base64,${paymentData.pixQrCode.encodedImage}`}
              alt="QR Code PIX"
              className="mx-auto max-w-xs border-4 border-gray-200 rounded-lg"
            />
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Escaneie o QR Code com seu aplicativo bancário
        </p>

        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <p className="text-xs text-gray-500 mb-2">
            Ou copie e cole o código:
          </p>
          <code className="text-xs break-all block bg-white p-3 rounded border">
            {paymentData.pixQrCode.payload}
          </code>
        </div>

        <button
          onClick={copiarCodigoPix}
          className="w-full mb-3 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
        >
          📋 Copiar Código PIX
        </button>

        {paymentData.dueDate && (
          <p className="text-sm text-gray-500 mb-4">
            Válido até: {formatDate(paymentData.dueDate)}
          </p>
        )}

        <button
          onClick={() => setPaymentData(null)}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Voltar e escolher outro método
        </button>
      </div>
    );
  }

  // Tela de Boleto
  if (formaPagamento === 'BOLETO') {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          📄 Boleto Gerado
        </h2>

        <p className="text-gray-600 mb-6">Seu boleto foi gerado com sucesso!</p>

        <a
          href={paymentData.bankSlipUrl || paymentData.paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 mb-4"
        >
          📥 Visualizar Boleto
        </a>

        {paymentData.dueDate && (
          <p className="text-sm text-gray-600 mb-4">
            <strong>Vencimento:</strong> {formatDate(paymentData.dueDate)}
          </p>
        )}

        {/* Indicador de monitoramento automático */}
        {pollingPayment && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 text-blue-700">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm font-medium">
                Monitorando pagamento automaticamente...
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Esta página atualizará quando o pagamento for confirmado.
            </p>
          </div>
        )}

        <div className="bg-yellow-50 p-4 rounded-lg mb-4 text-left">
          <p className="text-sm text-gray-700">
            <strong>ℹ️ Instruções:</strong>
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>Pague o boleto em qualquer banco ou lotérica</li>
            <li>O pagamento pode levar até 2 dias úteis para confirmar</li>
            <li>Você receberá um email quando o pagamento for confirmado</li>
          </ul>
        </div>

        {/* Botão de verificação manual — útil após efetuar o pagamento */}
        <button
          onClick={verificarPagamentoBoleto}
          disabled={loading}
          className="w-full mb-3 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verificando...' : '🔍 Já paguei — Verificar Confirmação'}
        </button>

        <button
          onClick={() => setPaymentData(null)}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Voltar e escolher outro método
        </button>
      </div>
    );
  }

  // Tela de Cartão de Crédito — checkout aberto em nova aba, polling ativo nesta tela
  if (formaPagamento === 'CREDIT_CARD') {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          💳 Pagamento com Cartão
        </h2>

        {pollingPayment ? (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg
                className="animate-spin h-5 w-5 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="font-semibold text-blue-700">
                Aguardando confirmação...
              </span>
            </div>
            <p className="text-sm text-blue-600">
              Complete o pagamento na aba do Asaas. Esta página atualizará
              automaticamente após a confirmação.
            </p>
          </div>
        ) : (
          <p className="mb-4 text-gray-600">
            Clique no botão abaixo para abrir o checkout seguro do Asaas.
          </p>
        )}

        {paymentData.paymentUrl && (
          <a
            href={paymentData.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => !pollingPayment && setPollingPayment(true)}
            className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 mb-4"
          >
            🔒 Abrir Checkout Asaas
          </a>
        )}

        <div className="bg-gray-50 p-4 rounded-lg mb-4 text-left text-sm text-gray-600">
          <p className="font-semibold mb-1">ℹ️ Como funciona:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Clique em &quot;Abrir Checkout Asaas&quot; (nova aba)</li>
            <li>Preencha seus dados de cartão no site seguro da Asaas</li>
            <li>Esta página detectará a confirmação automaticamente</li>
          </ol>
        </div>

        <button
          onClick={() => setPaymentData(null)}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Voltar e escolher outro método
        </button>
      </div>
    );
  }

  // Fallback genérico (não deve ser alcançado em condições normais)
  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4">Processando...</h2>
      <p className="text-gray-600">
        Aguarde enquanto processamos seu pagamento.
      </p>
    </div>
  );
}
