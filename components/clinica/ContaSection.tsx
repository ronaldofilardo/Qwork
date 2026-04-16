'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building2, Download } from 'lucide-react';
import PagamentosEmAberto from '@/components/shared/PagamentosEmAberto';
import PagamentosFinanceiros from '@/components/shared/PagamentosFinanceiros';
import MiniDashboardFinanceiro from '@/components/shared/financeiro/MiniDashboardFinanceiro';
import LogoUploader from '@/components/shared/LogoUploader';

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
    responsavel_nome?: string;
    status?: string;
    tem_contrato_aceito?: boolean;
    representante?: Representante | null;
  };
}

export default function ContaSection() {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orgInfo, setOrgInfo] = useState<ContaSectionState | null>(null);
  const [downloadingContrato, setDownloadingContrato] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isSavingLogo, setIsSavingLogo] = useState(false);

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
      const [infoRes, logoRes] = await Promise.all([
        fetch(`/api/rh/account-info?_=${Date.now()}`),
        fetch('/api/rh/logo'),
      ]);

      if (infoRes.ok) {
        const data = await infoRes.json();
        setAccountInfo(data);
        if (data?.clinica) {
          setOrgInfo({ nome: data.clinica.nome, cnpj: data.clinica.cnpj });
        }
        setErrorMessage(null);
      } else {
        try {
          const err = await infoRes.json();
          setErrorMessage(
            err?.error || 'Erro ao carregar informações da conta'
          );
        } catch {
          setErrorMessage('Erro ao carregar informações da conta');
        }
      }

      if (logoRes.ok) {
        const logoData = await logoRes.json();
        setLogoUrl(logoData.logo_url ?? null);
      }
    } catch (error) {
      console.error('Erro ao carregar informações da conta:', error);
      setErrorMessage('Erro ao carregar informações da conta');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveLogo = useCallback(
    async (base64: string, mimeType: string) => {
      setIsSavingLogo(true);
      try {
        const res = await fetch('/api/rh/logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo_base64: base64, mime_type: mimeType }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err?.error || 'Erro ao salvar logo');
        }
        const data = await res.json();
        setLogoUrl(data.logo_url ?? null);
      } finally {
        setIsSavingLogo(false);
      }
    },
    []
  );

  const handleRemoveLogo = useCallback(async () => {
    setIsSavingLogo(true);
    try {
      const res = await fetch('/api/rh/logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_base64: '' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || 'Erro ao remover logo');
      }
      setLogoUrl(null);
    } finally {
      setIsSavingLogo(false);
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
        {/* Informações da Empresa + Logo lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
              {accountInfo?.clinica?.tem_contrato_aceito && (
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

            {accountInfo?.clinica ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Nome
                    </label>
                    <p className="text-sm text-gray-900 font-medium">
                      {accountInfo.clinica.nome}
                    </p>
                  </div>

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
                </div>

                <div className="space-y-3">
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

                  {accountInfo.clinica.representante && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Representante Comercial
                      </label>
                      <p className="text-sm text-gray-900 font-medium">
                        {accountInfo.clinica.representante.nome}
                      </p>
                      {accountInfo.clinica.representante.email && (
                        <p className="text-xs text-gray-500">
                          {accountInfo.clinica.representante.email}
                        </p>
                      )}
                      {accountInfo.clinica.representante.telefone && (
                        <p className="text-xs text-gray-500">
                          {accountInfo.clinica.representante.telefone}
                        </p>
                      )}
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
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Informações da entidade não disponíveis
              </p>
            )}
          </div>

          {/* Logo da Organização */}
          {accountInfo?.clinica && (
            <LogoUploader
              currentLogoUrl={logoUrl}
              orgName={accountInfo.clinica.nome}
              onSave={handleSaveLogo}
              onRemove={handleRemoveLogo}
              isSaving={isSavingLogo}
            />
          )}
        </div>
        {/* fim grid dados+logo */}

        {/* Pagamentos em Aberto */}
        <PagamentosEmAberto apiUrl="/api/rh/pagamentos-em-aberto" />

        {/* Mini-Dashboard Financeiro */}
        <MiniDashboardFinanceiro apiUrl="/api/rh/financeiro-resumo" />

        {/* Dados Financeiros de Laudos */}
        {orgInfo && (
          <PagamentosFinanceiros
            apiUrl="/api/rh/pagamentos-laudos"
            organizacaoNome={orgInfo.nome}
            organizacaoCnpj={orgInfo.cnpj}
          />
        )}
      </div>
    </>
  );
}
