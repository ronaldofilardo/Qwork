'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  FileText,
  CheckCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import EmpresaFormModal from '@/components/clinica/EmpresaFormModal';

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  ativa: boolean;
  total_funcionarios?: number;
  total_avaliacoes?: number;
  avaliacoes_concluidas?: number;
  representante_nome: string;
  representante_fone: string;
  representante_email: string;
}

interface EmpresasStats {
  total_empresas: number;
  total_funcionarios: number;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
}

export default function RhPage() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [stats, setStats] = useState<EmpresasStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      // Carregar empresas
      const empresasRes = await fetch('/api/rh/empresas');
      if (empresasRes.ok) {
        const empresasData = await empresasRes.json();
        setEmpresas(empresasData);
      }

      // Carregar estatísticas
      const statsRes = await fetch('/api/rh/dashboard');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEmpresaCreated = (novaEmpresa: Empresa) => {
    setEmpresas((prev) => [novaEmpresa, ...prev]);
    loadData(); // Recarregar para atualizar estatísticas
    setIsModalOpen(false);
  };

  const handleNavigateToEmpresa = (empresaId: number) => {
    router.push(`/rh/empresa/${empresaId}`);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Gestão de Empresas
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie as empresas clientes e suas avaliações psicossociais
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              data-testid="nova-empresa-button"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors shadow-md"
            >
              <Plus size={20} />
              Nova Empresa
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Cards de Estatísticas Globais */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="text-blue-500" size={32} />
                <span className="text-3xl font-bold text-gray-900">
                  {stats.total_empresas || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Total de Empresas
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="text-purple-500" size={32} />
                <span className="text-3xl font-bold text-gray-900">
                  {stats.total_funcionarios || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Total de Funcionários
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <FileText className="text-orange-500" size={32} />
                <span className="text-3xl font-bold text-gray-900">
                  {stats.total_avaliacoes || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Total de Avaliações
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="text-green-500" size={32} />
                <span className="text-3xl font-bold text-gray-900">
                  {stats.avaliacoes_concluidas || 0}
                </span>
              </div>
              <p className="text-sm text-gray-600 font-medium">
                Avaliações Concluídas
              </p>
              {stats.total_avaliacoes > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(
                    (stats.avaliacoes_concluidas / stats.total_avaliacoes) * 100
                  )}
                  % de conclusão
                </p>
              )}
            </div>
          </div>
        )}

        {/* Cards de Empresas */}
        {empresas.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Building2 className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Nenhuma empresa cadastrada
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Para começar a gerenciar avaliações psicossociais, cadastre sua
              primeira empresa cliente clicando no botão acima.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Empresas Cadastradas
              </h2>
              <p className="text-sm text-gray-600">
                Clique em uma empresa para ver detalhes e gerenciar funcionários
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {empresas.map((empresa) => (
                <div
                  key={empresa.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {empresa.nome}
                        </h3>
                        <p className="text-sm text-gray-600">
                          CNPJ: {empresa.cnpj}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          empresa.ativa
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {empresa.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>

                    {/* Representante */}
                    {empresa.representante_nome && (
                      <div className="text-sm text-gray-600 mt-2">
                        <p className="font-medium">
                          Representante: {empresa.representante_nome}
                        </p>
                        {empresa.representante_email && (
                          <p className="text-xs">
                            {empresa.representante_email}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Stats */}
                  <div className="p-6 bg-gray-50">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">
                          Funcionários
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {empresa.total_funcionarios || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Avaliações</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {empresa.total_avaliacoes || 0}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {empresa.total_avaliacoes &&
                      empresa.total_avaliacoes > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progresso</span>
                            <span>
                              {empresa.avaliacoes_concluidas || 0} /{' '}
                              {empresa.total_avaliacoes}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${Math.round(
                                  ((empresa.avaliacoes_concluidas || 0) /
                                    empresa.total_avaliacoes) *
                                    100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                    {/* Action Button */}
                    <button
                      onClick={() => handleNavigateToEmpresa(empresa.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover transition-colors"
                    >
                      Ver Dashboard
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal de Criação de Empresa */}
      <EmpresaFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleEmpresaCreated}
      />
    </div>
  );
}
