'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building2 } from 'lucide-react';

interface AccountInfo {
  // Informações cadastradas
  nome: string;
  cnpj?: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  criado_em: string;

  // Plano contratado
  contrato?: {
    id?: number | string;
    numero_contrato: string;
    plano_nome: string;
    plano_tipo?: string;
    plano_type?: string;
    plano_preco_unitario?: number;
    valor_total: number;
    qtd_funcionarios_contratada?: number;
    numero_funcionarios?: number;
    vigencia_inicio?: string;
    vigencia_fim?: string;
    status: string;
    criado_em?: string;
  };

  // Pagamentos
  pagamentos?: Array<{
    id: number;
    valor: number;
    status: string;
    data_solicitacao?: string;
    data_pagamento?: string;
    criado_em?: string;
    metodo?: string;
    plataforma?: string;
    numero_parcelas?: number;
    parcelas_json?: Array<{
      numero: number;
      valor: number;
      data_vencimento: string;
      pago?: boolean;
      data_pagamento?: string;
    }>;
    detalhes_parcelas?: Array<{
      numero: number;
      valor: number;
      data_vencimento: string;
      pago: boolean;
      data_pagamento?: string;
    }>;
    recibo?: { id: number; numero_recibo: string };
    resumo?: {
      totalParcelas: number;
      parcelasPagas: number;
      parcelasPendentes?: number;
      valorPendente: number;
      statusGeral: 'quitado' | 'em_aberto';
    };
  }>;
}

type TabType = 'info';

interface Parcela {
  numero: number;
  total_parcelas: number;
  valor: number;
  status: 'pago' | 'a_vencer';
  data_vencimento: string;
  data_pagamento?: string;
  recibo?: {
    id: number;
    numero_recibo: string;
    hash: string;
    arquivo_path: string;
    criado_em: string;
  } | null;
}

interface ParcelasData {
  contrato_id: number;
  contratacao_at: string;
  valor_total: number;
  numero_funcionarios: number;
  pagamento_id: number;
  metodo: string;
  parcelas: Parcela[];
}

export default function EntidadeContaSection() {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [parcelasData, setParcelasData] = useState<ParcelasData | null>(null);
  const [_loadingParcelas, setLoadingParcelas] = useState(false);

  const loadAccountInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/entidade/account-info?_=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();

        // Se não houver contrato, não acionar fallback — o contrato padrão
        // será acessível via a página única `/termos/contrato`.
        // Mantemos `data.contrato` como está (pode ser undefined) e exibimos
        // o link para o contrato padrão no UI.
        setAccountInfo(data);
        setErrorMessage(null);
      } else {
        try {
          const err = await res.json();
          setErrorMessage(
            err?.error || 'Erro ao carregar informações da conta'
          );
        } catch {
          setErrorMessage('Erro ao carregar informações da conta');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar informações da conta:', error);
      setErrorMessage('Erro ao carregar informações da conta');
    } finally {
      setLoading(false);
    }
  }, []);

  const buildParcelasFromPagamento = (
    pag: any,
    contratacao_at: string
  ): ParcelasData | null => {
    try {
      let detalhes = [];
      if (pag.detalhes_parcelas) {
        detalhes =
          typeof pag.detalhes_parcelas === 'string'
            ? JSON.parse(pag.detalhes_parcelas)
            : pag.detalhes_parcelas;
      } else if (pag.numero_parcelas && parseInt(pag.numero_parcelas) > 0) {
        const num = parseInt(pag.numero_parcelas);
        const valorParcela = parseFloat(pag.valor) / num;
        const isPago = pag.status === 'pago';
        for (let i = 1; i <= num; i++) {
          const d = new Date(pag.criado_em || contratacao_at);
          d.setMonth(d.getMonth() + (i - 1));
          detalhes.push({
            numero: i,
            valor: valorParcela,
            data_vencimento: d.toISOString(),
            pago: i === 1 && isPago,
            data_pagamento:
              i === 1 && isPago ? pag.criado_em || contratacao_at : null,
          });
        }
      } else {
        detalhes.push({
          numero: 1,
          valor: parseFloat(pag.valor || 0),
          data_vencimento: pag.criado_em || contratacao_at,
          pago: pag.status === 'pago',
          data_pagamento:
            pag.status === 'pago' ? pag.criado_em || contratacao_at : null,
        });
      }
      return {
        contrato_id: 0,
        contratacao_at,
        valor_total: 0,
        numero_funcionarios: 0,
        pagamento_id: pag.id,
        metodo: pag.metodo,
        parcelas: detalhes.map((par: any) => ({
          numero: par.numero,
          total_parcelas: detalhes.length,
          valor: par.valor,
          status: (par.pago ? 'pago' : 'a_vencer') as 'pago' | 'a_vencer',
          data_vencimento: par.data_vencimento,
          data_pagamento: par.data_pagamento || null,
          recibo: null,
        })),
      };
    } catch (err) {
      console.error('Erro ao construir parcelas localmente:', err);
      return null;
    }
  };

  const loadParcelas = useCallback(
    async (acct?: AccountInfo | null) => {
      // Evitar piscar o spinner em chamadas rápidas: só mostrar após 200ms
      let showTimer: NodeJS.Timeout | null = setTimeout(
        () => setLoadingParcelas(true),
        200
      );
      const ai = acct ?? accountInfo;
      try {
        const res = await fetch(`/api/entidade/parcelas?_=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          // Se API retornar vazio, tentar reconstruir a partir de accountInfo.pagamentos
          if (
            data &&
            Array.isArray(data.parcelas) &&
            data.parcelas.length === 0 &&
            ai?.pagamentos &&
            ai.pagamentos.length > 0
          ) {
            const fallback = buildParcelasFromPagamento(
              ai.pagamentos[0],
              data.contratacao_at || ai.contrato?.criado_em || ai.criado_em
            );
            if (fallback) setParcelasData(fallback);
            else setParcelasData(data);
          } else {
            setParcelasData(data);
          }
        } else {
          console.error('Erro ao carregar parcelas');
          // fallback se a API falhar
          if (ai?.pagamentos && ai.pagamentos.length > 0) {
            const fallback = buildParcelasFromPagamento(
              ai.pagamentos[0],
              ai.contrato?.criado_em || ai.criado_em
            );
            if (fallback) setParcelasData(fallback);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar parcelas:', error);
        // fallback local
        if (ai?.pagamentos && ai.pagamentos.length > 0) {
          const fallback = buildParcelasFromPagamento(
            ai.pagamentos[0],
            ai.contrato?.criado_em || ai.criado_em
          );
          if (fallback) setParcelasData(fallback);
        }
      } finally {
        if (showTimer) {
          clearTimeout(showTimer);
          showTimer = null;
        }
        // garantir que o estado é atualizado apenas se tinha sido mostrado
        setLoadingParcelas(false);
      }
    },
    [accountInfo]
  );

  // Função auxiliar para gerar recibo (não usada atualmente)
  const _handleGerarRecibo = async (parcelaNumero: number) => {
    if (!parcelasData) return;

    try {
      const res = await fetch('/api/entidade/parcelas/gerar-recibo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parcela_numero: parcelaNumero,
          pagamento_id: parcelasData.pagamento_id,
        }),
      });

      if (res.ok) {
        // Recarregar parcelas para atualizar status
        await loadParcelas();
        alert('Recibo gerado com sucesso!');
      } else {
        const err = await res.json();
        alert(err?.error || 'Erro ao gerar recibo');
      }
    } catch (error) {
      console.error('Erro ao gerar recibo:', error);
      alert('Erro ao gerar recibo');
    }
  };

  useEffect(() => {
    loadAccountInfo();
  }, [loadAccountInfo]);

  // Quando `accountInfo` for carregado, buscar parcelas uma vez
  useEffect(() => {
    if (accountInfo) {
      loadParcelas(accountInfo);
    }
  }, [accountInfo, loadParcelas]);

  // Função auxiliar para formatar moeda (não usada atualmente)
  const _formatCurrency = (value: number | null | undefined) => {
    if (value == null) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value));
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calcularResumoFinanceiro = () => {
    if (!accountInfo?.pagamentos) return { total: 0, pago: 0, restante: 0 };

    // Somar por parcelas quando disponíveis, caso contrário usar o valor do pagamento
    let total = 0;
    let pago = 0;

    for (const p of accountInfo.pagamentos) {
      if (p.parcelas_json && p.parcelas_json.length > 0) {
        const parcelaTotal = p.parcelas_json.reduce(
          (acc, par) => acc + (par.valor || 0),
          0
        );
        const parcelaPago = p.parcelas_json.reduce(
          (acc, par) => acc + ((par.pago ? par.valor || 0 : 0) || 0),
          0
        );
        total += parcelaTotal;
        pago += parcelaPago;
      } else {
        total += p.valor || 0;
        if (p.status === 'pago') pago += p.valor || 0;
      }
    }

    const restante = total - pago;

    return { total, pago, restante };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="py-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded p-4">
          <strong className="block font-semibold">Erro</strong>
          <p className="text-sm mt-1">{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Função auxiliar de resumo financeiro (não usada atualmente)
  const _resumoFinanceiro = calcularResumoFinanceiro();

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Informações da Conta
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Gerencie seus dados pessoais
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="inline mr-2" size={16} />
          Cadastradas
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'info' && (
          <>
            {/* Informações Cadastrais */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Building2 className="text-primary-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Dados da Entidade
                  </h2>
                  <p className="text-sm text-gray-600">
                    Informações cadastrais
                  </p>
                </div>
              </div>

              {accountInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Nome
                    </label>
                    <p className="text-sm text-gray-900 font-medium">
                      {accountInfo.nome}
                    </p>
                  </div>

                  {accountInfo.cnpj && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        CNPJ
                      </label>
                      <p className="text-sm text-gray-900">
                        {accountInfo.cnpj}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">{accountInfo.email}</p>
                  </div>

                  {accountInfo.telefone && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Telefone
                      </label>
                      <p className="text-sm text-gray-900">
                        {accountInfo.telefone}
                      </p>
                    </div>
                  )}

                  {accountInfo.endereco && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Endereço
                      </label>
                      <p className="text-sm text-gray-900">
                        {accountInfo.endereco}
                      </p>
                    </div>
                  )}

                  {(accountInfo.cidade || accountInfo.estado) && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Localização
                      </label>
                      <p className="text-sm text-gray-900">
                        {[accountInfo.cidade, accountInfo.estado]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Data de Cadastro
                    </label>
                    <p className="text-sm text-gray-900">
                      {formatDate(accountInfo.criado_em)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Informações não disponíveis
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
