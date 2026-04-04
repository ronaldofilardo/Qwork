'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building2, Download } from 'lucide-react';
import PagamentosFinanceiros from '@/components/shared/PagamentosFinanceiros';
import PagamentosEmAberto from '@/components/shared/PagamentosEmAberto';
import MiniDashboardFinanceiro from '@/components/shared/financeiro/MiniDashboardFinanceiro';

interface ContaSectionState {
  nome: string;
  cnpj?: string;
}

interface Representante {
  nome: string;
  email?: string;
  telefone?: string;
}

interface AccountInfo {
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  responsavel_nome?: string;
  criado_em?: string;
  tem_contrato_aceito?: boolean;
  representante?: Representante | null;
}

export default function EntidadeContaSection() {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [orgInfo, setOrgInfo] = useState<ContaSectionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingContrato, setDownloadingContrato] = useState(false);

  const handleBaixarContrato = async () => {
    try {
      setDownloadingContrato(true);
      const response = await fetch('/api/tomador/contrato-pdf');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contrato-qwork.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert('Erro ao baixar contrato');
      }
    } catch (error) {
      console.error('Erro ao baixar contrato:', error);
      alert('Erro ao baixar contrato');
    } finally {
      setDownloadingContrato(false);
    }
  };

  const loadAccountInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/entidade/account-info?_=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setAccountInfo(data);
        setOrgInfo({ nome: data.nome, cnpj: data.cnpj });
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

  useEffect(() => {
    loadAccountInfo();
  }, [loadAccountInfo]);

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
          Dados cadastrais da entidade
        </p>
      </div>

      <div className="space-y-6">
        {/* Informações da Entidade */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Building2 className="text-primary-600" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Dados da Entidade
              </h2>
              <p className="text-sm text-gray-600">Informações cadastrais</p>
            </div>
            {accountInfo?.tem_contrato_aceito && (
              <button
                onClick={handleBaixarContrato}
                disabled={downloadingContrato}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                {downloadingContrato ? 'Baixando...' : 'Baixar Contrato'}
              </button>
            )}
          </div>

          {accountInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
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
                    <p className="text-sm text-gray-900">{accountInfo.cnpj}</p>
                  </div>
                )}

                {accountInfo.email && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Email
                    </label>
                    <p className="text-sm text-gray-900">{accountInfo.email}</p>
                  </div>
                )}

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
              </div>

              <div className="space-y-3">
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

                {accountInfo.responsavel_nome && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Responsável
                    </label>
                    <p className="text-sm text-gray-900">
                      {accountInfo.responsavel_nome}
                    </p>
                  </div>
                )}

                {accountInfo.representante && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Representante Comercial
                    </label>
                    <p className="text-sm text-gray-900 font-medium">
                      {accountInfo.representante.nome}
                    </p>
                    {accountInfo.representante.email && (
                      <p className="text-xs text-gray-500">
                        {accountInfo.representante.email}
                      </p>
                    )}
                    {accountInfo.representante.telefone && (
                      <p className="text-xs text-gray-500">
                        {accountInfo.representante.telefone}
                      </p>
                    )}
                  </div>
                )}

                {accountInfo.criado_em && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Data de Cadastro
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(accountInfo.criado_em).toLocaleDateString(
                        'pt-BR'
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              Informações da entidade não disponíveis
            </p>
          )}
        </div>

        {/* Pagamentos em Aberto */}
        <PagamentosEmAberto apiUrl="/api/entidade/pagamentos-em-aberto" />

        {/* Mini-Dashboard Financeiro */}
        <MiniDashboardFinanceiro apiUrl="/api/entidade/financeiro-resumo" />

        {/* Dados Financeiros de Laudos */}
        {orgInfo && (
          <PagamentosFinanceiros
            apiUrl="/api/entidade/pagamentos-laudos"
            organizacaoNome={orgInfo.nome}
            organizacaoCnpj={orgInfo.cnpj}
          />
        )}
      </div>
    </>
  );
}
