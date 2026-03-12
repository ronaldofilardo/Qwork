'use client';

import { Edit2, Trash2, Check } from 'lucide-react';
import { formatarValor } from '@/lib/validacoes-contratacao';
import type { Plano } from './types';
import { caracteristicasToArray } from './types';

interface PlanoCardProps {
  plano: Plano;
  onEdit: (plano: Plano) => void;
  onDelete: (id: number) => void;
}

export function PlanoCard({ plano, onEdit, onDelete }: PlanoCardProps) {
  const caracs = caracteristicasToArray(plano.caracteristicas);
  const precoNum =
    typeof plano.preco === 'number'
      ? plano.preco
      : Number(String(plano.preco || '').replace(',', '.')) || 0;

  return (
    <div
      className={`bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${
        !plano.ativo ? 'opacity-60' : ''
      }`}
    >
      {/* Header do Card */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">{plano.nome}</h3>
            {plano.ativo ? (
              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                Ativo
              </span>
            ) : (
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
        <div className="flex flex-col gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-orange-600">
              {precoNum > 0 ? formatarValor(precoNum) : null}
            </span>
            {precoNum > 0 ? (
              <span className="text-sm text-gray-500">
                {plano.tipo === 'fixo' ? '/ ano por funcionário' : '/ mês'}
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
      </div>

      {/* Descrição */}
      {plano.descricao && (
        <p className="text-sm text-gray-600 mb-4">{plano.descricao}</p>
      )}

      {/* Características */}
      {caracs.length > 0 && (
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
      )}

      {/* Ações */}
      <div className="flex gap-2 pt-4 border-t">
        <button
          onClick={() => onEdit(plano)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
        >
          <Edit2 size={16} />
          Editar
        </button>
        <button
          onClick={() => onDelete(plano.id)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
        >
          <Trash2 size={16} />
          Excluir
        </button>
      </div>
    </div>
  );
}
