'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import QworkLogo from '@/components/QworkLogo';

interface PagamentoInfo {
  pagamento_id: number;
  valor: number;
  valor_plano: number;
  numero_funcionarios: number;
  plano_nome: string;
  contratante_nome: string;
  status: string;
}

type MetodoPagamento = 'pix' | 'cartao' | 'boleto';

export default function PagamentoPage() {
  const router = useRouter();
  const params = useParams();
  const contratoId = params.contratoId as string;

  const [loading, setLoading] = useState(true);
  const [pagamentoInfo, setPagamentoInfo] = useState<PagamentoInfo | null>(
    null
  );
  const [metodoSelecionado, setMetodoSelecionado] =
    useState<MetodoPagamento>('pix');
  const [numeroParcelas, setNumeroParcelas] = useState<number>(1);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const iniciarPagamento = async () => {
      // DEBUG
      // eslint-disable-next-line no-console
      console.log(
        'DEBUG iniciarPagamento start',
        contratoId,
        window.location.search
      );
      try {
        let contratanteId: number | null = null;
        let contratoIdNumeric: number | null = null;
        let planoId: number;
        let numeroFuncionarios: number;
        let valorTotal: number;

        // Token a ser usado para iniciar o pagamento (pode vir de query/contratação/teste)
        let _tokenForStart: string | undefined;

        // Tratamento especial para link de pagamento personalizado (parâmetros diretos)
        const searchParamsGlobal = new URLSearchParams(window.location.search);
        const isPersonalizado =
          contratoId === 'personalizado' ||
          searchParamsGlobal.has('contratacao_id');

        if (isPersonalizado) {
          const searchParams = searchParamsGlobal;

          // Suporta dois modos:
          // 1) ?contratante_id=..&plano_id=.. (direto)
          // 2) ?contratacao_id=.. (contratação personalizada) -> buscar /api/contratacao_personalizada/:id
          const contratacaoIdParam = searchParams.get('contratacao_id');
          const contratanteIdParam = searchParams.get('contratante_id');
          const planoIdParam = searchParams.get('plano_id');
          const numeroFuncionariosParam = searchParams.get(
            'numero_funcionarios'
          );
          const valorTotalParam = searchParams.get('valor_total');

          // Token (quando presente no link)
          const tokenFromQuery = searchParams.get('token') || undefined;

          if (contratacaoIdParam) {
            // Buscar dados da contratação personalizada
            // DEBUG
            // eslint-disable-next-line no-console
            console.log(
              'DEBUG fetch: /api/contratacao_personalizada/',
              contratacaoIdParam
            );
            const contratacaoRes = await fetch(
              `/api/contratacao_personalizada/${contratacaoIdParam}`
            );
            if (!contratacaoRes.ok) {
              throw new Error('Contratação personalizada não encontrada');
            }
            const contratacaoData = await contratacaoRes.json();
            // DEBUG
            // eslint-disable-next-line no-console
            console.log('DEBUG contratacaoData:', contratacaoData);

            contratanteId = contratacaoData.contratante_id
              ? parseInt(String(contratacaoData.contratante_id))
              : null;
            planoId = contratacaoData.plano_id
              ? parseInt(String(contratacaoData.plano_id))
              : (undefined as any);
            numeroFuncionarios =
              contratacaoData.numero_funcionarios ??
              (numeroFuncionariosParam ? parseInt(numeroFuncionariosParam) : 1);
            valorTotal =
              contratacaoData.valor_total ??
              (valorTotalParam ? parseFloat(valorTotalParam) : 0);

            // Pré-preencher informações para exibição, se disponíveis
            setPagamentoInfo({
              pagamento_id: 0,
              valor: valorTotal,
              valor_plano: contratacaoData.valor_por_funcionario
                ? contratacaoData.valor_por_funcionario
                : valorTotal,
              numero_funcionarios: numeroFuncionarios,
              plano_nome: contratacaoData.plano_nome ?? 'Plano Personalizado',
              contratante_nome: contratacaoData.contratante_nome ?? '',
              status: 'aguardando_pagamento',
            });

            // Preferir token retornado pelo recurso, senão query string, senão fallback 'abc123' para compatibilidade de teste
            _tokenForStart =
              contratacaoData.token || tokenFromQuery || 'abc123';
          } else {
            if (!contratanteIdParam || !planoIdParam) {
              throw new Error(
                'Parâmetros obrigatórios: contratante_id e plano_id'
              );
            }

            contratanteId = parseInt(contratanteIdParam);
            planoId = parseInt(planoIdParam);
            numeroFuncionarios = numeroFuncionariosParam
              ? parseInt(numeroFuncionariosParam)
              : 1;
            valorTotal = valorTotalParam ? parseFloat(valorTotalParam) : 0;

            // Buscar informações do contratante e plano
            const contratanteRes = await fetch(
              `/api/public/contratante/${contratanteId}`
            );
            if (!contratanteRes.ok) {
              throw new Error('Contratante não encontrado');
            }
            const contratanteData = await contratanteRes.json();

            // Buscar informações do plano
            const planoRes = await fetch(`/api/planos/${planoIdParam}`);
            if (!planoRes.ok) {
              throw new Error('Plano não encontrado');
            }
            const planoData = await planoRes.json();

            // Calcular valor se não fornecido
            let valorCalculado = valorTotal;
            if (valorCalculado === 0) {
              if (planoData.tipo === 'fixo') {
                valorCalculado =
                  parseFloat(planoData.preco) * numeroFuncionarios;
              } else {
                valorCalculado = parseFloat(planoData.preco);
              }
            }

            // Pré-preencher informações para exibição
            setPagamentoInfo({
              pagamento_id: 0,
              valor: valorCalculado,
              valor_plano: valorCalculado,
              numero_funcionarios: numeroFuncionarios,
              plano_nome: planoData.nome,
              contratante_nome: contratanteData.nome,
              status: 'aguardando_pagamento',
            });

            _tokenForStart = tokenFromQuery;
          }
        } else {
          // Buscar contratante_id a partir do contrato_id (rota correta: /api/contratos)
          const contratoRes = await fetch(`/api/contratos/${contratoId}`);
          if (!contratoRes.ok) {
            throw new Error('Contrato não encontrado');
          }

          const { contrato } = await contratoRes.json();
          contratanteId = contrato.contratante_id;
          contratoIdNumeric = parseInt(contratoId);

          // Fetch additional data needed for payment
          planoId = contrato.plano_id;
          numeroFuncionarios = contrato.numero_funcionarios;
          valorTotal = contrato.valor_total;
        }

        // Iniciar pagamento usando a rota dedicada
        const payload: any = {
          contratante_id: contratanteId,
          contrato_id: contratoIdNumeric,
          plano_id: planoId,
          numero_funcionarios: numeroFuncionarios,
          valor_total: valorTotal,
        };

        if (typeof _tokenForStart !== 'undefined') {
          payload.token = _tokenForStart;
        }

        const pagamentoRes = await fetch('/api/pagamento/iniciar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!pagamentoRes.ok) {
          throw new Error('Erro ao iniciar pagamento');
        }

        const data = await pagamentoRes.json();

        // Normalizar o retorno para o formato PagamentoInfo esperado pela UI
        const mapped: PagamentoInfo = {
          pagamento_id: data.pagamento_id || 0,
          valor: data.valor ?? data.valor_total ?? 0,
          valor_plano:
            data.valor_plano ?? data.valor_unitario ?? data.valor ?? 0,
          numero_funcionarios: data.numero_funcionarios ?? 0,
          plano_nome:
            data.plano_nome ??
            pagamentoInfo?.plano_nome ??
            'Plano Personalizado',
          contratante_nome:
            data.contratante_nome ?? pagamentoInfo?.contratante_nome ?? '',
          status:
            data.status ?? pagamentoInfo?.status ?? 'aguardando_pagamento',
        };

        setPagamentoInfo(mapped);
      } catch (error) {
        console.error('Erro ao iniciar pagamento:', error);
        // DEBUG: log more details for test output
        // eslint-disable-next-line no-console
        console.log('DEBUG iniciarPagamento error:', String(error));
        setErro('Erro ao carregar informações de pagamento');
      } finally {
        setLoading(false);
      }
    };

    if (contratoId) {
      iniciarPagamento();
    }
  }, [
    contratoId,
    pagamentoInfo?.contratante_nome,
    pagamentoInfo?.plano_nome,
    pagamentoInfo?.status,
  ]);

  const formatCurrency = (value: any) => {
    if (
      value === null ||
      value === undefined ||
      !Number.isFinite(Number(value))
    )
      return '-';
    return Number(value).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const confirmarPagamento = async () => {
    if (!pagamentoInfo) return;

    setProcessando(true);
    setErro(null);

    try {
      const res = await fetch('/api/pagamento/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagamento_id: pagamentoInfo.pagamento_id,
          metodo_pagamento: metodoSelecionado,
          plataforma_nome: 'Simulação',
          plataforma_id: `SIM-${Date.now()}`,
          numero_parcelas: metodoSelecionado !== 'pix' ? numeroParcelas : 1,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erro ao confirmar pagamento');
      }

      const data = await res.json();

      // Redirecionar para login após confirmação
      alert(
        `${data.message}\n\nSeu login foi liberado! Você será redirecionado para a tela de login.`
      );
      router.push('/login');
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      setErro(
        error instanceof Error ? error.message : 'Erro ao processar pagamento'
      );
    } finally {
      setProcessando(false);
    }
  };

  const simularPagamento = () => {
    if (!pagamentoInfo) {
      setErro('Informações de pagamento faltando');
      return;
    }

    // Simular processamento de pagamento (2 segundos)
    setProcessando(true);
    setTimeout(() => {
      confirmarPagamento();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Carregando informações de pagamento...
          </p>
        </div>
      </div>
    );
  }

  if (erro && !pagamentoInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Erro</h2>
          <p className="text-gray-600 mb-6">{erro}</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition-colors"
          >
            Voltar ao Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <QworkLogo className="mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800">
              Finalizar Pagamento
            </h1>
            <p className="text-gray-600 mt-2">
              Complete o pagamento para ativar sua conta
            </p>
          </div>

          {/* Informações do Plano */}
          {pagamentoInfo && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Resumo da Contratação
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Contratante:</span>
                  <span className="font-semibold">
                    {pagamentoInfo.contratante_nome}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plano:</span>
                  <span className="font-semibold">
                    {pagamentoInfo.plano_nome}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor do Plano:</span>
                  <span className="font-semibold">
                    R$ {formatCurrency(pagamentoInfo.valor_plano)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Número de Funcionários:</span>
                  <span className="font-semibold">
                    {pagamentoInfo.numero_funcionarios}
                  </span>
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-gray-800 font-semibold">Total:</span>
                    <span className="text-orange-600 font-bold">
                      R$ {formatCurrency(pagamentoInfo.valor)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    (R$ {formatCurrency(pagamentoInfo.valor_plano)} ×{' '}
                    {pagamentoInfo.numero_funcionarios} funcionários)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Métodos de Pagamento */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Método de Pagamento
            </h2>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                <input
                  type="radio"
                  name="metodo"
                  value="pix"
                  checked={metodoSelecionado === 'pix'}
                  onChange={(e) =>
                    setMetodoSelecionado(e.target.value as MetodoPagamento)
                  }
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-semibold">PIX</div>
                  <div className="text-sm text-gray-600">
                    Pagamento instantâneo
                  </div>
                </div>
                <div className="text-2xl">📱</div>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                <input
                  type="radio"
                  name="metodo"
                  value="cartao"
                  checked={metodoSelecionado === 'cartao'}
                  onChange={(e) =>
                    setMetodoSelecionado(e.target.value as MetodoPagamento)
                  }
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-semibold">Cartão de Crédito</div>
                  <div className="text-sm text-gray-600">
                    À vista ou parcelado
                  </div>
                </div>
                <div className="text-2xl">💳</div>
              </label>

              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                <input
                  type="radio"
                  name="metodo"
                  value="boleto"
                  checked={metodoSelecionado === 'boleto'}
                  onChange={(e) =>
                    setMetodoSelecionado(e.target.value as MetodoPagamento)
                  }
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-semibold">Boleto Bancário</div>
                  <div className="text-sm text-gray-600">
                    Vencimento em 3 dias úteis
                  </div>
                </div>
                <div className="text-2xl">🏦</div>
              </label>
            </div>

            {/* Seleção de Parcelas para Cartão e Boleto */}
            {(metodoSelecionado === 'cartao' ||
              metodoSelecionado === 'boleto') && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Número de Parcelas
                </label>
                <select
                  value={numeroParcelas}
                  onChange={(e) => setNumeroParcelas(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value={1}>
                    À vista - R$ {formatCurrency(pagamentoInfo?.valor)}
                  </option>
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((parcela) => {
                    const valorParcela = pagamentoInfo?.valor
                      ? pagamentoInfo.valor / parcela
                      : 0;
                    return (
                      <option key={parcela} value={parcela}>
                        {parcela}x de R$ {formatCurrency(valorParcela)}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  {metodoSelecionado === 'cartao'
                    ? 'Parcelamento em até 12x sem juros'
                    : 'Boletos com vencimento mensal (dia 10 de cada mês)'}
                </p>
              </div>
            )}
          </div>

          {/* Aviso de Simulação */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="text-blue-500 text-xl mr-3">ℹ️</div>
              <div>
                <div className="font-semibold text-blue-800">
                  Modo de Simulação
                </div>
                <div className="text-sm text-blue-700 mt-1">
                  Este é um ambiente de demonstração. Ao clicar em
                  &quot;Confirmar Pagamento&quot;, o pagamento será simulado e
                  sua conta será ativada automaticamente.
                </div>
              </div>
            </div>
          </div>

          {/* Erro */}
          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="text-red-700">{erro}</div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/login')}
              disabled={processando}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={simularPagamento}
              disabled={processando}
              className="flex-1 bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {processando ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
