'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';

interface Funcionario {
  cpf: string;
  nome: string;
  data_nascimento?: string | null;
  setor: string;
  funcao: string;
  email: string;
  matricula: string | null;
  nivel_cargo: 'operacional' | 'gestao' | null;
  turno: string | null;
  escala: string | null;
}

interface EditEmployeeModalProps {
  funcionario: Funcionario;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  nome: string;
  data_nascimento: string;
  setor: string;
  funcao: string;
  email: string;
  matricula: string;
  nivel_cargo: 'operacional' | 'gestao' | '';
  turno: string;
  escala: string;
}

export default function EditEmployeeModal({
  funcionario,
  onClose,
  onSuccess,
}: EditEmployeeModalProps) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    nome: funcionario.nome || '',
    data_nascimento: funcionario.data_nascimento || '',
    setor: funcionario.setor || '',
    funcao: funcionario.funcao || '',
    email: funcionario.email || '',
    matricula: funcionario.matricula || '',
    nivel_cargo: funcionario.nivel_cargo || '',
    turno: funcionario.turno || '',
    escala: funcionario.escala || '',
  });

  useEffect(() => {
    setMounted(true);

    // Prevenir scroll do body
    document.body.style.overflow = 'hidden';

    // Fechar com ESC
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      setMounted(false);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const validateForm = (): string | null => {
    if (!formData.nome.trim()) {
      return 'Nome é obrigatório';
    }
    if (!formData.data_nascimento.trim()) {
      return 'Data de nascimento é obrigatória';
    }
    const dateStr = formData.data_nascimento.trim();
    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (!ddmmyyyy.test(dateStr) && !iso.test(dateStr)) {
      return 'Data de nascimento inválida';
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
      const response = await fetch('/api/rh/funcionarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: funcionario.cpf,
          ...formData,
          nivel_cargo: formData.nivel_cargo || null,
          turno: formData.turno || null,
          escala: formData.escala || null,
          matricula: formData.matricula || null,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Funcionário atualizado com sucesso!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Erro ao atualizar funcionário');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              Editar Funcionário - {funcionario.nome}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CPF (somente leitura) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={funcionario.cpf.replace(
                    /(\d{3})(\d{3})(\d{3})(\d{2})/,
                    '$1.$2.$3-$4'
                  )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">
                  CPF não pode ser alterado
                </p>
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="João Silva"
                />
              </div>

              {/* Data de Nascimento */}
              <div>
                <label
                  htmlFor="edit_data_nascimento"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Data de Nascimento *
                </label>
                <input
                  id="edit_data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) =>
                    handleInputChange('data_nascimento', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="dd/mm/aaaa"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: dd/mm/aaaa
                </p>
              </div>

              {/* Setor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setor *
                </label>
                <input
                  type="text"
                  value={formData.setor}
                  onChange={(e) => handleInputChange('setor', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Produção"
                />
              </div>

              {/* Função */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Função *
                </label>
                <input
                  type="text"
                  value={formData.funcao}
                  onChange={(e) => handleInputChange('funcao', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Operador de Máquinas"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="joao@empresa.com"
                />
              </div>

              {/* Matrícula */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matrícula
                </label>
                <input
                  type="text"
                  value={formData.matricula}
                  onChange={(e) =>
                    handleInputChange('matricula', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="MAT001"
                />
              </div>

              {/* Nível Cargo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nível Cargo
                </label>
                <select
                  value={formData.nivel_cargo}
                  onChange={(e) =>
                    handleInputChange(
                      'nivel_cargo',
                      e.target.value as 'operacional' | 'gestao' | ''
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione...</option>
                  <option value="operacional">Operacional</option>
                  <option value="gestao">Gestão</option>
                </select>
              </div>

              {/* Turno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Turno
                </label>
                <input
                  type="text"
                  value={formData.turno}
                  onChange={(e) => handleInputChange('turno', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Manhã"
                />
              </div>

              {/* Escala */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Escala
                </label>
                <input
                  type="text"
                  value={formData.escala}
                  onChange={(e) => handleInputChange('escala', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="8x40"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Atualizando...' : 'Atualizar Funcionário'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
