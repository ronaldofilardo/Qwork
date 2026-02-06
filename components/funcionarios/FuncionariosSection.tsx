'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Edit,
  Power,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import DesligarFuncionarioModal from './DesligarFuncionarioModal';
import ModalInserirFuncionario from '@/components/ModalInserirFuncionario';
import ModalAdicionarFuncionarioEntidade from './ModalAdicionarFuncionarioEntidade';
import EditEmployeeModal from '@/components/EditEmployeeModal';
import ImportXlsxModal from './ImportXlsxModal';

// Helper para formatar datas com fallback (centralizado no top do componente)
const formatDate = (value?: string | null) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('pt-BR');
};

interface Funcionario {
  cpf: string;
  nome: string;
  email: string;
  setor: string;
  funcao: string;
  matricula: string | null;
  nivel_cargo: 'operacional' | 'gestao' | null;
  turno: string | null;
  escala: string | null;
  ativo: boolean;
  avaliacoes_concluidas?: number;
  avaliacoes_pendentes?: number;
  ultima_avaliacao?: string | null;
  criado_em?: string;
  // Array com avaliações (presente no endpoint RH)
  avaliacoes?: Array<{
    id: number;
    inicio: string;
    envio: string | null;
    status: string;
    lote_id?: number;
  }>;
  // Campos denormalizados de última avaliação
  ultima_avaliacao_id?: number | null;
  ultimo_lote_id?: number | null;
  ultima_avaliacao_data_conclusao?: string | null;
  ultima_avaliacao_status?: 'concluido' | 'inativada' | null;
  ultimo_motivo_inativacao?: string | null;
  // Data da última avaliação válida (concluída)
  data_ultimo_lote?: string | null;
  // Última data de inativação
  ultima_inativacao_em?: string | null;
  ultima_inativacao_lote?: string | null;
  // Índice do funcionário (sequência de lotes concluídos)
  indice_avaliacao?: number;
  // Campo de elegibilidade - tem avaliação concluída há menos de 12 meses
  tem_avaliacao_recente?: boolean;
}

interface FuncionariosSectionProps {
  /** Tipo de contexto: 'entidade' ou 'clinica' */
  contexto: 'entidade' | 'clinica';
  /** ID da entidade (contratante_id) ou clínica */
  contratanteId?: number;
  /** ID da empresa (para clínica) */
  empresaId?: number;
  /** Nome da empresa (para exibição) */
  empresaNome?: string;
  /** Callback para refresh externo */
  onRefresh?: () => void;
  /** Filtro de status padrão: 'todos', 'ativos', 'inativos' */
  defaultStatusFilter?: 'todos' | 'ativos' | 'inativos';
}

export default function FuncionariosSection({
  contexto,
  contratanteId,
  empresaId,
  empresaNome,
  onRefresh,
  defaultStatusFilter = 'todos',
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
  const [showImportModal, setShowImportModal] = useState(false);
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
  }, [contexto, empresaId, contratanteId]);

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
          f.email.toLowerCase().includes(term) ||
          f.setor.toLowerCase().includes(term) ||
          f.funcao.toLowerCase().includes(term)
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

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, ativo: !currentStatus }),
      });

      if (res.ok) {
        // Atualizar estado local
        setFuncionarios((prev) =>
          prev.map((f) => (f.cpf === cpf ? { ...f, ativo: !currentStatus } : f))
        );
        if (onRefresh) onRefresh();
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
  const handleDesligar = (funcionario: Funcionario) => {
    setFuncionarioSelecionado(funcionario);
    setShowDesligarModal(true);
  };

  // Callbacks de sucesso
  const handleSuccess = () => {
    loadFuncionarios();
    if (onRefresh) onRefresh();
  };

  // Baixar modelo Excel
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/funcionarios/download-template');
      if (!response.ok) {
        throw new Error('Erro ao baixar modelo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'modelo_funcionarios_qwork.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar template:', error);
      alert('Erro ao baixar arquivo modelo. Tente novamente.');
    }
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-blue-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {stats.total}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total de Funcionários</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="text-green-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {stats.ativos}
            </span>
          </div>
          <p className="text-sm text-gray-600">Funcionários Ativos</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <UserX className="text-red-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {stats.inativos}
            </span>
          </div>
          <p className="text-sm text-gray-600">Funcionários Inativos</p>
        </div>
      </div>

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
            <div className="hidden sm:block text-sm text-gray-600 self-center mr-2">
              Importar Múltiplos (XLSX)
            </div>
            {/* Upload (Importar XLSX) - Habilitado para entidade e clínica */}
            <button
              onClick={() => setShowImportModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Download size={20} />
              <span className="text-sm font-medium">📤 Importar XLSX</span>
            </button>

            {/* Import modal */}
            <ImportXlsxModal
              show={showImportModal}
              onClose={() => setShowImportModal(false)}
              onSuccess={() => {
                setShowImportModal(false);
                handleSuccess();
              }}
              contexto={contexto}
              empresaId={empresaId}
            />

            <button
              onClick={() => setShowAddModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">Adicionar</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              <Download size={20} />
              <span className="text-sm font-medium">📋 Baixar Modelo XLSX</span>
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
                  <tr
                    key={funcionario.cpf}
                    className={`hover:bg-gray-50 transition ${
                      !funcionario.ativo ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {funcionario.nome}
                      </div>
                      <div className="text-xs text-gray-500">
                        {funcionario.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {funcionario.cpf}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {funcionario.setor}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {funcionario.funcao}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          funcionario.nivel_cargo === 'gestao'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {funcionario.nivel_cargo === 'gestao'
                          ? 'Gestão'
                          : 'Operacional'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {/* Considere várias fontes para determinar se houve avaliação */}
                      {funcionario.ultimo_lote_id ||
                      funcionario.ultima_avaliacao_status ||
                      funcionario.ultima_avaliacao_data_conclusao ||
                      funcionario.data_ultimo_lote ||
                      (funcionario as any).ultima_avaliacao ||
                      ((funcionario as any).avaliacoes &&
                        (funcionario as any).avaliacoes.some(
                          (a: any) => a.envio || a.inativada_em
                        )) ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {funcionario.ultimo_lote_id || '—'}
                            </span>
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                funcionario.ultima_avaliacao_status ===
                                'concluido'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                              title={
                                funcionario.ultima_avaliacao_status ===
                                  'inativada' &&
                                funcionario.ultimo_motivo_inativacao
                                  ? `Inativada: ${funcionario.ultimo_motivo_inativacao}`
                                  : funcionario.ultima_avaliacao_status ===
                                      'concluido'
                                    ? 'Concluída'
                                    : ''
                              }
                            >
                              {funcionario.ultima_avaliacao_status ===
                              'concluido'
                                ? 'Concluída'
                                : 'Inativada'}
                            </span>
                          </div>

                          {(() => {
                            // Prefer concluded date, else last valid data_ultimo_lote, else inativation date
                            const dateSource =
                              funcionario.ultima_avaliacao_data_conclusao ||
                              funcionario.data_ultimo_lote ||
                              funcionario.ultima_inativacao_em ||
                              (funcionario as any).ultima_avaliacao;
                            const formatted = formatDate(dateSource as any);

                            if (
                              !formatted &&
                              funcionario.ultima_inativacao_em
                            ) {
                              // fallback: show the raw value if formatting failed
                              return (
                                <span className="text-xs text-gray-500">
                                  {funcionario.ultima_inativacao_em}
                                </span>
                              );
                            }

                            return (
                              formatted && (
                                <span className="text-xs text-gray-500">
                                  {formatted}
                                </span>
                              )
                            );
                          })()}

                          {/* If there is no concluded date but there is an inativation, show explicit inativada info */}
                          {!funcionario.ultima_avaliacao_data_conclusao &&
                            funcionario.ultima_inativacao_em && (
                              <div className="mt-1">
                                <span
                                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-800"
                                  title={
                                    funcionario.ultimo_motivo_inativacao
                                      ? `Motivo: ${funcionario.ultimo_motivo_inativacao}`
                                      : ''
                                  }
                                >
                                  Inativada
                                  {funcionario.ultima_inativacao_lote
                                    ? ` (${funcionario.ultima_inativacao_lote})`
                                    : ''}
                                </span>
                              </div>
                            )}

                          {/* Exibir badge de avaliação válida com a data da última avaliação válida (data_ultimo_lote) mesmo quando a última avaliação registrada foi inativada */}
                          {funcionario.tem_avaliacao_recente &&
                            funcionario.data_ultimo_lote && (
                              <div className="mt-1">
                                <span
                                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800"
                                  title="Funcionário possui avaliação concluída há menos de 12 meses - não elegível para nova avaliação"
                                >
                                  ✓ Avaliação válida (
                                  {new Date(
                                    funcionario.data_ultimo_lote
                                  ).toLocaleDateString('pt-BR')}
                                  )
                                </span>
                              </div>
                            )}

                          {/* Se tem avaliação concluída há mais de 12 meses e não tem avaliação válida recente, mostrar aviso de elegibilidade */}
                          {!funcionario.tem_avaliacao_recente &&
                            (funcionario.ultima_avaliacao_status ===
                              'concluido' ||
                              (!funcionario.ultima_avaliacao_data_conclusao &&
                                (funcionario.indice_avaliacao || 0) > 0)) && (
                              <div className="mt-1">
                                <span
                                  className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800"
                                  title="Avaliação concluída há mais de 12 meses - funcionário elegível para nova avaliação"
                                >
                                  ⚠️ Elegível (&gt;12 meses)
                                </span>
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Nunca avaliado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() =>
                          handleToggleStatus(funcionario.cpf, funcionario.ativo)
                        }
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition ${
                          funcionario.ativo
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        title={
                          funcionario.ativo
                            ? 'Clique para inativar'
                            : 'Clique para ativar'
                        }
                      >
                        <Power size={12} />
                        {funcionario.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(funcionario)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Editar funcionário"
                        >
                          <Edit size={16} />
                        </button>
                        {funcionario.ativo && (
                          <button
                            onClick={() => handleDesligar(funcionario)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Desligar funcionário"
                          >
                            <UserX size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}

      {showAddModal && contexto === 'entidade' && (
        <ModalAdicionarFuncionarioEntidade
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showAddModal && contexto === 'clinica' && empresaId && (
        <ModalInserirFuncionario
          empresaId={empresaId}
          empresaNome={empresaNome || ''}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showEditModal && funcionarioSelecionado && (
        <EditEmployeeModal
          funcionario={funcionarioSelecionado}
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

