'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalInserirFuncionarioProps {
  empresaId: number;
  empresaNome: string;
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

interface ApiResponse {
  success?: boolean;
  error?: string;
}

export default function ModalInserirFuncionario({
  empresaId,
  empresaNome,
  onClose,
  onSuccess,
}: ModalInserirFuncionarioProps) {
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const formatCPF = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    // Aplica máscara
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const validateCPF = (cpf: string): boolean => {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(digits)) return false;

    // Calcula primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(digits[9])) return false;

    // Calcula segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(digits[10])) return false;

    return true;
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    handleInputChange('cpf', formatted.replace(/\D/g, '')); // Armazena apenas dígitos
  };

  const validateForm = (): string | null => {
    const cpfDigits = formData.cpf.replace(/\D/g, '');
    if (!cpfDigits || cpfDigits.length !== 11) {
      return 'CPF deve conter 11 dígitos';
    }
    if (!validateCPF(cpfDigits)) {
      return 'CPF inválido';
    }
    if (!formData.nome.trim()) {
      return 'Nome é obrigatório';
    }
    if (!formData.data_nascimento.trim()) {
      return 'Data de nascimento é obrigatória';
    }
    // Validação simples dd/mm/aaaa ou yyyy-mm-dd (aceita input type=date)
    const dateStr = formData.data_nascimento.trim();
    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/;
    if (!ddmmyyyy.test(dateStr) && !iso.test(dateStr)) {
      return 'Data de nascimento inválida (use dd/mm/aaaa ou selecione a data)';
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          empresa_id: empresaId,
          nivel_cargo: formData.nivel_cargo || null,
          turno: formData.turno || null,
          escala: formData.escala || null,
          matricula: formData.matricula || null,
        }),
      });

      const data: ApiResponse = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        alert('Funcionário criado com sucesso!');
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Erro ao criar funcionário');
      }
    } catch (err: unknown) {
      console.error('Erro ao criar funcionário:', err);
      setError('Erro de conexão');
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
              Inserir Funcionário - {empresaNome}
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
              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF *
                </label>
                <input
                  type="text"
                  value={formatCPF(formData.cpf)}
                  onChange={(e) =>
                    handleCPFChange((e.target as HTMLInputElement).value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  required
                />
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    handleInputChange(
                      'nome',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="João Silva"
                  required
                />
              </div>

              {/* Data de Nascimento */}
              <div>
                <label
                  htmlFor="data_nascimento"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Data de Nascimento *
                </label>
                <input
                  id="data_nascimento"
                  type="date"
                  value={formData.data_nascimento}
                  onChange={(e) =>
                    handleInputChange(
                      'data_nascimento',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="dd/mm/aaaa"
                  required
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
                  onChange={(e) =>
                    handleInputChange(
                      'setor',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Produção"
                  required
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
                  onChange={(e) =>
                    handleInputChange(
                      'funcao',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Operador de Máquinas"
                  required
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
                  onChange={(e) =>
                    handleInputChange(
                      'email',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="joao@empresa.com"
                  required
                />
              </div>

              {/* Senha - Gerada automaticamente a partir da data de nascimento */}
              <div className="col-span-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-700">
                    ℹ️ <strong>Senha automática:</strong> A senha será gerada
                    automaticamente a partir da data de nascimento (formato:
                    DDMMYYYY)
                  </p>
                </div>
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
                    handleInputChange(
                      'matricula',
                      (e.target as HTMLInputElement).value
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="MAT001"
                />
              </div>

              {/* Nível Cargo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nível Cargo *
                </label>
                <select
                  value={formData.nivel_cargo}
                  onChange={(e) =>
                    handleInputChange(
                      'nivel_cargo',
                      (e.target as HTMLSelectElement).value as
                        | 'operacional'
                        | 'gestao'
                        | ''
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
                  onChange={(e) =>
                    handleInputChange(
                      'turno',
                      (e.target as HTMLInputElement).value
                    )
                  }
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
                  onChange={(e) =>
                    handleInputChange(
                      'escala',
                      (e.target as HTMLInputElement).value
                    )
                  }
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
                {loading ? 'Criando...' : 'Criar Funcionário'}
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
