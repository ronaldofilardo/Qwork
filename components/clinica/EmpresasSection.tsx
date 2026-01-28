'use client';

import React, { useEffect, useState } from 'react';
import {
  Users,
  FileText,
  CheckCircle,
  Building2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Plus,
} from 'lucide-react';
import FuncionariosSection from '@/components/funcionarios/FuncionariosSection';
import EmpresaFormModal from '@/components/clinica/EmpresaFormModal';

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  ativa: boolean;
  total_funcionarios?: number;
  total_avaliacoes?: number;
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

export default function EmpresasSection() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [stats, setStats] = useState<EmpresasStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEmpresa, setExpandedEmpresa] = useState<number | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    try {
      // Carregar empresas
      const empresasRes = await fetch('/api/rh/empresas');
      if (empresasRes.ok) {
        const empresasData = await empresasRes.json();
        setEmpresas(empresasData);
        setSessionError(null); // Limpar erro se sucesso
      } else if (empresasRes.status === 403) {
        const errorData = await empresasRes.json();
        setSessionError(
          errorData.error || 'Você não está vinculado a uma clínica.'
        );
      } else if (empresasRes.status === 401) {
        // Sessão inconsistente (usuário não encontrado / inativo)
        const errorData = await empresasRes.json();
        setSessionError(
          errorData.error ||
            'Sessão inválida. Efetue logout e entre novamente ou contate o suporte.'
        );
      }

      // Carregar estatísticas
      const statsRes = await fetch('/api/rh/dashboard');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setSessionError('Erro ao carregar dados. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleEmpresaStatus = async (
    empresaId: number,
    currentStatus: boolean
  ) => {
    if (
      !confirm(
        currentStatus
          ? 'Desativar esta empresa? Todos os funcionários serão inativados também.'
          : 'Ativar esta empresa? Os funcionários devem ser reativados individualmente.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/rh/empresas/${empresaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativa: !currentStatus }),
      });

      if (res.ok) {
        await loadData();
      } else {
        const error = await res.json();
        alert(`Erro ao atualizar status: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      alert('Erro ao atualizar status da empresa');
    }
  };

  const handleEmpresaCreated = (novaEmpresa: Empresa) => {
    setEmpresas((prev) => [novaEmpresa, ...prev]);
    loadData(); // Recarregar para atualizar estatísticas
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Exibir erro de sessão se RH não tiver clinica_id
  if (sessionError) {
    return (
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
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Empresas Clientes</h1>
        <p className="text-sm text-gray-600 mt-1">
          Gestão de empresas clientes e suas avaliações psicossociais
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Building2 className="text-blue-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {stats?.total_empresas || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total de Empresas</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-purple-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {stats?.total_funcionarios || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total de Funcionários</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <FileText className="text-orange-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {stats?.total_avaliacoes || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total de Avaliações</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="text-green-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {stats?.avaliacoes_concluidas || 0}
            </span>
          </div>
          <p className="text-sm text-gray-600">Avaliações Concluídas</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.total_avaliacoes && stats.avaliacoes_concluidas
              ? `${Math.round((stats.avaliacoes_concluidas / stats.total_avaliacoes) * 100)}%`
              : '0%'}{' '}
            de conclusão
          </p>
        </div>
      </div>

      {/* Tabela de Empresas */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de Empresas
          </h2>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            data-testid="nova-empresa-button"
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
          >
            <Plus size={20} />
            Nova Empresa
          </button>
        </div>

        {empresas.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto text-gray-400" size={48} />
            <p className="text-gray-600 mt-4">Nenhuma empresa cadastrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Nome
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 hidden md:table-cell">
                    CNPJ
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 hidden lg:table-cell">
                    Funcionários
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 hidden lg:table-cell">
                    Avaliações
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {empresas.map((empresa) => (
                  <React.Fragment key={empresa.id}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            setExpandedEmpresa(
                              expandedEmpresa === empresa.id ? null : empresa.id
                            )
                          }
                          className="flex items-center gap-2 text-left w-full"
                        >
                          {expandedEmpresa === empresa.id ? (
                            <ChevronDown
                              size={16}
                              className="text-gray-500 flex-shrink-0"
                            />
                          ) : (
                            <ChevronRight
                              size={16}
                              className="text-gray-500 flex-shrink-0"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {empresa.nome}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-700 hidden md:table-cell">
                        {empresa.cnpj || '-'}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700 hidden lg:table-cell">
                        {empresa.total_funcionarios || 0}
                      </td>
                      <td className="py-3 px-4 text-center text-sm text-gray-700 hidden lg:table-cell">
                        {empresa.total_avaliacoes || 0}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            empresa.ativa
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {empresa.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() =>
                            toggleEmpresaStatus(empresa.id, empresa.ativa)
                          }
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            empresa.ativa
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {empresa.ativa ? 'Desativar' : 'Ativar'}
                        </button>
                      </td>
                    </tr>
                    {expandedEmpresa === empresa.id && (
                      <tr key={`${empresa.id}-details`}>
                        <td colSpan={6} className="bg-gray-50 p-6">
                          <FuncionariosSection
                            contexto="clinica"
                            empresaId={empresa.id}
                            empresaNome={empresa.nome}
                            onRefresh={loadData}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criação de Empresa */}
      <EmpresaFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleEmpresaCreated}
      />
    </>
  );
}
