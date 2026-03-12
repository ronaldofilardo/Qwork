'use client';

import { X, Save } from 'lucide-react';
import type { PlanoFormData } from './types';

interface PlanoFormModalProps {
  editingId: number | null;
  formData: PlanoFormData;
  setFormData: (data: PlanoFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function PlanoFormModal({
  editingId,
  formData,
  setFormData,
  onSubmit,
  onClose,
}: PlanoFormModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            {editingId ? 'Editar Plano' : 'Novo Plano'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
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
                setFormData({ ...formData, caracteristicas: e.target.value })
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
              onClick={onClose}
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
  );
}
