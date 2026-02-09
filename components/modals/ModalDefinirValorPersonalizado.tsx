'use client';

import { useState } from 'react';
import { X, Calculator, DollarSign } from 'lucide-react';
import { formatarValor } from '@/lib/validacoes-contratacao';

interface tomador {
  id: number;
  tipo: 'clinica' | 'entidade';
  nome: string;
  numero_funcionarios_estimado?: number;
}

interface ModalDefinirValorPersonalizadoProps {
  isOpen: boolean;
  onClose: () => void;
  tomador: tomador | null;
  onConfirm: (valorPorFuncionario: number, numeroFuncionarios?: number) => void;
  loading?: boolean;
}

export default function ModalDefinirValorPersonalizado({
  isOpen,
  onClose,
  tomador,
  onConfirm,
  loading = false,
}: ModalDefinirValorPersonalizadoProps) {
  const [valorPorFuncionario, setValorPorFuncionario] = useState<string>('');
  const [numeroFuncionariosInput, setNumeroFuncionariosInput] =
    useState<string>('');
  const [erro, setErro] = useState<string>('');

  if (!isOpen || !tomador) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    const valor = parseFloat(valorPorFuncionario.replace(',', '.'));
    if (!valor || valor <= 0) {
      setErro('Valor deve ser maior que zero');
      return;
    }

    if (valor > 10000) {
      setErro('Valor muito alto. Máximo: R$ 10.000,00');
      return;
    }

    // Validar número de funcionários - SEMPRE OBRIGATÓRIO
    const numeroFuncionarios = numeroFuncionariosInput
      ? parseInt(numeroFuncionariosInput, 10)
      : tomador.numero_funcionarios_estimado;

    if (!numeroFuncionarios || numeroFuncionarios <= 0) {
      setErro('Número de funcionários é obrigatório e deve ser maior que zero');
      return;
    }

    onConfirm(valor, numeroFuncionarios);
  };

  const valorNumerico = parseFloat(valorPorFuncionario.replace(',', '.')) || 0;
  const numeroFuncionarios = numeroFuncionariosInput
    ? parseInt(numeroFuncionariosInput, 10)
    : tomador.numero_funcionarios_estimado || 1;
  const valorTotal = valorNumerico * numeroFuncionarios;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-orange-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Definir Valor Personalizado
              </h2>
              <p className="text-sm text-gray-600">{tomador.nome}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor por funcionário (R$) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="10000"
                value={valorPorFuncionario}
                onChange={(e) => setValorPorFuncionario(e.target.value)}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de funcionários *
            </label>
            <input
              type="number"
              min="1"
              value={numeroFuncionariosInput}
              onChange={(e) => setNumeroFuncionariosInput(e.target.value)}
              placeholder={
                tomador.numero_funcionarios_estimado
                  ? `Estimado: ${tomador.numero_funcionarios_estimado}`
                  : 'Ex: 50'
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
              required={!tomador.numero_funcionarios_estimado}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {tomador.numero_funcionarios_estimado
                ? 'Deixe vazio para usar o valor estimado no cadastro'
                : 'Informe o número de funcionários para cálculo do valor total'}
            </p>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{erro}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Funcionários estimados:</span>
              <span className="font-medium">{numeroFuncionarios}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Valor unitário:</span>
              <span className="font-medium">
                {formatarValor(valorNumerico)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-semibold">
              <span className="text-gray-800">Valor total anual:</span>
              <span className="text-orange-600">
                {formatarValor(valorTotal)}
              </span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Importante:</strong> Este valor será usado para gerar o
              contrato. O tomador poderá visualizar e aceitar o contrato através
              do link que será gerado.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
              disabled={loading || !valorPorFuncionario.trim()}
            >
              {loading ? 'Processando...' : 'Definir Valor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
