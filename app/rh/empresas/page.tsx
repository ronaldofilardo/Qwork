'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, ArrowLeft, AlertCircle } from 'lucide-react';
import EmpresaFormModal from '@/components/clinica/EmpresaFormModal';

interface Empresa {
  id?: number;
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ativa?: boolean;
}

export default function EmpresasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const carregarEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rh/empresas');

      if (response.ok) {
        const data = await response.json();
        setEmpresas(data || []);
        setSessionError(null); // Limpar erro se sucesso
      } else if (response.status === 403) {
        const errorData = await response.json();
        setSessionError(
          errorData.error || 'Você não está vinculado a uma clínica.'
        );
      } else {
        console.error('Erro ao carregar empresas');
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarEmpresas();
  }, [carregarEmpresas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando empresas...</p>
        </div>
      </div>
    );
  }

  // Exibir erro de sessão se RH não tiver clinica_id
  if (sessionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <AlertCircle className="text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro de Configuração
          </h2>
          <p className="text-gray-600 text-center max-w-md">{sessionError}</p>
          <p className="text-sm text-gray-500 mt-2">
            Entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/rh')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
              >
                <ArrowLeft size={20} />
                Voltar
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Gerenciar Empresas
                </h1>
                <p className="text-gray-600">
                  Cadastre e gerencie as empresas da sua clínica
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {empresas.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🏢</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Nenhuma empresa cadastrada
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Para começar a gerenciar avaliações psicossociais, cadastre sua
              primeira empresa.
            </p>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors"
            >
              <Plus size={20} />
              Cadastrar Primeira Empresa
            </button>

            {/* Modal para cadastrar empresa (substitui o formulário inline) */}

            <EmpresaFormModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={(novaEmpresa: any) => {
                // Adicionar localmente sem recarregar imediatamente para evitar sobrescrever
                setEmpresas((prev) => [novaEmpresa, ...prev]);
                setIsModalOpen(false);
              }}
            />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Empresas Cadastradas
                </h2>
                <p className="text-gray-600 text-sm">
                  Selecione uma empresa para visualizar detalhes
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
              >
                <Plus size={20} />
                Nova Empresa
              </button>
            </div>

            {/* Modal que abre o formulário de Empresa */}
            <EmpresaFormModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSuccess={(novaEmpresa: any) => {
                // Adicionar localmente sem recarregar imediatamente para evitar sobrescrever
                setEmpresas((prev) => [novaEmpresa, ...prev]);
                setIsModalOpen(false);
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {empresas.map((empresa) => (
                <div
                  key={empresa.id}
                  onClick={() =>
                    router.push(`/rh/empresa/${empresa.id}?tab=${tab}`)
                  }
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-primary"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 text-lg mb-1">
                        {empresa.nome}
                      </h3>
                      <p className="text-sm text-gray-600">
                        CNPJ: {empresa.cnpj}
                      </p>
                    </div>
                    {empresa.ativa !== false && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Ativa
                      </span>
                    )}
                  </div>

                  {(empresa.cidade || empresa.estado) && (
                    <div className="text-sm text-gray-600 mb-2">
                      📍 {empresa.cidade}
                      {empresa.cidade && empresa.estado && ', '}
                      {empresa.estado}
                    </div>
                  )}

                  {empresa.email && (
                    <div className="text-sm text-gray-600 mb-2">
                      ✉️ {empresa.email}
                    </div>
                  )}

                  {empresa.telefone && (
                    <div className="text-sm text-gray-600 mb-2">
                      📞 {empresa.telefone}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm text-primary font-medium">
                      Clique para visualizar detalhes →
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
