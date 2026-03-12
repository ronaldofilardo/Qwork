'use client';

import { useState } from 'react';
import type { Clinica, ContratoPersonalizadoData } from './types';

interface PlanoPersonalizadoCardProps {
  clinica: Clinica;
  onUpdate: () => void;
  onPlanoDefinido: (data: ContratoPersonalizadoData) => void;
}

export function PlanoPersonalizadoCard({
  clinica,
  onUpdate,
  onPlanoDefinido,
}: PlanoPersonalizadoCardProps) {
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

      onPlanoDefinido({
        contratoId: data.contrato_id,
        tomadorNome: clinica.nome,
        valorPorFuncionario: parseFloat(valor),
        numeroFuncionarios: parseInt(numeroFuncionarios),
        valorTotal: parseFloat(valor) * parseInt(numeroFuncionarios),
      });

      onUpdate();
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
            Responsável: {clinica.responsavel_nome} ({clinica.responsavel_email}
            )
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
