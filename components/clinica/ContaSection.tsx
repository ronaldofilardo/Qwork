'use client';

import { useEffect, useState, useCallback } from 'react';
import { User, Building2 } from 'lucide-react';

// Helper simples para comparar snapshot vs atual
function isSnapshotDifferent(
  current: Record<string, any>,
  snapshot: Record<string, any>
) {
  if (!current || !snapshot) return false;
  const keys = [
    'nome',
    'cnpj',
    'email',
    'telefone',
    'endereco',
    'cidade',
    'estado',
  ];
  return keys.some((k) => (current[k] || '') !== (snapshot[k] || ''));
}

function SnapshotSection({
  current: _current,
  snapshot,
  snapshotCreatedAt,
}: {
  current: Record<string, any>;
  snapshot: Record<string, any>;
  snapshotCreatedAt?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-primary hover:underline mb-3"
        aria-expanded={open}
      >
        {open ? 'Ocultar dados do cadastro' : 'Ver dados do cadastro'}
      </button>

      {open && (
        <div className="bg-gray-50 p-4 rounded">
          {snapshot.nome && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Nome (no cadastro)
              </label>
              <p className="text-sm text-gray-900">{snapshot.nome}</p>
            </div>
          )}

          {snapshot.email && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Email (no cadastro)
              </label>
              <p className="text-sm text-gray-900">{snapshot.email}</p>
            </div>
          )}

          {snapshot.cnpj && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                CNPJ (no cadastro)
              </label>
              <p className="text-sm text-gray-900">{snapshot.cnpj}</p>
            </div>
          )}

          {snapshot.telefone && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Telefone (no cadastro)
              </label>
              <p className="text-sm text-gray-900">{snapshot.telefone}</p>
            </div>
          )}

          {snapshot.endereco && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Endereço (no cadastro)
              </label>
              <p className="text-sm text-gray-900">{snapshot.endereco}</p>
            </div>
          )}

          {(snapshot.cidade || snapshot.estado) && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Localização (no cadastro)
              </label>
              <p className="text-sm text-gray-900">
                {[snapshot.cidade, snapshot.estado].filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {snapshotCreatedAt && (
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide">
                Registrado em
              </label>
              <p className="text-sm text-gray-900">
                {new Date(String(snapshotCreatedAt)).toLocaleString('pt-BR')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper para formatar valores monetários localizados
function formatarValor(valor: number | null | undefined) {
  if (valor == null) return 'Não informado';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(valor));
}

interface AccountInfo {
  clinica?: {
    id: number;
    nome: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    cidade?: string | null;
    estado?: string | null;
    criado_em?: string | null;
    cadastro_original?: Record<string, any> | null;
    cadastro_original_created_at?: string | null;
    responsavel_nome?: string;
    status?: string;
    plano?: {
      numero_funcionarios_estimado?: number;
      numero_funcionarios_atual?: number;
      valor_pago?: number;
      valor_por_funcionario?: number;
      tipo_pagamento?: string;
      modalidade_pagamento?: string;
      numero_parcelas?: number;
      status?: string;
      data_contratacao?: string;
      data_fim_vigencia?: string;
      contrato_numero?: string;
      plano_nome?: string;
      plano_tipo?: string;
      plano_descricao?: string;
      pagamento_status?: string;
      valor_pendente?: number;
      plano_preco_unitario?: number;
    };
  };
  gestores?: Array<{
    id: number;
    cpf: string;
    nome: string;
    email: string;
    perfil: string;
  }>;
  pagamentos?: Array<{
    id: number;
    valor: number;
    status: string;
    numero_parcelas?: number;
    metodo?: string;
    data_pagamento?: string;
    plataforma?: string;
    criado_em?: string;
    data_solicitacao?: string;
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

export default function ContaSection() {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [parcelasData, setParcelasData] = useState<ParcelasData | null>(null);
  const [_loadingParcelas, setLoadingParcelas] = useState(false);

  const loadAccountInfo = useCallback(async () => {
    try {
      // cache-bust para garantir sempre resposta atual
      const res = await fetch(`/api/rh/account-info?_=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
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
        const res = await fetch(`/api/rh/parcelas?_=${Date.now()}`);
        if (res.ok) {
          const data = (await res.json()) as ParcelasData;
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
              data.contratacao_at || ai.clinica?.criado_em || ''
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
              ai.clinica?.criado_em || ''
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
            ai.clinica?.criado_em || ''
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
      const res = await fetch('/api/rh/parcelas/gerar-recibo', {
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

  // Buscar parcelas apenas UMA vez quando accountInfo estiver disponível
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

  // Função auxiliar para formatar data (não usada atualmente)
  const _formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    // Use UTC to avoid timezone shifts when parsing ISO dates (tests and backend use UTC dates)
    return new Date(dateString).toLocaleDateString('pt-BR', {
      timeZone: 'UTC',
    });
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

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Informações da Conta
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Dados da clínica e gestores RH
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
          Informações Cadastrais
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'info' && (
          <>
            {/* Informações da Clínica */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <Building2 className="text-primary-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Dados da Clínica
                  </h2>
                  <p className="text-sm text-gray-600">
                    Informações cadastrais
                  </p>
                </div>
              </div>

              {accountInfo?.clinica ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Coluna principal */}
                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Nome
                      </label>
                      <p className="text-sm text-gray-900 font-medium">
                        {accountInfo.clinica.nome}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {accountInfo.clinica.cnpj && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide">
                            CNPJ
                          </label>
                          <p className="text-sm text-gray-900">
                            {accountInfo.clinica.cnpj}
                          </p>
                        </div>
                      )}

                      {accountInfo.clinica.email && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide">
                            Email
                          </label>
                          <p className="text-sm text-gray-900">
                            {accountInfo.clinica.email}
                          </p>
                        </div>
                      )}

                      {accountInfo.clinica.telefone && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide">
                            Telefone
                          </label>
                          <p className="text-sm text-gray-900">
                            {accountInfo.clinica.telefone}
                          </p>
                        </div>
                      )}

                      {accountInfo.clinica.endereco && (
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide">
                            Endereço
                          </label>
                          <p className="text-sm text-gray-900">
                            {accountInfo.clinica.endereco}
                          </p>
                        </div>
                      )}
                    </div>

                    {(accountInfo.clinica.cidade ||
                      accountInfo.clinica.estado) && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                          Localização
                        </label>
                        <p className="text-sm text-gray-900">
                          {[
                            accountInfo.clinica.cidade,
                            accountInfo.clinica.estado,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    )}

                    {accountInfo.clinica.cadastro_original &&
                      isSnapshotDifferent(
                        accountInfo.clinica,
                        accountInfo.clinica.cadastro_original
                      ) && (
                        <div className="mt-4">
                          <SnapshotSection
                            current={accountInfo.clinica}
                            snapshot={accountInfo.clinica.cadastro_original}
                            snapshotCreatedAt={
                              accountInfo.clinica.cadastro_original_created_at
                            }
                          />
                        </div>
                      )}
                  </div>

                  {/* Coluna lateral */}
                  <div className="space-y-3">
                    {accountInfo.clinica.responsavel_nome && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                          Responsável
                        </label>
                        <p className="text-sm text-gray-900">
                          {accountInfo.clinica.responsavel_nome}
                        </p>
                      </div>
                    )}

                    {accountInfo.clinica.criado_em && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                          Data de Cadastro
                        </label>
                        <p className="text-sm text-gray-900">
                          {new Date(
                            accountInfo.clinica.criado_em
                          ).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}

                    {accountInfo.clinica.status && (
                      <div>
                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                          Status
                        </label>
                        <p className="text-sm text-gray-900">
                          {accountInfo.clinica.status}
                        </p>
                      </div>
                    )}

                    {accountInfo.clinica.plano && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="text-xs text-gray-500 uppercase tracking-wide">
                          Plano
                        </label>
                        <div className="mt-2">
                          <div className="text-sm text-gray-700">
                            Funcionários:{' '}
                            <span className="font-medium text-gray-900">
                              {accountInfo.clinica.plano
                                .numero_funcionarios_atual ?? '—'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            Valor Pago:{' '}
                            <span className="font-medium text-gray-900">
                              {formatarValor(
                                accountInfo.clinica.plano.valor_pago
                              )}
                            </span>
                          </div>
                          <div className="text-sm text-gray-700">
                            Valor / Funcionário:{' '}
                            <span className="font-medium text-gray-900">
                              {accountInfo.clinica.plano.valor_por_funcionario
                                ? formatarValor(
                                    accountInfo.clinica.plano
                                      .valor_por_funcionario
                                  )
                                : '—'}
                            </span>
                          </div>

                          {accountInfo.clinica.plano.contrato_numero && (
                            <div className="text-sm text-gray-700">
                              Contrato:{' '}
                              <span className="font-medium text-gray-900">
                                {accountInfo.clinica.plano.contrato_numero}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Informações da clínica não disponíveis
                </p>
              )}
            </div>

            {/* Gestores RH */}
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <User className="text-purple-600" size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Gestores RH
                  </h2>
                  <p className="text-sm text-gray-600">
                    Usuários com acesso ao sistema
                  </p>
                </div>
              </div>

              {accountInfo?.gestores && accountInfo.gestores.length > 0 ? (
                <div className="space-y-4">
                  {accountInfo.gestores.map((gestor) => (
                    <div
                      key={gestor.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="text-primary-600" size={20} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {gestor.nome}
                        </p>
                        <p className="text-xs text-gray-600">{gestor.email}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          CPF: {gestor.cpf}
                        </p>
                      </div>
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {gestor.perfil === 'rh' ? 'Gestor RH' : gestor.perfil}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Nenhum gestor RH cadastrado
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
