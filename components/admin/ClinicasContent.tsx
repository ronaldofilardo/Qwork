'use client';

import { useEffect, useState } from 'react';
import {
  Stethoscope,
  Plus,
  Edit,
  ChevronDown,
  ChevronUp,
  Users,
  Building2,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Trash2,
} from 'lucide-react';
import ModalLinkContratoPersonalizado from '@/components/modals/ModalLinkContratoPersonalizado';
import AdminConfirmDeleteModal from '@/components/modals/AdminConfirmDeleteModal';
import ModalCadastrotomador from '@/components/modals/ModalCadastrotomador';

interface Clinica {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  ativa: boolean;
  status: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_email: string;
  criado_em: string;
  plano_personalizado_pendente?: boolean;
  numero_funcionarios_estimado?: number;
}

interface Gestor {
  cpf: string;
  nome: string;
  email: string;
  ativo: boolean;
  total_empresas_geridas: string;
  is_responsavel?: boolean;
}

interface Empresa {
  id: number;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  ativa: boolean;
  total_funcionarios: number;
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_liberadas: number;
}

export function ClinicasContent() {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClinica, setExpandedClinica] = useState<number | null>(null);
  const [gestoresPorClinica, setGestoresPorClinica] = useState<
    Record<number, Gestor[]>
  >({});
  const [empresasPorClinica, setEmpresasPorClinica] = useState<
    Record<number, Empresa[]>
  >({});
  const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>(
    {}
  );
  const [deletingClinica, setDeletingClinica] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [clinicasPersonalizado, setClinicasPersonalizado] = useState<Clinica[]>(
    []
  );

  const [showLinkContratoModal, setShowLinkContratoModal] = useState(false);
  const [contratoPersonalizadoData, setContratoPersonalizadoData] =
    useState<any>(null);

  const [showCadastroModal, setShowCadastroModal] = useState(false);

  const fetchClinicas = async () => {
    setLoading(true);
    try {
      // Buscar clínicas aprovadas
      const resAprovadas = await fetch('/api/admin/tomadores?tipo=clinica');
      if (resAprovadas.ok) {
        const dataAprovadas = await resAprovadas.json();
        setClinicas(dataAprovadas.tomadores || []);
      }

      // Buscar clínicas com plano personalizado pendente
      const resPersonalizado = await fetch(
        '/api/admin/tomadores?tipo=clinica&plano_personalizado_pendente=true'
      );
      if (resPersonalizado.ok) {
        const dataPersonalizado = await resPersonalizado.json();
        setClinicasPersonalizado(dataPersonalizado.tomadores || []);
      }
    } catch (error) {
      console.error('Erro ao buscar clínicas:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteClinica = async (
    clinicaId: number,
    payload?: { admin_password: string; motivo?: string }
  ) => {
    if (!payload) {
      alert('Senha do administrador é obrigatória');
      return;
    }

    setDeletingClinica(clinicaId);
    try {
      const res = await fetch('/api/admin/clinicas/delete-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: payload.admin_password,
          clinicaId: clinicaId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const totais = data.totaisExcluidos;
        alert(
          `Clínica deletada com sucesso!\n\n` +
            `Totais excluídos:\n` +
            `- ${totais.gestores} gestor(es)\n` +
            `- ${totais.empresas} empresa(s)\n` +
            `- ${totais.funcionarios} funcionário(s)\n` +
            `- ${totais.avaliacoes} avaliação(ões)\n\n` +
            `A operação foi registrada no log de auditoria.`
        );
        await fetchClinicas();
      } else {
        alert(data.error || 'Erro ao deletar clínica');
      }
    } catch (error) {
      console.error('Erro ao deletar clínica:', error);
      alert('Erro ao deletar clínica');
    } finally {
      setDeletingClinica(null);
    }
  };

  useEffect(() => {
    fetchClinicas();
  }, []);

  const fetchGestores = async (clinicaId: number) => {
    setLoadingDetails((prev) => ({ ...prev, [clinicaId]: true }));
    try {
      const res = await fetch(`/api/admin/clinicas/${clinicaId}/gestores`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setGestoresPorClinica((prev) => ({
            ...prev,
            [clinicaId]: data.gestores || [],
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar gestores:', error);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [clinicaId]: false }));
    }
  };

  const fetchEmpresas = async (clinicaId: number) => {
    setLoadingDetails((prev) => ({ ...prev, [clinicaId]: true }));
    try {
      const res = await fetch(`/api/admin/clinicas/${clinicaId}/empresas`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setEmpresasPorClinica((prev) => ({
            ...prev,
            [clinicaId]: data.empresas || [],
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    } finally {
      setLoadingDetails((prev) => ({ ...prev, [clinicaId]: false }));
    }
  };

  const toggleExpand = async (clinicaId: number) => {
    if (expandedClinica === clinicaId) {
      setExpandedClinica(null);
      return;
    }

    setExpandedClinica(clinicaId);

    // Carregar detalhes se ainda não foram carregados
    if (!gestoresPorClinica[clinicaId]) {
      await fetchGestores(clinicaId);
    }
    if (!empresasPorClinica[clinicaId]) {
      await fetchEmpresas(clinicaId);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Componente para gerenciar plano personalizado
  function PlanoPersonalizadoCard({
    clinica,
    onUpdate,
  }: {
    clinica: Clinica;
    onUpdate: () => void;
  }) {
    const [valor, setValor] = useState('');
    const [numeroFuncionarios, setNumeroFuncionarios] = useState(
      clinica.numero_funcionarios_estimado?.toString() || ''
    );
    const [definindo, setDefinindo] = useState(false);
    const [erro, setErro] = useState('');

    const handleDefinirPlano = async () => {
      if (!valor || parseFloat(valor) <= 0) {
        setErro('Valor deve ser maior que zero');
        return;
      }

      if (!numeroFuncionarios || parseInt(numeroFuncionarios) <= 0) {
        setErro('Número de funcionários deve ser maior que zero');
        return;
      }

      setDefinindo(true);
      setErro('');

      try {
        const response = await fetch('/api/admin/tomadores', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: clinica.id,
            plano_personalizado_valor: parseFloat(valor),
            numero_funcionarios_estimado: parseInt(numeroFuncionarios),
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao definir plano');
        }

        const data = await response.json();

        // Abrir modal com link e QR code
        setContratoPersonalizadoData({
          contratoId: data.contrato_id,
          tomadorNome: clinica.nome,
          valorPorFuncionario: parseFloat(valor),
          numeroFuncionarios: parseInt(numeroFuncionarios),
          valorTotal: parseFloat(valor) * parseInt(numeroFuncionarios),
        });
        setShowLinkContratoModal(true);

        onUpdate(); // Recarregar lista
      } catch (error) {
        setErro(error instanceof Error ? error.message : 'Erro desconhecido');
      } finally {
        setDefinindo(false);
      }
    };

    return (
      <div className="border border-orange-300 rounded-lg bg-orange-50 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900">
              {clinica.nome}
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              CNPJ: {clinica.cnpj} • {clinica.cidade}/{clinica.estado}
            </p>
            <p className="text-sm text-gray-600">
              Responsável: {clinica.responsavel_nome} (
              {clinica.responsavel_email})
            </p>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Aguardando Definição
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor por Funcionário (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ex: 150.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Funcionários
            </label>
            <input
              type="number"
              min="1"
              value={numeroFuncionarios}
              onChange={(e) => setNumeroFuncionarios(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              placeholder="Ex: 100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor Total Estimado
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
              R${' '}
              {(
                parseFloat(valor || '0') * parseInt(numeroFuncionarios || '0')
              ).toFixed(2)}
            </div>
          </div>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{erro}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleDefinirPlano}
            disabled={definindo || !valor || !numeroFuncionarios}
            className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {definindo ? 'Definindo...' : 'Definir Plano e Gerar Link'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Clínicas / Serviços de Medicina Ocupacional
        </h2>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          onClick={() => setShowCadastroModal(true)}
        >
          <Plus className="w-4 h-4" />
          Nova Clínica
        </button>
      </div>

      {/* Seção de Planos Personalizados Pendentes */}
      {clinicasPersonalizado.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-orange-600 mb-4">
            📋 Planos Personalizados Pendentes de Definição
          </h3>
          <div className="space-y-4">
            {clinicasPersonalizado.map((clinica) => (
              <PlanoPersonalizadoCard
                key={clinica.id}
                clinica={clinica}
                onUpdate={fetchClinicas}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal Link Contrato Personalizado */}
      {contratoPersonalizadoData && (
        <ModalLinkContratoPersonalizado
          isOpen={showLinkContratoModal}
          onClose={() => {
            setShowLinkContratoModal(false);
            setContratoPersonalizadoData(null);
          }}
          contratoId={contratoPersonalizadoData.contratoId}
          tomadorNome={contratoPersonalizadoData.tomadorNome}
          valorPorFuncionario={contratoPersonalizadoData.valorPorFuncionario}
          numeroFuncionarios={contratoPersonalizadoData.numeroFuncionarios}
          valorTotal={contratoPersonalizadoData.valorTotal}
        />
      )}

      {clinicas.length === 0 ? (
        <div className="text-center py-12">
          <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma clínica cadastrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {clinicas.map((clinica) => {
            const isExpanded = expandedClinica === clinica.id;
            const gestores = gestoresPorClinica[clinica.id] || [];
            const empresas = empresasPorClinica[clinica.id] || [];
            const isLoadingDetails = loadingDetails[clinica.id];

            return (
              <div
                key={clinica.id}
                className="border border-gray-200 rounded-lg bg-white overflow-hidden"
              >
                {/* Header - Sempre visível */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Stethoscope className="w-8 h-8 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {clinica.nome} [ID={clinica.id}]
                        </h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1 truncate">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{clinica.email}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{clinica.telefone}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <Building2 className="w-4 h-4 flex-shrink-0" />
                            <span>CNPJ: {clinica.cnpj}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {clinica.cidade}/{clinica.estado}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          clinica.ativa
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {clinica.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(clinica.id);
                          setShowDeleteModal(true);
                        }}
                        disabled={deletingClinica === clinica.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                        title="Deletar clínica definitivamente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExpand(clinica.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detalhes Expandidos */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {isLoadingDetails ? (
                      <div className="p-6 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="p-6 space-y-6">
                        {/* Responsável Principal */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <UserCheck className="w-4 h-4" />
                            Responsável Principal
                          </h4>
                          <div className="bg-white rounded-md p-4 border border-gray-200">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Nome:</span>
                                <p className="font-medium text-gray-900">
                                  {clinica.responsavel_nome}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">CPF:</span>
                                <p className="font-medium text-gray-900">
                                  {clinica.responsavel_cpf}
                                </p>
                              </div>
                              <div>
                                <span className="text-gray-500">Email:</span>
                                <p className="font-medium text-gray-900">
                                  {clinica.responsavel_email}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Gestores RH */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Gestores RH (
                            {gestores.filter((g) => !g.is_responsavel).length})
                          </h4>
                          {gestores.filter((g) => !g.is_responsavel).length ===
                          0 ? (
                            <p className="text-sm text-gray-500 italic">
                              Nenhum gestor RH adicional
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {gestores
                                .filter((g) => !g.is_responsavel)
                                .map((gestor) => (
                                  <div
                                    key={gestor.cpf}
                                    className="bg-white rounded-md p-4 border border-gray-200"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="grid grid-cols-4 gap-4 text-sm flex-1">
                                        <div>
                                          <span className="text-gray-500">
                                            Nome:
                                          </span>
                                          <p className="font-medium text-gray-900">
                                            {gestor.nome}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">
                                            Login (CPF):
                                          </span>
                                          <p className="font-medium text-gray-900">
                                            {gestor.cpf}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">
                                            Email:
                                          </span>
                                          <p className="font-medium text-gray-900">
                                            {gestor.email}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">
                                            Empresas geridas:
                                          </span>
                                          <p className="font-medium text-gray-900">
                                            {gestor.total_empresas_geridas}
                                          </p>
                                        </div>
                                      </div>
                                      <span
                                        className={`px-2 py-1 text-xs font-medium rounded-full ml-4 ${
                                          gestor.ativo
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                      >
                                        {gestor.ativo ? 'Ativo' : 'Inativo'}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Empresas Clientes */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Empresas Clientes ({empresas.length})
                          </h4>
                          {empresas.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">
                              Nenhuma empresa cliente
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {empresas.map((empresa) => (
                                <div
                                  key={empresa.id}
                                  className="bg-white rounded-md p-4 border border-gray-200"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <h5 className="font-medium text-gray-900">
                                          {empresa.nome} [ID={empresa.id}]
                                        </h5>
                                        <span
                                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            empresa.ativa
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-red-100 text-red-800'
                                          }`}
                                        >
                                          {empresa.ativa ? 'Ativa' : 'Inativa'}
                                        </span>
                                      </div>
                                      <div className="grid grid-cols-4 gap-4 text-sm text-gray-600">
                                        <div>
                                          <span className="text-gray-500">
                                            Funcionários:
                                          </span>
                                          <p className="font-medium text-gray-900">
                                            {empresa.total_funcionarios}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">
                                            Avaliações:
                                          </span>
                                          <p className="font-medium text-gray-900">
                                            {empresa.total_avaliacoes}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">
                                            Concluídas:
                                          </span>
                                          <p className="font-medium text-green-700">
                                            {empresa.avaliacoes_concluidas}
                                          </p>
                                        </div>
                                        <div>
                                          <span className="text-gray-500">
                                            Liberadas:
                                          </span>
                                          <p className="font-medium text-blue-700">
                                            {empresa.avaliacoes_liberadas}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="mt-2 text-xs text-gray-500">
                                        {empresa.cidade && empresa.estado && (
                                          <span>
                                            {empresa.cidade}/{empresa.estado}{' '}
                                            •{' '}
                                          </span>
                                        )}
                                        {empresa.cnpj && (
                                          <span>CNPJ: {empresa.cnpj}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmação com senha do admin */}
      <AdminConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Deletar Clínica - Confirmação necessária"
        description="Esta ação é irreversível e removerá todos os dados associados à clínica. Insira sua senha de administrador para confirmar."
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }}
        onConfirm={async ({ admin_password, motivo }) => {
          if (!deleteTargetId) return;
          await deleteClinica(deleteTargetId, { admin_password, motivo });
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }}
      />

      {/* Modal de cadastro de nova clínica */}
      <ModalCadastrotomador
        isOpen={showCadastroModal}
        onClose={() => setShowCadastroModal(false)}
        tipo="clinica"
      />
    </div>
  );
}
