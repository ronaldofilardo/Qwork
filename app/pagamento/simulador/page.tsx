'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QworkLogo from '@/components/QworkLogo';

interface SimuladorInfo {
  tomador_id: number;
  tomador_nome: string;
  plano_id: number;
  plano_nome: string;
  plano_tipo: string;
  numero_funcionarios: number;
  valor_por_funcionario: number;
  valor_total: number;
}

type MetodoPagamento = 'pix' | 'cartao' | 'boleto';

export default function SimuladorPagamentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [simuladorInfo, setSimuladorInfo] = useState<SimuladorInfo | null>(
    null
  );
  const [metodoSelecionado, setMetodoSelecionado] =
    useState<MetodoPagamento>('pix');
  const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [contratoExistente, setContratoExistente] = useState<number | null>(
    null
  );
  const [isRetry, setIsRetry] = useState(false);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Modo simplificado - parâmetros na URL
        // Parâmetro tomador_id (compatível com entidade_id e clinica_id)
        const tomadorId =
          searchParams.get('tomador_id') || searchParams.get('entidade_id') || searchParams.get('clinica_id');
        const planoId = searchParams.get('plano_id');
        const numeroFuncionarios = searchParams.get('numero_funcionarios');
        const contratoId = searchParams.get('contrato_id');
        const retry = searchParams.get('retry') === 'true';

        if (!tomadorId || !planoId) {
          throw new Error(
            'Parâmetros obrigatórios: tomador_id (ou entidade_id/clinica_id) e plano_id'
          );
        }

        setIsRetry(retry);

        // Se já existe contrato_id, usar ele
        if (contratoId) {
          setContratoExistente(Number(contratoId));
        }

        // Buscar informações do tomador e plano
        const res = await fetch(
          `/api/pagamento/simulador?tomador_id=${tomadorId}&plano_id=${planoId}&numero_funcionarios=${numeroFuncionarios || 0}`
        );

        if (!res.ok) {
          throw new Error('Erro ao carregar dados');
        }

        const data = await res.json();
        setSimuladorInfo(data);
      } catch (error) {
        console.error('Erro ao carregar simulador:', error);
        setErro(
          error instanceof Error
            ? error.message
            : 'Erro ao carregar informações de pagamento'
        );
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [searchParams]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const calcularValorParcela = (parcelas?: number) => {
    if (!simuladorInfo) return 0;
    const numParcelas = parcelas || numeroParcelas;
    return simuladorInfo.valor_total / numParcelas;
  };

  const confirmarPagamento = async () => {
    if (!simuladorInfo) return;

    setProcessando(true);
    setErro(null);

    try {
      const contrato_id = contratoExistente ?? null;

      // Observação: a funcionalidade de gerar contrato pré-pagamento foi
      // permanentemente removida. Não tentamos criar contrato aqui.
      // Vamos iniciar o pagamento diretamente, fornecendo os dados do
      // plano para que o servidor calcule o valor corretamente.

      // Iniciar pagamento (fluxo correto: iniciar → confirmar)
      const iniciarPayload: any = {
        tomador_id: simuladorInfo.tomador_id,
        contrato_id: contrato_id, // pode ser null
        plano_id: simuladorInfo.plano_id,
        numero_funcionarios: simuladorInfo.numero_funcionarios,
        valor_total: simuladorInfo.valor_total,
      };

      const iniciarRes = await fetch('/api/pagamento/iniciar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(iniciarPayload),
      });

      const iniciarData = await iniciarRes.json();

      if (!iniciarRes.ok) {
        throw new Error(iniciarData.error || 'Erro ao iniciar pagamento');
      }

      // Se já existe pagamento em andamento, usar o pagamento existente
      const pagamentoId = iniciarData.pagamento_id || iniciarData.pagamento_id;

      // Confirmar pagamento imediatamente (simulador)
      const confirmarRes = await fetch('/api/pagamento/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagamento_id: pagamentoId,
          metodo_pagamento: metodoSelecionado,
          plataforma_nome: 'simulador',
          numero_parcelas: numeroParcelas,
        }),
      });

      const confirmarData = await confirmarRes.json();

      if (!confirmarRes.ok) {
        // Se a confirmação falhar, permitir retry se backend indicar
        if (confirmarData.can_retry) {
          throw new Error(
            confirmarData.message ||
              'Falha ao confirmar pagamento. Tente novamente.'
          );
        }
        throw new Error(confirmarData.error || 'Erro ao confirmar pagamento');
      }

      // Redirecionar para a tela de login após confirmação
      if (confirmarData.show_receipt_info) {
        // Mostrar popup informativo sobre comprovante
        alert(
          'Pagamento confirmado!\n\n' +
            'Seu acesso foi liberado.\n' +
            'O comprovante de pagamento está disponível em:\n' +
            'Informações da Conta > Plano > Baixar Comprovante'
        );
      }
      router.push(confirmarData.redirect_to || '/');
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      setErro(
        error instanceof Error ? error.message : 'Erro ao processar pagamento'
      );
    } finally {
      setProcessando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <QworkLogo size="lg" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (erro || !simuladorInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Erro ao carregar
            </h2>
            <p className="mt-2 text-gray-600">{erro}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 bg-[#FF6B00] text-white px-6 py-2 rounded hover:bg-[#E55A00] transition"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <QworkLogo size="lg" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {isRetry ? 'Retry de Pagamento' : 'Simulador de Pagamento'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isRetry
              ? 'Complete o pagamento para ativar seu contrato'
              : 'Confira os detalhes e escolha a forma de pagamento'}
          </p>
          {isRetry && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg inline-block">
              <p className="text-sm text-yellow-800">
                ⚠️ Pagamento anterior não foi concluído. Por favor, tente
                novamente.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {/* Informações do tomador e Plano */}
          <div className="bg-[#FF6B00] text-white px-6 py-4">
            <h2 className="text-xl font-bold">Resumo da Contratação</h2>
          </div>

          <div className="p-6 space-y-4">
            {/* Dados do tomador */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">tomador</h3>
              <p className="text-gray-700">{simuladorInfo.tomador_nome}</p>
            </div>

            {/* Plano selecionado */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Plano Selecionado
              </h3>
              <p className="text-gray-700">
                {simuladorInfo.plano_nome}
                {simuladorInfo.plano_tipo === 'fixo' && ' (Plano Fixo)'}
              </p>
            </div>

            {/* Detalhes de valores */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Número de funcionários:</span>
                <span className="font-semibold text-gray-900">
                  {simuladorInfo.numero_funcionarios}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Valor por funcionário:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(simuladorInfo.valor_por_funcionario)}
                </span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-lg font-bold text-gray-900">
                  Valor Total:
                </span>
                <span className="text-lg font-bold text-[#FF6B00]">
                  {formatCurrency(simuladorInfo.valor_total)}
                </span>
              </div>
            </div>

            {/* Seleção de método de pagamento */}
            <div className="pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">
                Método de Pagamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setMetodoSelecionado('pix')}
                  className={`p-4 border-2 rounded-lg transition ${
                    metodoSelecionado === 'pix'
                      ? 'border-[#FF6B00] bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">PIX</div>
                    <div className="text-sm text-gray-600 mt-1">
                      À vista com desconto
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMetodoSelecionado('cartao')}
                  className={`p-4 border-2 rounded-lg transition ${
                    metodoSelecionado === 'cartao'
                      ? 'border-[#FF6B00] bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">
                      Cartão de Crédito
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Parcelado em até 12x
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setMetodoSelecionado('boleto')}
                  className={`p-4 border-2 rounded-lg transition ${
                    metodoSelecionado === 'boleto'
                      ? 'border-[#FF6B00] bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold text-gray-900">Boleto</div>
                    <div className="text-sm text-gray-600 mt-1">
                      À vista ou parcelado
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Parcelamento (apenas para cartão e boleto) */}
            {(metodoSelecionado === 'cartao' ||
              metodoSelecionado === 'boleto') && (
              <div className="pt-4">
                <label className="block font-semibold text-gray-900 mb-2">
                  Número de Parcelas
                </label>
                <select
                  value={numeroParcelas}
                  onChange={(e) => setNumeroParcelas(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B00] focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                    <option key={n} value={n}>
                      {n}x de {formatCurrency(calcularValorParcela(n))}
                      {n === 1 ? ' (à vista)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Resumo final */}
            {numeroParcelas > 1 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Valor da parcela:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {numeroParcelas}x de{' '}
                    {formatCurrency(calcularValorParcela())}
                  </span>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="pt-6 flex gap-4">
              <button
                onClick={() => router.back()}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-semibold"
                disabled={processando}
              >
                Voltar
              </button>
              <button
                onClick={confirmarPagamento}
                disabled={processando}
                className="flex-1 bg-[#FF6B00] text-white px-6 py-3 rounded-lg hover:bg-[#E55A00] transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {processando ? 'Processando...' : 'Confirmar Pagamento'}
              </button>
            </div>

            {erro && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{erro}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
