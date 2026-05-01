'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter } from 'lucide-react';
import DesligarFuncionarioModal from './DesligarFuncionarioModal';
import ModalInserirFuncionario from '@/components/ModalInserirFuncionario';
import ModalAdicionarFuncionarioEntidade from './ModalAdicionarFuncionarioEntidade';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import StatsCards from './components/StatsCards';
import FuncionarioRow from './components/FuncionarioRow';
import type { Funcionario, FuncionariosSectionProps } from './types';

export default function FuncionariosSection({
  contexto,
  tomadorId,
  empresaId,
  empresaNome,
  onRefresh,
  defaultStatusFilter = 'todos',
  responsavelCpf = '',
}: FuncionariosSectionProps) {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [filteredFuncionarios, setFilteredFuncionarios] = useState<
    Funcionario[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'todos' | 'ativos' | 'inativos'
  >(defaultStatusFilter);
  const [setorFilter, setSetorFilter] = useState('todos');
  const [nivelFilter, setNivelFilter] = useState('todos');

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDesligarModal, setShowDesligarModal] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] =
    useState<Funcionario | null>(null);

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    ativos: 0,
    inativos: 0,
  });

  // Carregar funcionários
  // Atualizar estatísticas
  const updateStats = (lista: Funcionario[]) => {
    const ativos = lista.filter((f) => f.ativo).length;
    setStats({
      total: lista.length,
      ativos,
      inativos: lista.length - ativos,
    });
  };

  const loadFuncionarios = async () => {
    setLoading(true);
    try {
      let url = '';
      if (contexto === 'entidade') {
        url = '/api/entidade/funcionarios';
      } else {
        if (!empresaId) {
          console.error('empresaId é obrigatório para clínica');
          return;
        }
        url = `/api/rh/funcionarios?empresa_id=${empresaId}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const listaFuncionarios = data.funcionarios || data || [];
        setFuncionarios(listaFuncionarios);
        updateStats(listaFuncionarios);
      } else {
        console.error('Erro ao carregar funcionários:', await res.text());
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFuncionarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contexto, empresaId, tomadorId]);

  // Filtrar funcionários
  useEffect(() => {
    let filtered = [...funcionarios];

    // Filtro de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.nome.toLowerCase().includes(term) ||
          f.cpf.includes(term) ||
          (f.email?.toLowerCase() || '').includes(term) ||
          (f.setor?.toLowerCase() || '').includes(term) ||
          (f.funcao?.toLowerCase() || '').includes(term)
      );
    }

    // Filtro de status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter((f) =>
        statusFilter === 'ativos' ? f.ativo : !f.ativo
      );
    }

    // Filtro de setor
    if (setorFilter !== 'todos') {
      filtered = filtered.filter((f) => f.setor === setorFilter);
    }

    // Filtro de nível
    if (nivelFilter !== 'todos') {
      filtered = filtered.filter((f) => f.nivel_cargo === nivelFilter);
    }

    setFilteredFuncionarios(filtered);
  }, [funcionarios, searchTerm, statusFilter, setorFilter, nivelFilter]);

  // Extrair setores únicos
  const setoresUnicos = Array.from(
    new Set(funcionarios.map((f) => f.setor))
  ).sort();

  // Toggle status
  const handleToggleStatus = async (cpf: string, currentStatus: boolean) => {
    const action = currentStatus ? 'inativar' : 'ativar';
    if (!confirm(`Deseja ${action} este funcionário?`)) {
      return;
    }

    try {
      const url =
        contexto === 'entidade'
          ? '/api/entidade/funcionarios/status'
          : '/api/rh/funcionarios/status';

      const body: { cpf: string; ativo: boolean; empresa_id?: number } = {
        cpf,
        ativo: !currentStatus,
      };

      // Para RH/Clínica, incluir empresa_id no body para escopar a inativação
      if (contexto !== 'entidade' && empresaId) {
        body.empresa_id = empresaId;
      }

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        // Atualizar estado local
        setFuncionarios((prev) =>
          prev.map((f) => (f.cpf === cpf ? { ...f, ativo: !currentStatus } : f))
        );
        // Recarregar dados do servidor para sincronizar (fallback se onRefresh não existir)
        if (onRefresh) {
          onRefresh();
        } else {
          loadFuncionarios();
        }
      } else {
        const error = await res.json();
        alert(`Erro ao ${action}: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status do funcionário');
    }
  };

  // Abrir modal de edição
  const handleEdit = (funcionario: Funcionario) => {
    setFuncionarioSelecionado(funcionario);
    setShowEditModal(true);
  };

  // Abrir modal de desligamento
  // Handler para desligar funcionário (não usado atualmente - botão removido da UI)
  const _handleDesligar = (funcionario: Funcionario) => {
    setFuncionarioSelecionado(funcionario);
    setShowDesligarModal(true);
  };

  // Callbacks de sucesso
  const handleSuccess = () => {
    loadFuncionarios();
    if (onRefresh) onRefresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div
      data-testid={`funcionarios-section-${defaultStatusFilter}`}
      className="space-y-6"
    >
      {/* Header com estatísticas */}
      <StatsCards
        total={stats.total}
        ativos={stats.ativos}
        inativos={stats.inativos}
      />

      {/* Barra de ações */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Buscar por nome, CPF, email, setor ou função..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto items-center">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">Adicionar Funcionário</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>

          <select
            value={setorFilter}
            onChange={(e) => setSetorFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="todos">Todos os setores</option>
            {setoresUnicos.map((setor) => (
              <option key={setor} value={setor}>
                {setor}
              </option>
            ))}
          </select>

          <select
            value={nivelFilter}
            onChange={(e) => setNivelFilter(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="todos">Todos os níveis</option>
            <option value="operacional">Operacional</option>
            <option value="gestao">Gestão</option>
          </select>

          {(searchTerm ||
            statusFilter !== 'todos' ||
            setorFilter !== 'todos' ||
            nivelFilter !== 'todos') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('todos');
                setSetorFilter('todos');
                setNivelFilter('todos');
              }}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela de funcionários */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredFuncionarios.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {funcionarios.length === 0
                ? 'Nenhum funcionário cadastrado'
                : 'Nenhum funcionário encontrado com os filtros aplicados'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CPF
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Setor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nível
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Avaliação
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFuncionarios.map((funcionario) => (
                  <FuncionarioRow
                    key={funcionario.cpf}
                    funcionario={funcionario}
                    onToggleStatus={handleToggleStatus}
                    onEdit={handleEdit}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}

      {showAddModal && contexto === 'entidade' && (
        <ModalAdicionarFuncionarioEntidade
          responsavelCpf={responsavelCpf}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showAddModal && contexto === 'clinica' && empresaId && (
        <ModalInserirFuncionario
          empresaId={empresaId}
          empresaNome={empresaNome || ''}
          responsavelCpf={responsavelCpf}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showEditModal && funcionarioSelecionado && (
        <EditEmployeeModal
          funcionario={funcionarioSelecionado}
          apiEndpoint={
            contexto === 'entidade'
              ? '/api/entidade/funcionarios'
              : '/api/rh/funcionarios'
          }
          onClose={() => {
            setShowEditModal(false);
            setFuncionarioSelecionado(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {showDesligarModal && funcionarioSelecionado && (
        <DesligarFuncionarioModal
          funcionario={funcionarioSelecionado}
          contexto={contexto}
          onClose={() => {
            setShowDesligarModal(false);
            setFuncionarioSelecionado(null);
          }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
