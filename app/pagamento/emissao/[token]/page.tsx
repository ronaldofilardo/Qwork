'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Clock, Building2, FileText } from 'lucide-react';
import PaymentSimulator from '@/components/PaymentSimulator';
import CheckoutAsaas from '@/components/CheckoutAsaas';
import { DadosPagamentoEmissao } from '@/lib/types/emissao-pagamento';

interface PageProps {
  params: {
    token: string;
  };
}

export default function PagamentoEmissaoPage({ params }: PageProps) {
  const [dados, setDados] = useState<DadosPagamentoEmissao | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pago, setPago] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [usarAsaas, setUsarAsaas] = useState(true); // Toggle: Asaas ou Simulador
  const router = useRouter();

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pagamento/emissao/${params.token}/info`);
      const data = await res.json();

      if (res.ok) {
        setDados(data);
      } else {
        if (data.already_paid) {
          setPago(true);
        }
        setErro(data.error || 'Erro ao carregar dados');
      }
    } catch (error) {
      void error;
      setErro('Erro ao conectar ao servidor');
    } finally {
      setLoading(false);
    }
  }, [params.token]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const confirmarPagamento = async (
    metodo: string,
    parcelas: number,
    valor: number
  ) => {
    setProcessando(true);
    try {
      const res = await fetch(
        `/api/pagamento/emissao/${params.token}/confirmar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metodo_pagamento: metodo,
            num_parcelas: parcelas,
            valor_total: valor,
          }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Redirecionar para página de sucesso
        router.push('/pagamento/emissao/sucesso');
      } else {
        setErro(data.error || 'Erro ao confirmar pagamento');
      }
    } catch (error) {
      void error;
      setErro('Erro ao processar pagamento');
    } finally {
      setProcessando(false);
    }
  };

  const handleAsaasSuccess = () => {
    // Sucesso no pagamento Asaas - redirecionar
    router.push('/pagamento/emissao/sucesso');
  };

  const handleAsaasError = (errorMsg: string) => {
    setErro(errorMsg);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md w-full mx-4">
          <div className="p-6">
            <div className="text-center">
              <Clock className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">
                Carregando informações...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (erro || pago) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 max-w-md w-full">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              {pago ? 'Já Foi Pago' : 'Erro'}
            </h2>
          </div>
          <div className="p-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">{erro}</p>
            {pago && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Este link já foi utilizado. O laudo está sendo processado.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!dados) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Pagamento de Emissão de Laudo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete o pagamento para liberar a emissão do seu laudo
          </p>
        </div>

        {/* Card de Informações */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações do Laudo
            </h2>
          </div>
          <div className="p-4">
            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">{dados.nome_tomador}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    CNPJ: {dados.cnpj_tomador}
                  </p>
                  {dados.nome_empresa && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Empresa: {dados.nome_empresa}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Lote
                  </p>
                  <p className="font-medium">#{dados.lote_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Avaliações
                  </p>
                  <p className="font-medium">{dados.num_avaliacoes}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Valor por Funcionário
                  </p>
                  <p className="font-medium">
                    R$ {dados.valor_por_funcionario.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Valor Total
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {dados.valor_total.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg mt-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>⚠️ Link de uso único:</strong> Este link será
                  invalidado após o pagamento.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Simulador de Pagamento ou Asaas */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">
                Escolha a Forma de Pagamento
              </h2>

              {/* Toggle Simulador / Asaas */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUsarAsaas(false)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    !usarAsaas
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                  }`}
                >
                  Simulador
                </button>
                <button
                  onClick={() => setUsarAsaas(true)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    usarAsaas
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                  }`}
                >
                  Asaas (Real)
                </button>
              </div>
            </div>
          </div>
          <div className="p-4">
            {processando ? (
              <div className="text-center py-8">
                <Clock className="animate-spin h-12 w-12 mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600 dark:text-gray-400">
                  Processando pagamento...
                </p>
              </div>
            ) : usarAsaas ? (
              // Checkout Asaas Real
              dados.tomador_id ? (
                <CheckoutAsaas
                  tomadorId={dados.tomador_id}
                  planoId={1} // Não usado em emissão, mas obrigatório
                  numeroFuncionarios={dados.num_avaliacoes}
                  valor={dados.valor_total}
                  contratoId={null}
                  onSuccess={handleAsaasSuccess}
                  onError={handleAsaasError}
                />
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">
                    ⚠️ Erro: tomador_id não encontrado.
                    <br />
                    <span className="text-xs">
                      Debug: {JSON.stringify(dados)}
                    </span>
                  </p>
                </div>
              )
            ) : (
              // Simulador Antigo
              <PaymentSimulator
                valorTotal={dados.valor_total}
                onConfirm={confirmarPagamento}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600 dark:text-gray-400">
          {usarAsaas ? (
            <>
              <p>✅ Usando Asaas Sandbox (pagamentos reais de teste)</p>
              <p className="mt-1">
                Após a confirmação, o laudo será emitido automaticamente via
                webhook.
              </p>
            </>
          ) : (
            <>
              <p>
                ⚠️ Este é um simulador de pagamento para fins de demonstração.
              </p>
              <p className="mt-1">
                Após a confirmação, o laudo será emitido pelo sistema.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
