'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserPlus, X } from 'lucide-react';

interface ModalAdicionarFuncionarioEntidadeProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  cpf: string;
  nome: string;
  data_nascimento: string;
  setor: string;
  funcao: string;
  email: string;
  senha: string;
  matricula: string;
  nivel_cargo: 'operacional' | 'gestao' | '';
  turno: string;
  escala: string;
}

export default function ModalAdicionarFuncionarioEntidade({
  onClose,
  onSuccess,
}: ModalAdicionarFuncionarioEntidadeProps) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    cpf: '',
    nome: '',
    data_nascimento: '',
    setor: '',
    funcao: '',
    email: '',
    senha: '',
    matricula: '',
    nivel_cargo: '',
    turno: '',
    escala: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      setMounted(false);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, loading]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const validateCPF = (cpf: string): boolean => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits.charAt(i)) * (10 - i);
    }
    let firstDigit = 11 - (sum % 11);
    if (firstDigit >= 10) firstDigit = 0;
    if (firstDigit !== parseInt(digits.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits.charAt(i)) * (11 - i);
    }
    let secondDigit = 11 - (sum % 11);
    if (secondDigit >= 10) secondDigit = 0;
    if (secondDigit !== parseInt(digits.charAt(10))) return false;

    return true;
  };

  const validateForm = (): string | null => {
    if (!formData.cpf || !validateCPF(formData.cpf)) {
      return 'CPF inválido';
    }
    if (!formData.nome.trim()) {
      return 'Nome é obrigatório';
    }
    if (!formData.setor.trim()) {
      return 'Setor é obrigatório';
    }
    if (!formData.funcao.trim()) {
      return 'Função é obrigatória';
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      return 'Email válido é obrigatório';
    }
    if (
      !formData.data_nascimento ||
      !/^\d{4}-\d{2}-\d{2}$/.test(formData.data_nascimento)
    ) {
      return 'Data de nascimento é obrigatória e deve estar no formato yyyy-mm-dd';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/entidade/funcionarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cpf: formData.cpf.replace(/\D/g, ''),
          data_nascimento: formData.data_nascimento || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Erro ao adicionar funcionário');
      }
    } catch (err) {
      console.error('Erro ao adicionar funcionário:', err);
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <UserPlus className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">
              Adicionar Funcionário
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CPF */}
            <div>
              <label
                htmlFor="cpf"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                CPF <span className="text-red-600">*</span>
              </label>
              <input
                id="cpf"
                type="text"
                value={formData.cpf}
                onChange={(e) =>
                  handleInputChange('cpf', formatCPF(e.target.value))
                }
                placeholder="000.000.000-00"
                maxLength={14}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Nome */}
            <div>
              <label
                htmlFor="nome"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nome Completo <span className="text-red-600">*</span>
              </label>
              <input
                id="nome"
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                placeholder="João da Silva"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Data de Nascimento */}
            <div>
              <label
                htmlFor="data_nascimento"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Data de Nascimento <span className="text-red-600">*</span>
              </label>
              <input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) =>
                  handleInputChange('data_nascimento', e.target.value)
                }
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Setor */}
            <div>
              <label
                htmlFor="setor"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Setor <span className="text-red-600">*</span>
              </label>
              <input
                id="setor"
                type="text"
                value={formData.setor}
                onChange={(e) => handleInputChange('setor', e.target.value)}
                placeholder="ex: TI, RH, Vendas"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Função */}
            <div>
              <label
                htmlFor="funcao"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Função <span className="text-red-600">*</span>
              </label>
              <input
                id="funcao"
                type="text"
                value={formData.funcao}
                onChange={(e) => handleInputChange('funcao', e.target.value)}
                placeholder="ex: Analista, Gerente"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email <span className="text-red-600">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="funcionario@empresa.com"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Senha - Gerada automaticamente a partir da data de nascimento */}
            <div className="col-span-2">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-700">
                  ℹ️ <strong>Senha automática:</strong> A senha será gerada
                  automaticamente a partir da data de nascimento (formato:
                  DDMMYYYY)
                </p>
              </div>
            </div>

            {/* Matrícula */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matrícula
              </label>
              <input
                type="text"
                value={formData.matricula}
                onChange={(e) => handleInputChange('matricula', e.target.value)}
                placeholder="Opcional"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Nível de Cargo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível de Cargo *
              </label>
              <select
                value={formData.nivel_cargo}
                onChange={(e) =>
                  handleInputChange('nivel_cargo', e.target.value)
                }
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              >
                <option value="">Selecione</option>
                <option value="operacional">Operacional</option>
                <option value="gestao">Gestão</option>
              </select>
            </div>

            {/* Turno */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Turno
              </label>
              <input
                type="text"
                value={formData.turno}
                onChange={(e) => handleInputChange('turno', e.target.value)}
                placeholder="ex: Diurno, Noturno"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>

            {/* Escala */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escala
              </label>
              <input
                type="text"
                value={formData.escala}
                onChange={(e) => handleInputChange('escala', e.target.value)}
                placeholder="ex: 5x2, 6x1"
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Adicionando...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Adicionar Funcionário
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
