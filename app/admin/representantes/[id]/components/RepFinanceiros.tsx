'use client';

import type { RepProfile } from '../types';
import { fmtMoney } from '../constants';

interface RepFinanceirosProps {
  rep: RepProfile;
  editandoComissao: boolean;
  setEditandoComissao: (v: boolean) => void;
  percentualInput: string;
  setPercentualInput: (v: string) => void;
  salvandoPercentual: boolean;
  onSalvarPercentual: () => Promise<void>;
}

export function RepFinanceiros({
  rep,
  editandoComissao,
  setEditandoComissao,
  percentualInput,
  setPercentualInput,
  salvandoPercentual,
  onSalvarPercentual,
}: RepFinanceirosProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Card Comissão % */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium uppercase text-gray-500 tracking-wide">
            Comissão (%)
          </p>
          {!editandoComissao && (
            <button
              onClick={() => {
                setEditandoComissao(true);
                setPercentualInput(rep.percentual_comissao ?? '');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              {rep.percentual_comissao ? 'Editar' : 'Definir'}
            </button>
          )}
        </div>
        {editandoComissao ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentualInput}
                onChange={(e) => setPercentualInput(e.target.value)}
                className="w-24 px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                autoFocus
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            <div className="flex gap-1.5">
              <button
                disabled={salvandoPercentual}
                onClick={onSalvarPercentual}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {salvandoPercentual ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => {
                  setEditandoComissao(false);
                  setPercentualInput('');
                }}
                className="px-3 py-1 border text-xs rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {rep.percentual_comissao ? (
              <p className="text-xl font-bold text-blue-700 mt-1">
                {parseFloat(rep.percentual_comissao).toFixed(2)}%
              </p>
            ) : (
              <p className="text-sm text-orange-600 font-medium mt-1">
                ⚠️ Não definido
              </p>
            )}
            <span className="text-3xl">📊</span>
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500 tracking-wide">
            Total Pago em Comissões
          </p>
          <p className="text-xl font-bold text-green-700 mt-1">
            {fmtMoney(rep.valor_total_pago)}
          </p>
        </div>
        <span className="text-3xl">💰</span>
      </div>
      <div className="bg-white rounded-xl border p-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase text-gray-500 tracking-wide">
            Comissões Pendentes
          </p>
          <p className="text-xl font-bold text-yellow-700 mt-1">
            {fmtMoney(rep.valor_pendente)}
          </p>
        </div>
        <span className="text-3xl">⏳</span>
      </div>
    </div>
  );
}
