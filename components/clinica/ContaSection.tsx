'use client';

import { useEffect, useState, useCallback } from 'react';
import { Building2 } from 'lucide-react';

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
  };
}

export default function ContaSection() {
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAccountInfo = useCallback(async () => {
    try {
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
          Dados cadastrais da empresa e gestores
        </p>
      </div>

      <div className="space-y-6">
        {/* Informações da Empresa */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Building2 className="text-primary-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Dados da Empresa
              </h2>
              <p className="text-sm text-gray-600">Informações cadastrais</p>
            </div>
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

                {(accountInfo.clinica.cidade || accountInfo.clinica.estado) && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wide">
                      Localização
                    </label>
                    <p className="text-sm text-gray-900">
                      {[accountInfo.clinica.cidade, accountInfo.clinica.estado]
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
              Informações da empresa não disponíveis
            </p>
          )}
        </div>
      </div>
    </>
  );
}
