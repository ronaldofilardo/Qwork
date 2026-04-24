'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Building2,
  Download,
  Wrench,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import PagamentosFinanceiros from '@/components/shared/PagamentosFinanceiros';
import PagamentosEmAberto from '@/components/shared/PagamentosEmAberto';
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

interface ManutencaoStatus {
  alerta: boolean;
  limite_cobranca?: string | null;
  dias_restantes?: number | null;
  vencida?: boolean;
  laudo_emitido?: boolean;
  ja_cobrada?: boolean;
}

export default function EntidadeContaSection() {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [orgInfo, setOrgInfo] = useState<ContaSectionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadingContrato, setDownloadingContrato] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [manutencaoStatus, setManutencaoStatus] =
    useState<ManutencaoStatus | null>(null);

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
      const [infoRes, logoRes, manutencaoRes] = await Promise.all([
        fetch(`/api/entidade/account-info?_=${Date.now()}`),
        fetch('/api/entidade/logo'),
        fetch('/api/entidade/manutencao-status'),
      ]);

      if (infoRes.ok) {
        const data = await infoRes.json();
        setAccountInfo(data);
        setOrgInfo({ nome: data.nome, cnpj: data.cnpj });
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

      if (manutencaoRes.ok) {
        const mData = await manutencaoRes.json();
        setManutencaoStatus(mData);
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
        const res = await fetch('/api/entidade/logo', {
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
      const res = await fetch('/api/entidade/logo', {
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
        {/* Informações da Entidade + Logo lado a lado */}
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
                      <p className="text-sm text-gray-900">
                        {accountInfo.cnpj}
                      </p>
                    </div>
                  )}

                  {accountInfo.email && (
                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wide">
                        Email
                      </label>
                      <p className="text-sm text-gray-900">
                        {accountInfo.email}
                      </p>
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

          {/* Logo da Organização */}
          {accountInfo && (
            <LogoUploader
              currentLogoUrl={logoUrl}
              orgName={accountInfo.nome}
              onSave={handleSaveLogo}
              onRemove={handleRemoveLogo}
              isSaving={isSavingLogo}
            />
          )}
        </div>
        {/* fim grid dados+logo */}

        {/* Alerta Taxa de Manutenção */}
        {manutencaoStatus?.alerta && manutencaoStatus.limite_cobranca && (
          <div
            className={`rounded-lg border p-4 ${manutencaoStatus.vencida ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-300'}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 ${manutencaoStatus.vencida ? 'text-red-600' : 'text-orange-600'}`}
              >
                {manutencaoStatus.vencida ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <Wrench className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold text-sm ${manutencaoStatus.vencida ? 'text-red-800' : 'text-orange-800'}`}
                >
                  {manutencaoStatus.vencida
                    ? 'Taxa de Manutenção Vencida'
                    : 'Taxa de Manutenção a Vencer'}
                </p>
                <p
                  className={`text-sm mt-1 ${manutencaoStatus.vencida ? 'text-red-700' : 'text-orange-700'}`}
                >
                  {manutencaoStatus.vencida
                    ? `O prazo de ${Math.abs(manutencaoStatus.dias_restantes ?? 0)} dia(s) para geração do primeiro laudo foi excedido. Uma taxa de manutenção de R$\u00a0250,00 será cobrada pelo suporte.`
                    : `Você tem ${manutencaoStatus.dias_restantes} dia(s) para gerar o primeiro laudo antes de uma taxa de manutenção de R$\u00a0250,00 ser aplicada (prazo: ${new Date(manutencaoStatus.limite_cobranca).toLocaleDateString('pt-BR')}).`}
                </p>
              </div>
            </div>
          </div>
        )}
        {manutencaoStatus?.ja_cobrada && !manutencaoStatus.laudo_emitido && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              Taxa de manutenção já registrada. Ao gerar o primeiro laudo, um
              crédito de R$\u00a0250,00 será aplicado automaticamente.
            </p>
          </div>
        )}

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
