'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePlanosStore, Plano } from '@/lib/stores/planosStore';

export default function PlanosManager() {
  const { planos, setPlanos, loading, setLoading, error, setError } =
    usePlanosStore();
  const [_showModal, _setShowModal] = useState(false);
  const [_editingPlano, _setEditingPlano] = useState<Plano | null>(null);

  const loadPlanos = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/financeiro/planos');
      if (!response.ok) throw new Error('Erro ao carregar planos');
      const data = await response.json();
      setPlanos(data.planos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [setPlanos, setLoading, setError]);

  useEffect(() => {
    loadPlanos();
  }, [loadPlanos]);

  const handleEdit = (plano: Plano) => {
    _setEditingPlano(plano);
    _setShowModal(true);
  };

  const handleCreate = () => {
    _setEditingPlano(null);
    _setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando planos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Erro: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gerenciar Planos</h2>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Novo Plano Personalizado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <div
            key={plano.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {plano.nome}
                </h3>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded mt-2 ${
                    plano.tipo === 'personalizado'
                      ? 'bg-purple-100 text-purple-800'
                      : plano.tipo === 'premium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {plano.tipo.charAt(0).toUpperCase() + plano.tipo.slice(1)}
                </span>
              </div>
              {plano.tipo === 'personalizado' && (
                <button
                  onClick={() => handleEdit(plano)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
            </div>

            {plano.descricao && (
              <p className="text-sm text-gray-600 mb-4">{plano.descricao}</p>
            )}

            <div className="space-y-2 border-t border-gray-100 pt-4">
              {plano.valor_fixo_anual && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor Anual:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    R$ {plano.valor_fixo_anual.toFixed(2)}
                  </span>
                </div>
              )}
              {plano.valor_por_funcionario && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Por Funcionário:
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    R$ {plano.valor_por_funcionario.toFixed(2)}
                  </span>
                </div>
              )}
              {plano.limite_funcionarios && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Limite:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {plano.limite_funcionarios} funcionários
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <span
                className={`inline-block px-2 py-1 text-xs rounded ${
                  plano.ativo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {plano.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {planos.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhum plano cadastrado</p>
        </div>
      )}
    </div>
  );
}
