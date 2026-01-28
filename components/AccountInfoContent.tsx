'use client';

import {
  Building2,
  FileText,
  DollarSign,
  Users,
  CreditCard,
} from 'lucide-react';

interface AccountInfo {
  nome: string;
  cnpj?: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  criado_em: string;
  contrato?: {
    numero_contrato: string;
    plano_nome: string;
    valor_total: number;
    qtd_funcionarios_contratada: number;
    vigencia_inicio: string;
    vigencia_fim: string;
    status: string;
  };
  pagamentos?: Array<{
    id: number;
    valor: number;
    status: string;
    data_solicitacao: string;
    numero_parcelas?: number;
    detalhes_parcelas?: Array<{
      numero: number;
      valor: number;
      data_vencimento: string;
      pago: boolean;
      data_pagamento?: string;
    }>;
  }>;
}

interface AccountInfoContentProps {
  accountInfo: AccountInfo | null;
  isLoading?: boolean;
}

export default function AccountInfoContent({
  accountInfo,
  isLoading = false,
}: AccountInfoContentProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Informações da Conta
        </h1>
        <p className="text-gray-600">
          Dados cadastrais e informações do plano contratado
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Exibe as informações da <strong>Clínica logada</strong>. As
          informações das empresas clientes estão disponíveis em{' '}
          <span className="font-medium">
            Financeiro → Cobrança / Pagamentos
          </span>
          .
        </p>
      </div>

      {/* Grid com 2 colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Dados da Empresa */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="text-primary" size={20} />
            Dados da Empresa
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Nome
              </dt>
              <dd className="text-sm text-gray-900 font-medium mt-1">
                {accountInfo?.nome || 'Não informado'}
              </dd>
            </div>
            {accountInfo?.cnpj && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  CNPJ
                </dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {accountInfo.cnpj}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email
              </dt>
              <dd className="text-sm text-gray-900 mt-1">
                {accountInfo?.email || 'Não informado'}
              </dd>
            </div>
            {accountInfo?.telefone && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Telefone
                </dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {accountInfo.telefone}
                </dd>
              </div>
            )}
            {accountInfo?.endereco && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Endereço
                </dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {accountInfo.endereco}
                </dd>
              </div>
            )}
            {(accountInfo?.cidade || accountInfo?.estado) && (
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Localização
                </dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {[accountInfo?.cidade, accountInfo?.estado]
                    .filter(Boolean)
                    .join(', ')}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Data de Cadastro
              </dt>
              <dd className="text-sm text-gray-900 mt-1">
                {formatDate(accountInfo?.criado_em || '')}
              </dd>
            </div>
          </dl>
        </div>

        {/* Card: Plano Contratado */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="text-primary" size={20} />
            Plano Contratado
          </h2>
          {accountInfo?.contrato ? (
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Número do Contrato
                </dt>
                <dd className="text-sm text-gray-900 font-medium mt-1">
                  {accountInfo.contrato.numero_contrato}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Plano
                </dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {accountInfo.contrato.plano_nome}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Valor Total
                </dt>
                <dd className="text-sm text-gray-900 font-medium mt-1">
                  {formatCurrency(accountInfo.contrato.valor_total)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Funcionários Contratados
                </dt>
                <dd className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                  <Users size={14} />
                  {accountInfo.contrato.qtd_funcionarios_contratada}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Vigência
                </dt>
                <dd className="text-sm text-gray-900 mt-1">
                  {formatDate(accountInfo.contrato.vigencia_inicio)} -{' '}
                  {formatDate(accountInfo.contrato.vigencia_fim)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Status
                </dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      accountInfo.contrato.status === 'ativo'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {accountInfo.contrato.status}
                  </span>
                </dd>
              </div>
            </dl>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto text-gray-400 mb-2" size={32} />
              <p className="text-sm text-gray-500">Nenhum plano contratado</p>
            </div>
          )}
        </div>
      </div>

      {/* Seção de Pagamentos */}
      {accountInfo?.pagamentos && accountInfo.pagamentos.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="text-primary" size={20} />
            Histórico de Pagamentos
          </h2>
          <div className="space-y-4">
            {accountInfo.pagamentos.map((pagamento) => (
              <div
                key={pagamento.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(pagamento.valor)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Solicitado em {formatDate(pagamento.data_solicitacao)}
                    </p>
                  </div>
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                      pagamento.status === 'pago'
                        ? 'bg-green-100 text-green-800'
                        : pagamento.status === 'pendente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {pagamento.status}
                  </span>
                </div>

                {pagamento.numero_parcelas && pagamento.numero_parcelas > 1 && (
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {pagamento.numero_parcelas} parcelas
                    </p>
                    {pagamento.detalhes_parcelas && (
                      <div className="space-y-2">
                        {pagamento.detalhes_parcelas.map((parcela) => (
                          <div
                            key={parcela.numero}
                            className="flex justify-between items-center text-sm py-2 px-3 bg-gray-50 rounded"
                          >
                            <span className="text-gray-700">
                              Parcela {parcela.numero}
                            </span>
                            <div className="text-right">
                              <span
                                className={`font-medium ${
                                  parcela.pago
                                    ? 'text-green-600'
                                    : 'text-gray-900'
                                }`}
                              >
                                {formatCurrency(parcela.valor)}
                              </span>
                              <span className="text-gray-500 text-xs ml-2">
                                {formatDate(parcela.data_vencimento)}
                              </span>
                              {parcela.pago && (
                                <span className="ml-2 text-xs text-green-600">
                                  ✓ Pago
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
