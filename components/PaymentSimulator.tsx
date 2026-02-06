/**
 * PaymentSimulator - Simulador de Pagamento
 *
 * Componente para simular opções de pagamento com cálculo detalhado de parcelas.
 *
 * Fluxo de Pagamento:
 * 1. Usuário seleciona método de pagamento (PIX, Cartão, Boleto, Transferência)
 * 2. Para Cartão/Boleto: Seleciona número de parcelas (1-12x)
 * 3. Exibe valor total e valor por parcela
 * 4. Mostra breakdown completo com datas de vencimento
 * 5. Confirma e prossegue para pagamento
 */

'use client';

import React, { useState, useEffect } from 'react';

// ============================================================================
// INTERFACES
// ============================================================================

interface ParcelaDetalhada {
  numero: number;
  valor: number;
  vencimento: string;
}

interface OpcaoParcela {
  numero_parcelas: number;
  valor_por_parcela: number;
  valor_total: number;
  descricao: string;
  detalhes_parcelas?: ParcelaDetalhada[];
}

interface MetodoSimulacao {
  metodo: string;
  nome: string;
  parcelas_opcoes: OpcaoParcela[];
}

interface Simulacao {
  pix: MetodoSimulacao;
  cartao: MetodoSimulacao;
  boleto: MetodoSimulacao;
  transferencia: MetodoSimulacao;
}

interface PaymentSimulatorProps {
  contratanteId?: number;
  planoId?: number;
  token?: string;
  valorTotal?: number;
  numeroFuncionarios?: number;
  onConfirm?: (metodo: string, parcelas: number, valor: number) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function PaymentSimulator({
  contratanteId,
  planoId,
  token,
  valorTotal,
  numeroFuncionarios,
  onConfirm,
}: PaymentSimulatorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulacao, setSimulacao] = useState<Simulacao | null>(null);
  const [valorCalculado, setValorCalculado] = useState(0);
  const [contratanteInfo, setContratanteInfo] = useState<any>(null);
  const [planoInfo, setPlanoInfo] = useState<any>(null);

  // Estados de seleção
  const [metodoSelecionado, setMetodoSelecionado] = useState<string>('');
  const [parcelasSelecionadas, setParcelasSelecionadas] = useState(1);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<OpcaoParcela | null>(
    null
  );

  // Carregar simulação ao montar o componente
  useEffect(() => {
    const carregarSimulacao = async () => {
      try {
        setLoading(true);
        setError(null);

        const body: any = {};

        if (token) {
          body.token = token;
        } else if (contratanteId && planoId) {
          body.entidade_id = contratanteId;
          body.plano_id = planoId;
          if (numeroFuncionarios) body.numero_funcionarios = numeroFuncionarios;
        } else if (valorTotal) {
          body.valor_total = valorTotal;
        } else {
          throw new Error('Parâmetros insuficientes para simulação');
        }

        const response = await fetch('/api/pagamento/simular', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao carregar simulação');
        }

        const data = await response.json();

        setSimulacao(data.simulacoes);
        setValorCalculado(data.valor_total);
        setContratanteInfo(data.contratante);
        setPlanoInfo(data.plano);

        // Selecionar PIX por padrão
        setMetodoSelecionado('pix');
        setOpcaoSelecionada(data.simulacoes.pix.parcelas_opcoes[0]);
      } catch (err) {
        console.error('Erro ao carregar simulação:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    carregarSimulacao();
  }, [token, contratanteId, planoId, numeroFuncionarios, valorTotal]);

  // ============================================================================
  // FUNÇÕES

  function handleMetodoChange(metodo: string) {
    setMetodoSelecionado(metodo);
    setParcelasSelecionadas(1);

    if (simulacao) {
      const opcoes = simulacao[metodo as keyof Simulacao].parcelas_opcoes;
      setOpcaoSelecionada(opcoes[0]);
    }
  }

  function handleParcelasChange(numParcelas: number) {
    setParcelasSelecionadas(numParcelas);

    if (simulacao) {
      const opcoes =
        simulacao[metodoSelecionado as keyof Simulacao].parcelas_opcoes;
      const opcao = opcoes.find((o) => o.numero_parcelas === numParcelas);
      setOpcaoSelecionada(opcao || null);
    }
  }

  function handleConfirmar() {
    if (opcaoSelecionada && onConfirm) {
      onConfirm(
        metodoSelecionado,
        opcaoSelecionada.numero_parcelas,
        opcaoSelecionada.valor_total
      );
    }
  }

  function formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  function formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-BR');
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FF6B00] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando simulação...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h3 className="text-red-800 font-semibold mb-2">Erro</h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => {
              const carregarSimulacao = async () => {
                try {
                  setLoading(true);
                  setError(null);

                  const body: any = {};

                  if (token) {
                    body.token = token;
                  } else if (contratanteId && planoId) {
                    body.entidade_id = contratanteId;
                    body.plano_id = planoId;
                    if (numeroFuncionarios)
                      body.numero_funcionarios = numeroFuncionarios;
                  } else if (valorTotal) {
                    body.valor_total = valorTotal;
                  } else {
                    throw new Error('Parâmetros insuficientes para simulação');
                  }

                  const response = await fetch('/api/pagamento/simular', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                  });

                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                      errorData.error || 'Erro ao carregar simulação'
                    );
                  }

                  const data = await response.json();

                  setSimulacao(data.simulacoes);
                  setValorCalculado(data.valor_total);
                  setContratanteInfo(data.contratante);
                  setPlanoInfo(data.plano);

                  // Selecionar PIX por padrão
                  setMetodoSelecionado('pix');
                  setOpcaoSelecionada(data.simulacoes.pix.parcelas_opcoes[0]);
                } catch (err) {
                  console.error('Erro ao carregar simulação:', err);
                  setError(
                    err instanceof Error ? err.message : 'Erro desconhecido'
                  );
                } finally {
                  setLoading(false);
                }
              };
              carregarSimulacao();
            }}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!simulacao) {
    return null;
  }

  const metodoAtual = simulacao[metodoSelecionado as keyof Simulacao];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Simulador de Pagamento
        </h1>
        {contratanteInfo && (
          <p className="text-gray-600">
            <strong>Contratante:</strong> {contratanteInfo.nome}
          </p>
        )}
        {planoInfo && (
          <p className="text-gray-600">
            <strong>Plano:</strong> {planoInfo.nome}
          </p>
        )}
      </div>

      {/* Valor Total */}
      <div className="bg-[#FF6B00] text-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-2">Valor Total</h2>
        <p className="text-4xl font-bold">{formatarMoeda(valorCalculado)}</p>
        {planoInfo?.qtd_funcionarios && (
          <p className="text-sm mt-2 opacity-90">
            {planoInfo.qtd_funcionarios} funcionários × R${' '}
            {planoInfo.valor_por_funcionario?.toFixed(2)}
          </p>
        )}
      </div>

      {/* Seleção de Método de Pagamento */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Escolha o Método de Pagamento
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(simulacao).map(([key, metodo]) => (
            <button
              key={key}
              onClick={() => handleMetodoChange(key)}
              className={`p-4 border-2 rounded-lg transition ${
                metodoSelecionado === key
                  ? 'border-[#FF6B00] bg-orange-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-center">
                <p className="font-semibold text-gray-800">{metodo.nome}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Seleção de Parcelas (se aplicável) */}
      {metodoAtual.parcelas_opcoes.length > 1 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Escolha o Número de Parcelas
          </h2>
          <select
            value={parcelasSelecionadas}
            onChange={(e) => handleParcelasChange(Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B00]"
          >
            {metodoAtual.parcelas_opcoes.map((opcao) => (
              <option key={opcao.numero_parcelas} value={opcao.numero_parcelas}>
                {opcao.descricao}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Resumo da Opção Selecionada */}
      {opcaoSelecionada && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Resumo do Pagamento
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Método</p>
              <p className="text-lg font-semibold text-gray-800">
                {metodoAtual.nome}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Parcelas</p>
              <p className="text-lg font-semibold text-gray-800">
                {opcaoSelecionada.numero_parcelas}x
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Valor por Parcela</p>
              <p className="text-lg font-semibold text-[#FF6B00]">
                {formatarMoeda(opcaoSelecionada.valor_por_parcela)}
              </p>
            </div>
          </div>

          {/* Detalhamento de Parcelas */}
          {opcaoSelecionada.detalhes_parcelas &&
            opcaoSelecionada.numero_parcelas > 1 && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">
                  Detalhamento das Parcelas
                </h3>
                <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                          Parcela
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                          Valor
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">
                          Vencimento
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {opcaoSelecionada.detalhes_parcelas.map((parcela) => (
                        <tr
                          key={parcela.numero}
                          className="border-t border-gray-200 hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {parcela.numero}/{opcaoSelecionada.numero_parcelas}
                          </td>
                          <td className="px-4 py-2 text-sm text-right text-gray-700">
                            {formatarMoeda(parcela.valor)}
                          </td>
                          <td className="px-4 py-2 text-sm text-center text-gray-700">
                            {formatarData(parcela.vencimento)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </div>
      )}

      {/* Botão de Confirmação */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <button
          onClick={handleConfirmar}
          disabled={!opcaoSelecionada}
          className="w-full bg-[#FF6B00] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#E55A00] transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirmar e Prosseguir para Pagamento
        </button>
        <p className="text-sm text-gray-600 text-center mt-3">
          Ao confirmar, você será direcionado para a plataforma de pagamento
        </p>
      </div>
    </div>
  );
}
