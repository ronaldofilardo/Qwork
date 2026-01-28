'use client';

import { useState } from 'react';
import {
  X,
  CreditCard,
  Smartphone,
  FileText,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import QworkLogo from '@/components/QworkLogo';
import {
  validarMetodoPagamento,
  validarValor,
  MENSAGENS_ERRO,
} from '@/lib/validacoes-contratacao';

interface ModalPagamentoProps {
  isOpen: boolean;
  onClose: () => void;
  contratanteId: number;
  contratoId: number;
  valor: number;
  planoNome: string;
  onPagamentoConfirmado?: (data?: any) => void;
  // Para facilitar testes/integrações de dev: método inicial (opcional)
  initialMetodo?: MetodoPagamento | null;
}

type MetodoPagamento = 'pix' | 'boleto' | 'cartao';

export default function ModalPagamento({
  isOpen,
  onClose,
  contratanteId,
  contratoId,
  valor,
  planoNome,
  onPagamentoConfirmado,
  initialMetodo = null,
}: ModalPagamentoProps) {
  const [metodoSelecionado, setMetodoSelecionado] =
    useState<MetodoPagamento | null>(initialMetodo || null);
  const [processando, setProcessando] = useState(false);
  const [pagamentoRealizado, setPagamentoRealizado] = useState(false);
  const [erro, setErro] = useState('');
  const [pagamentoId, setPagamentoId] = useState<number | null>(null);
  const [confirmResponse, setConfirmResponse] = useState<any>(null);

  if (!isOpen) return null;

  const resetar = () => {
    setMetodoSelecionado(null);
    setProcessando(false);
    setPagamentoRealizado(false);
    setErro('');
    setPagamentoId(null);
  };

  const handleFechar = () => {
    resetar();
    onClose();
  };

  const iniciarPagamento = async () => {
    // Validações
    if (!validarMetodoPagamento(metodoSelecionado)) {
      setErro(MENSAGENS_ERRO.METODO_PAGAMENTO_OBRIGATORIO);
      return;
    }

    if (!validarValor(valor)) {
      setErro(MENSAGENS_ERRO.VALOR_INVALIDO);
      return;
    }

    if (!contratanteId || !contratoId) {
      setErro('Dados de contratante ou contrato inválidos');
      return;
    }

    setProcessando(true);
    setErro('');

    try {
      // Iniciar pagamento
      const response = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'iniciar',
          contratante_id: contratanteId,
          contrato_id: contratoId,
          valor,
          metodo: metodoSelecionado,
          plataforma_nome: 'Simulado',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao iniciar pagamento');
      }

      setPagamentoId(data.pagamento.id);

      // Simular processamento (2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Confirmar pagamento automaticamente (simulação)
      const confirmaResponse = await fetch('/api/pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'confirmar',
          pagamento_id: data.pagamento.id,
          plataforma_id: `SIM-${Date.now()}`,
          dados_adicionais: {
            metodo: metodoSelecionado,
            simulado: true,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const confirmaData = await confirmaResponse.json();

      if (!confirmaResponse.ok) {
        throw new Error(confirmaData.error || 'Erro ao confirmar pagamento');
      }

      setConfirmResponse(confirmaData);
      setPagamentoRealizado(true);

      // Chamar callback se fornecido, passando dados do servidor
      if (onPagamentoConfirmado) {
        setTimeout(() => {
          onPagamentoConfirmado(confirmaData);
        }, 1500);
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      setErro(
        error instanceof Error ? error.message : 'Erro ao processar pagamento'
      );
    } finally {
      setProcessando(false);
    }
  };

  // Somente para desenvolvimento: permite simular confirmação via endpoint de simulação
  const simularPagamento = async () => {
    if (!validarMetodoPagamento(metodoSelecionado)) {
      setErro(MENSAGENS_ERRO.METODO_PAGAMENTO_OBRIGATORIO);
      return;
    }

    setProcessando(true);
    setErro('');

    try {
      let pid = pagamentoId;

      // Se não há pagamento iniciado, iniciar um pagamento primeiro
      if (!pid) {
        const resp = await fetch('/api/pagamento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            acao: 'iniciar',
            contratante_id: contratanteId,
            contrato_id: contratoId,
            valor,
            metodo: metodoSelecionado,
            plataforma_nome: 'Simulado',
          }),
        });
        const data = await resp.json();
        if (!resp.ok)
          throw new Error(data.error || 'Erro ao iniciar pagamento');
        pid = data.pagamento.id;
        setPagamentoId(pid);
      }

      // Chamar endpoint de simulação
      const simResp = await fetch('/api/pagamento/simular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagamento_id: pid,
          metodo_pagamento: metodoSelecionado,
        }),
      });

      const simData = await simResp.json();
      if (!simResp.ok)
        throw new Error(simData.error || 'Erro ao simular pagamento');

      setPagamentoRealizado(true);
      setPagamentoId(pid);

      if (onPagamentoConfirmado) {
        setTimeout(() => onPagamentoConfirmado(), 1200);
      }
    } catch (error) {
      console.error('Erro ao simular pagamento:', error);
      setErro(
        error instanceof Error ? error.message : 'Erro ao simular pagamento'
      );
    } finally {
      setProcessando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <QworkLogo size="sm" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pagamento</h2>
              <p className="text-sm text-gray-500 mt-1">
                Finalize seu cadastro realizando o pagamento
              </p>
            </div>
          </div>
          <button
            onClick={handleFechar}
            className="text-gray-400 hover:text-gray-600"
            disabled={processando}
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {!pagamentoRealizado ? (
            <>
              {/* Informações do plano */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {planoNome}
                </h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Valor:</span>
                  <span className="text-2xl font-bold text-orange-600">
                    R$ {valor.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Seleção de método de pagamento */}
              <div className="space-y-4 mb-6">
                {/* Test helper: expor método selecionado para facilitar testes */}
                <div data-testid="metodo-selecionado" className="sr-only">
                  {metodoSelecionado}
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecione o método de pagamento:
                </label>

                {/* PIX */}
                <label className="relative">
                  <input
                    type="radio"
                    name="metodo"
                    value="pix"
                    checked={metodoSelecionado === 'pix'}
                    onChange={() => setMetodoSelecionado('pix')}
                    disabled={processando}
                    className="sr-only"
                  />
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      metodoSelecionado === 'pix'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    } ${processando ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-6 h-6 text-orange-600" />
                      <div className="flex-1">
                        <div className="font-medium">PIX</div>
                        <div className="text-sm text-gray-600">
                          Aprovação instantânea
                        </div>
                      </div>
                      {metodoSelecionado === 'pix' && (
                        <Check className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </div>
                </label>

                {/* Boleto */}
                <label className="relative">
                  <input
                    type="radio"
                    name="metodo"
                    value="boleto"
                    checked={metodoSelecionado === 'boleto'}
                    onChange={() => setMetodoSelecionado('boleto')}
                    disabled={processando}
                    className="sr-only"
                  />
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      metodoSelecionado === 'boleto'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    } ${processando ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-orange-600" />
                      <div className="flex-1">
                        <div className="font-medium">Boleto Bancário</div>
                        <div className="text-sm text-gray-600">
                          Vencimento em 3 dias úteis
                        </div>
                      </div>
                      {metodoSelecionado === 'boleto' && (
                        <Check className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </div>
                </label>

                {/* Cartão */}
                <label className="relative">
                  <input
                    type="radio"
                    name="metodo"
                    value="cartao"
                    checked={metodoSelecionado === 'cartao'}
                    onChange={() => setMetodoSelecionado('cartao')}
                    disabled={processando}
                    className="sr-only"
                  />
                  <div
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      metodoSelecionado === 'cartao'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    } ${processando ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-orange-600" />
                      <div className="flex-1">
                        <div className="font-medium">Cartão de Crédito</div>
                        <div className="text-sm text-gray-600">
                          Parcelamento disponível
                        </div>
                      </div>
                      {metodoSelecionado === 'cartao' && (
                        <Check className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                  </div>
                </label>
              </div>

              {/* Erro */}
              {erro && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{erro}</p>
                </div>
              )}

              {/* Aviso de simulação */}
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Modo simulação:</strong> Este é um pagamento simulado
                  para demonstração. O sistema processará automaticamente.
                </p>
              </div>

              {/* Botões */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleFechar}
                  disabled={processando}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={iniciarPagamento}
                  disabled={!metodoSelecionado || processando}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    'Realizar Pagamento'
                  )}
                </button>

                {/* Botão de simulação (desenvolvimento) */}
                {process.env.NODE_ENV !== 'production' && (
                  <button
                    type="button"
                    onClick={simularPagamento}
                    disabled={!metodoSelecionado || processando}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Simular Pagamento
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Sucesso */
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Pagamento Confirmado!
              </h3>
              {confirmResponse?.proximos_passos ? (
                <div className="mb-4 text-left">
                  {confirmResponse.proximos_passos.map(
                    (p: string, i: number) => (
                      <p key={i} className="text-gray-600 mb-1">
                        {p}
                      </p>
                    )
                  )}
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-1">
                    Seu pagamento foi processado com sucesso.
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Aguarde a aprovação final do administrador para liberar seu
                    acesso.
                  </p>
                </>
              )}
              {pagamentoId && (
                <p className="text-xs text-gray-400 mb-6">
                  ID do Pagamento: #{pagamentoId}
                </p>
              )}
              <button
                onClick={handleFechar}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
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
