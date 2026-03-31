'use client';

import React from 'react';
import { Info, Rocket } from 'lucide-react';
import type { EmpresaShort } from './types';

interface LoteFormProps {
  isEntidade: boolean;
  loading: boolean;
  // empresa selector (rh without pre-defined empresa)
  showEmpresaSelector: boolean;
  empresas: EmpresaShort[];
  empresaIdLocal: number | null;
  onEmpresaChange: (id: number | null, nome: string) => void;
  companyError: string | null;
  // tipo
  tipo: 'completo' | 'operacional' | 'gestao';
  setTipo: (t: 'completo' | 'operacional' | 'gestao') => void;
  // descricao
  descricao: string;
  setDescricao: (v: string) => void;
  // data filtro
  dataFiltro: string;
  setDataFiltro: (v: string) => void;
  // result summary (rh only)
  resultState: any;
  // actions
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function LoteForm({
  isEntidade,
  loading,
  showEmpresaSelector,
  empresas,
  empresaIdLocal,
  onEmpresaChange,
  companyError,
  tipo,
  setTipo,
  descricao,
  setDescricao,
  dataFiltro,
  setDataFiltro,
  resultState,
  onSubmit,
  onClose,
}: LoteFormProps) {
  return (
    <form onSubmit={onSubmit} className="p-6 space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">
              Sistema de Elegibilidade Automática
            </p>
            <p>
              O sistema selecionará automaticamente funcionários elegíveis com
              base em:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
              <li>Funcionários novos (nunca avaliados)</li>
              <li>Índices atrasados (faltou lote anterior)</li>
              <li>Mais de 1 ano sem avaliação válida</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Seletor de empresa */}
      {showEmpresaSelector && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Empresa *
          </label>
          <select
            value={empresaIdLocal || ''}
            onChange={(e) => {
              const id = e.target.value ? parseInt(e.target.value) : null;
              const emp = empresas.find((p) => p.id === id);
              onEmpresaChange(id, emp ? emp.nome : '');
            }}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100"
          >
            <option value="">Selecione uma empresa</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nome}
              </option>
            ))}
          </select>
          {companyError && (
            <p className="text-xs text-red-600 mt-2">{companyError}</p>
          )}
        </div>
      )}

      {isEntidade && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
          <p className="font-medium">Observação</p>
          <p className="mt-1">
            As liberações serão processadas para todas as empresas vinculadas
            aos funcionários da sua entidade. Após a execução, você verá um
            resumo dos resultados por empresa.
          </p>
        </div>
      )}

      {/* Tipo de Lote */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Lote *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: 'completo', label: 'Completo', desc: 'Todos os níveis' },
            {
              value: 'operacional',
              label: 'Operacional',
              desc: 'Nível operacional',
            },
            { value: 'gestao', label: 'Gestão', desc: 'Nível gestão' },
          ].map((option) => (
            <label
              key={option.value}
              className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                tipo === option.value
                  ? 'border-primary bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="tipo"
                value={option.value}
                checked={tipo === option.value}
                onChange={(e) =>
                  setTipo(
                    e.target.value as 'completo' | 'operacional' | 'gestao'
                  )
                }
                className="sr-only"
                disabled={loading}
              />
              <span className="font-medium text-gray-900">{option.label}</span>
              <span className="text-xs text-gray-600 mt-1">{option.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Descrição */}
      <div>
        <label
          htmlFor="descricao"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Descrição (Opcional)
        </label>
        <textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          disabled={loading}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
          placeholder="Adicione informações adicionais sobre este lote..."
        />
      </div>

      {/* Filtro por Data */}
      <div>
        <label
          htmlFor="dataFiltro"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Filtrar por Data de Admissão (Opcional)
        </label>
        <input
          id="dataFiltro"
          type="date"
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
          disabled={loading}
          max={new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 mt-1">
          Incluir apenas funcionários admitidos após esta data
        </p>
      </div>

      {/* Result Summary (RH only) */}
      {!isEntidade && resultState?.resumoInclusao && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-3">
            Resumo da Liberação
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Novos:</span>
              <span className="font-medium">
                {resultState.resumoInclusao.funcionarios_novos}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Atrasados:</span>
              <span className="font-medium">
                {resultState.resumoInclusao.indices_atrasados}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">&gt;1 ano:</span>
              <span className="font-medium">
                {resultState.resumoInclusao.mais_de_1_ano_sem_avaliacao}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Regulares:</span>
              <span className="font-medium">
                {resultState.resumoInclusao.renovacoes_regulares}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 col-span-2">
              <span className="text-gray-900 font-medium">Total:</span>
              <span className="font-bold text-primary">
                {resultState.estatisticas?.avaliacoesCreated || 0}
              </span>
            </div>
          </div>
          {resultState.resumoInclusao.prioridade_critica > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm text-orange-700 font-medium">
                ⚠️ {resultState.resumoInclusao.prioridade_critica}{' '}
                funcionário(s) com prioridade CRÍTICA
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Liberando...</span>
            </>
          ) : (
            <>
              <Rocket size={18} />
              <span>Iniciar Ciclo</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
