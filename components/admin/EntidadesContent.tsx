'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Edit,
  ChevronDown,
  ChevronUp,
  Users,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  User,
  Trash2,
} from 'lucide-react';
import AdminConfirmDeleteModal from '@/components/modals/AdminConfirmDeleteModal';
import ModalCadastroContratante from '@/components/modals/ModalCadastroContratante';

interface Entidade {
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
  responsavel_celular: string;
  criado_em: string;
}

export function EntidadesContent() {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEntidade, setExpandedEntidade] = useState<number | null>(null);
  const [deletingEntidade, setDeletingEntidade] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const [showCadastroModal, setShowCadastroModal] = useState(false);

  const fetchEntidades = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contratantes?tipo=entidade');
      if (res.ok) {
        const data = await res.json();
        setEntidades(data.contratantes || []);
      }
    } catch (error) {
      console.error('Erro ao buscar entidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEntidade = async (
    entidadeId: number,
    payload?: { admin_password: string; motivo?: string }
  ) => {
    if (!payload) {
      alert('Senha do administrador é obrigatória');
      return;
    }

    setDeletingEntidade(entidadeId);
    try {
      const res = await fetch('/api/admin/clinicas/delete-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: payload.admin_password,
          clinicaId: entidadeId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const totais = data.totaisExcluidos;
        alert(
          `Entidade deletada com sucesso!\n\n` +
            `Totais excluídos:\n` +
            `- ${totais.gestores} gestor(es)\n` +
            `- ${totais.empresas} empresa(s)\n` +
            `- ${totais.funcionarios} funcionário(s)\n` +
            `- ${totais.avaliacoes} avaliação(ões)\n\n` +
            `A operação foi registrada no log de auditoria.`
        );
        await fetchEntidades();
      } else {
        alert(data.error || 'Erro ao deletar entidade');
      }
    } catch (error) {
      console.error('Erro ao deletar entidade:', error);
      alert('Erro ao deletar entidade');
    } finally {
      setDeletingEntidade(null);
    }
  };

  useEffect(() => {
    fetchEntidades();
  }, []);

  const toggleExpand = (entidadeId: number) => {
    setExpandedEntidade(expandedEntidade === entidadeId ? null : entidadeId);
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
          Entidades Privadas
        </h2>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
          onClick={() => setShowCadastroModal(true)}
        >
          <Plus className="w-4 h-4" />
          Nova Entidade
        </button>
      </div>

      {entidades.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma entidade cadastrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entidades.map((entidade) => {
            const isExpanded = expandedEntidade === entidade.id;

            return (
              <div
                key={entidade.id}
                className="border border-gray-200 rounded-lg bg-white overflow-hidden"
              >
                {/* Header - Sempre visível */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Building2 className="w-8 h-8 text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {entidade.nome} [ID={entidade.id}]
                        </h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1 truncate">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{entidade.email}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <Phone className="w-4 h-4 flex-shrink-0" />
                            <span>{entidade.telefone}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <Building2 className="w-4 h-4 flex-shrink-0" />
                            <span>CNPJ: {entidade.cnpj}</span>
                          </div>
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {entidade.cidade}/{entidade.estado}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span
                        className={`px-3 py-1 text-xs font-medium rounded-full ${
                          entidade.ativa
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {entidade.ativa ? 'Ativa' : 'Inativa'}
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
                          setDeleteTargetId(entidade.id);
                          setShowDeleteModal(true);
                        }}
                        disabled={deletingEntidade === entidade.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md disabled:opacity-50"
                        title="Deletar entidade definitivamente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExpand(entidade.id)}
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
                    <div className="p-6 space-y-6">
                      {/* Responsável Principal */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <UserCheck className="w-4 h-4" />
                          Responsável Principal
                        </h4>
                        <div className="bg-white rounded-md p-4 border border-gray-200">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Nome:</span>
                              <p className="font-medium text-gray-900">
                                {entidade.responsavel_nome}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">CPF:</span>
                              <p className="font-medium text-gray-900">
                                {entidade.responsavel_cpf}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <p className="font-medium text-gray-900">
                                {entidade.responsavel_email}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Celular:</span>
                              <p className="font-medium text-gray-900">
                                {entidade.responsavel_celular}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Endereço Completo */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Endereço
                        </h4>
                        <div className="bg-white rounded-md p-4 border border-gray-200">
                          <p className="text-sm text-gray-900">
                            {entidade.endereco}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {entidade.cidade}/{entidade.estado}
                          </p>
                        </div>
                      </div>

                      {/* Funcionários Vinculados */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Funcionários Vinculados (0)
                        </h4>
                        <div className="bg-white rounded-md p-4 border border-gray-200">
                          <p className="text-sm text-gray-500 italic">
                            Nenhum funcionário vinculado ainda. Use o vínculo
                            polimórfico para adicionar.
                          </p>
                          <button className="mt-3 inline-flex items-center gap-2 px-3 py-2 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600">
                            <User className="w-4 h-4" />
                            Vincular Funcionário
                          </button>
                        </div>
                      </div>

                      {/* Informações Adicionais */}
                      <div className="text-xs text-gray-500 border-t pt-4">
                        <p>
                          Cadastrada em:{' '}
                          {new Date(entidade.criado_em).toLocaleDateString(
                            'pt-BR'
                          )}
                        </p>
                        <p className="mt-1">
                          Status:{' '}
                          {entidade.status === 'aprovado'
                            ? 'Aprovada'
                            : entidade.status}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de cadastro de nova entidade */}
      <ModalCadastroContratante
        isOpen={showCadastroModal}
        onClose={() => setShowCadastroModal(false)}
        tipo="entidade"
      />

      {/* Modal de confirmação com senha do admin */}
      <AdminConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Deletar Entidade - Confirmação necessária"
        description="Esta ação é irreversível e removerá todos os dados associados à entidade. Insira sua senha de administrador para confirmar."
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }}
        onConfirm={async ({ admin_password, motivo }) => {
          if (!deleteTargetId) return;
          await deleteEntidade(deleteTargetId, { admin_password, motivo });
          setShowDeleteModal(false);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}
