'use client';

import { useEffect, useState } from 'react';
import {
  Stethoscope,
  Plus,
  Edit,
  ChevronDown,
  ChevronUp,
  Building2,
  Mail,
  Phone,
  MapPin,
  Trash2,
} from 'lucide-react';
import AdminConfirmDeleteModal from '@/components/modals/AdminConfirmDeleteModal';
import ModalCadastrotomador from '@/components/modals/ModalCadastrotomador';
import ClinicaDetailsPanel from '@/components/admin/ClinicaDetailsPanel';

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

  const [showCadastroModal, setShowCadastroModal] = useState(false);

  const fetchClinicas = async () => {
    setLoading(true);
    try {
      const resAprovadas = await fetch('/api/admin/tomadores?tipo=clinica');
      if (resAprovadas.ok) {
        const dataAprovadas = await resAprovadas.json();
        setClinicas(dataAprovadas.tomadores || []);
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
                  <ClinicaDetailsPanel
                    clinica={clinica}
                    gestores={gestores}
                    empresas={empresas}
                    isLoading={!!isLoadingDetails}
                  />
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
