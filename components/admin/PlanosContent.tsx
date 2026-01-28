'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X, Save, DollarSign, Check } from 'lucide-react';
import { formatarValor } from '@/lib/validacoes-contratacao';

interface Plano {
  id: number;
  nome: string;
  tipo: 'fixo' | 'personalizado';
  descricao: string;
  preco: number;
  caracteristicas: any; // pode ser array | objeto | json string
  ativo: boolean;
}

interface FormData {
  nome: string;
  tipo: 'fixo' | 'personalizado';
  descricao: string;
  preco: string;
  caracteristicas: string;
  ativo: boolean;
}

export function PlanosContent() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    tipo: 'fixo',
    descricao: '',
    preco: '',
    caracteristicas: '',
    ativo: true,
  });

  // Deleção: estado e controle do modal que coleta senha do admin + motivo
  const [deleteTarget, setDeleteTarget] = useState<Plano | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteMotivo, setDeleteMotivo] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Normaliza 'caracteristicas' para um array de strings
  function caracteristicasToArray(c: any): string[] {
    if (!c) return [];
    if (Array.isArray(c)) return c.map(String);
    if (typeof c === 'string') {
      // tenta parsear JSON se for string JSON
      try {
        const parsed = JSON.parse(c);
        return caracteristicasToArray(parsed);
      } catch {
        return c
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    if (typeof c === 'object') {
      return Object.entries(c).map(([k, v]) =>
        typeof v === 'object'
          ? `${k}: ${JSON.stringify(v)}`
          : `${k}: ${String(v)}`
      );
    }
    return [String(c)];
  }

  async function loadPlanos() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/planos');
      if (response.ok) {
        const data = await response.json();
        setPlanos(data.planos || []);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      nome: '',
      tipo: 'fixo',
      descricao: '',
      preco: '',
      caracteristicas: '',
      ativo: true,
    });
  }

  useEffect(() => {
    loadPlanos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const caracteristicasArray = formData.caracteristicas
        .split('\n')
        .filter((c) => c.trim());

      const payload = {
        nome: formData.nome,
        tipo: formData.tipo,
        descricao: formData.descricao,
        ...(formData.tipo === 'fixo' && { preco: parseFloat(formData.preco) }),
        caracteristicas: caracteristicasArray,
        ativo: formData.ativo,
      };

      const url = editingId
        ? `/api/admin/planos/${editingId}`
        : '/api/admin/planos';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadPlanos();
        closeModal();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar plano');
      }
    } catch (error) {
      console.error('Erro ao salvar plano:', error);
      alert('Erro ao salvar plano');
    }
  };

  const handleEdit = (plano: Plano) => {
    setEditingId(plano.id);
    setFormData({
      nome: plano.nome,
      tipo: plano.tipo,
      descricao: plano.descricao || '',
      preco: plano.preco.toString(),
      caracteristicas:
        caracteristicasToArray(plano.caracteristicas).join('\n') || '',
      ativo: plano.ativo,
    });
    setShowModal(true);
  };

  // Abre modal de confirmação (coleta senha + motivo). Não faz DELETE direto.
  const handleDelete = (id: number) => {
    const p = planos.find((x) => x.id === id) || null;
    setDeleteTarget(p);
    setDeletePassword('');
    setDeleteMotivo('');
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  // Executa o DELETE com corpo contendo admin_password e motivo
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (!deletePassword || deletePassword.trim().length === 0) {
      setDeleteError('Senha do admin é obrigatória');
      return;
    }
    if (!deleteMotivo || deleteMotivo.trim().length === 0) {
      setDeleteError('Motivo é obrigatório');
      return;
    }

    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/planos/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_password: deletePassword,
          motivo: deleteMotivo,
        }),
      });

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        setDeleteError(payload?.error || 'Falha ao excluir plano');
        setDeleteLoading(false);
        return;
      }

      // sucesso
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await loadPlanos();
    } catch (err) {
      console.error('Erro ao deletar plano (client):', err);
      setDeleteError('Erro de rede ao excluir plano');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gerenciamento de Planos
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure os planos disponíveis para contratação
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={20} />
          Novo Plano
        </button>
      </div>

      {/* Lista de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <div
            key={plano.id}
            className={`bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${
              !plano.ativo ? 'opacity-60' : ''
            }`}
          >
            {/* Header do Card */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {plano.nome}
                  </h3>
                  {plano.ativo && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                      Ativo
                    </span>
                  )}
                  {!plano.ativo && (
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full">
                      Inativo
                    </span>
                  )}
                </div>
                <span className="inline-block mt-2 px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                  {plano.tipo === 'fixo' ? 'Fixo' : 'Personalizado'}
                </span>
              </div>
            </div>

            {/* Preço */}
            <div className="mb-4">
              {(() => {
                const precoNum =
                  typeof plano.preco === 'number'
                    ? plano.preco
                    : Number(String(plano.preco || '').replace(',', '.')) || 0;
                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-orange-600">
                        {precoNum > 0 ? formatarValor(precoNum) : null}
                      </span>
                      {precoNum > 0 ? (
                        <span className="text-sm text-gray-500">
                          {plano.tipo === 'fixo'
                            ? '/ ano por funcionário'
                            : '/ mês'}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-orange-600 ml-2">
                          Sob consulta
                        </span>
                      )}
                    </div>

                    {precoNum > 0 && plano.tipo === 'fixo' && (
                      <div className="text-xs text-orange-600 font-medium">
                        Preço anual por funcionário
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Descrição */}
            {plano.descricao && (
              <p className="text-sm text-gray-600 mb-4">{plano.descricao}</p>
            )}

            {/* Características */}
            {(() => {
              const caracs = caracteristicasToArray(plano.caracteristicas);
              if (caracs.length === 0) return null;
              return (
                <div className="mb-4 space-y-2">
                  {caracs.slice(0, 3).map((carac, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <Check
                        size={16}
                        className="text-green-600 mt-0.5 flex-shrink-0"
                      />
                      <span className="text-gray-700">{carac}</span>
                    </div>
                  ))}
                  {caracs.length > 3 && (
                    <p className="text-xs text-gray-500 pl-6">
                      +{caracs.length - 3} características
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Ações */}
            <div className="flex gap-2 pt-4 border-t">
              <button
                onClick={() => handleEdit(plano)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              >
                <Edit2 size={16} />
                Editar
              </button>
              <button
                onClick={() => handleDelete(plano.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
              >
                <Trash2 size={16} />
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {planos.length === 0 && (
        <div className="text-center py-12">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhum plano cadastrado</p>
          <p className="text-sm text-gray-400 mt-2">
            Clique em &quot;Novo Plano&quot; para começar
          </p>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId ? 'Editar Plano' : 'Novo Plano'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Plano *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Plano Básico"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Plano *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo: e.target.value as 'fixo' | 'personalizado',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="fixo">Fixo</option>
                  <option value="personalizado">Personalizado</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Fixo: valor único | Personalizado: valor baseado em quantidade
                </p>
              </div>

              {/* Preço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preço (R$){' '}
                  {formData.tipo === 'fixo'
                    ? '*'
                    : '(não aplicável para personalizado)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco}
                  onChange={(e) =>
                    setFormData({ ...formData, preco: e.target.value })
                  }
                  required={formData.tipo === 'fixo'}
                  disabled={formData.tipo === 'personalizado'}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    formData.tipo === 'personalizado'
                      ? 'bg-gray-100 cursor-not-allowed'
                      : ''
                  }`}
                  placeholder={
                    formData.tipo === 'personalizado' ? 'Não aplicável' : '0.00'
                  }
                />
                {formData.tipo === 'personalizado' && (
                  <p className="text-xs text-gray-500 mt-1">
                    O preço é definido por funcionário durante o processo de
                    contratação
                  </p>
                )}
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Descrição do plano..."
                />
              </div>

              {/* Características */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Características
                </label>
                <textarea
                  value={formData.caracteristicas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      caracteristicas: e.target.value,
                    })
                  }
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Digite uma característica por linha&#10;Ex:&#10;Até 50 funcionários&#10;Relatórios mensais&#10;Suporte por email"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Uma característica por linha
                </p>
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) =>
                    setFormData({ ...formData, ativo: e.target.checked })
                  }
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700">
                  Plano ativo (visível para contratação)
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <Save size={20} />
                  {editingId ? 'Atualizar' : 'Criar'} Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmação de exclusão (coleta senha do admin + motivo) */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Confirmar exclusão</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="fechar-modal-deletar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-700">
                Você está prestes a excluir o plano{' '}
                <strong>{deleteTarget.nome}</strong>. Esta ação será auditada e
                não pode ser desfeita.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha do admin *
                </label>
                <input
                  aria-label="senha-admin"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo *
                </label>
                <textarea
                  aria-label="motivo-delete"
                  rows={3}
                  value={deleteMotivo}
                  onChange={(e) => setDeleteMotivo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  placeholder="Explique o motivo da exclusão"
                />
              </div>

              {deleteError && (
                <div className="text-sm text-red-600">{deleteError}</div>
              )}

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? 'Excluindo...' : 'Confirmar exclusão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
