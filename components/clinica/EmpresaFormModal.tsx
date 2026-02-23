'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, User, Loader2 } from 'lucide-react';
import { normalizeCNPJ, validarCNPJ } from '@/lib/validators';

interface EmpresaFormData {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  representante_nome: string;
  representante_fone: string;
  representante_email: string;
}

interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  email?: string;
  ativa: boolean;
  criado_em: string;
  representante_nome: string;
  representante_fone: string;
  representante_email: string;
}

interface EmpresaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (novaEmpresa: Empresa) => void;
}

const initialFormState: EmpresaFormData = {
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  representante_nome: '',
  representante_fone: '',
  representante_email: '',
};

export default function EmpresaFormModal({
  isOpen,
  onClose,
  onSuccess,
}: EmpresaFormModalProps) {
  const [formData, setFormData] = useState<EmpresaFormData>(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (field: keyof EmpresaFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCNPJChange = (value: string) => {
    // Máscara automática para CNPJ
    const numericValue = value.replace(/\D/g, '');
    let formatted = numericValue;

    if (numericValue.length <= 14) {
      formatted = numericValue
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    handleChange('cnpj', formatted);
  };

  const handleTelefoneChange = (
    field: 'telefone' | 'representante_fone',
    value: string
  ) => {
    // Máscara automática para telefone brasileiro
    const numericValue = value.replace(/\D/g, '');
    let formatted = numericValue;

    if (numericValue.length <= 11) {
      formatted = numericValue
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }

    handleChange(field, formatted);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações da empresa
    if (!formData.nome.trim() || formData.nome.trim().length < 3) {
      newErrors.nome = 'Nome deve ter no mínimo 3 caracteres';
    }

    const cnpjNorm = normalizeCNPJ(formData.cnpj);
    if (!cnpjNorm) {
      newErrors.cnpj = 'CNPJ é obrigatório';
    } else if (!validarCNPJ(cnpjNorm)) {
      newErrors.cnpj = 'CNPJ inválido';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email da empresa inválido';
    }

    // Validações do representante
    if (
      !formData.representante_nome.trim() ||
      formData.representante_nome.trim().length < 3
    ) {
      newErrors.representante_nome = 'Nome do representante é obrigatório';
    } else {
      const nomes = formData.representante_nome.trim().split(/\s+/);
      if (nomes.length < 2) {
        newErrors.representante_nome = 'Deve conter nome e sobrenome';
      }
    }

    if (
      !formData.representante_fone.trim() ||
      formData.representante_fone.replace(/\D/g, '').length < 10
    ) {
      newErrors.representante_fone = 'Telefone do representante é obrigatório';
    }

    if (
      !formData.representante_email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.representante_email)
    ) {
      newErrors.representante_email =
        'Email do representante é obrigatório e deve ser válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/rh/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const novaEmpresa = await response.json();
        onSuccess(novaEmpresa);
        setFormData(initialFormState);
        setErrors({});
        onClose();
      } else {
        const errorData = await response.json();

        if (response.status === 409) {
          setErrors({ cnpj: 'CNPJ já cadastrado no sistema' });
        } else if (response.status === 403) {
          setErrors({ _form: 'Você não tem permissão para esta ação.' });
        } else if (response.status === 400) {
          setErrors({ _form: errorData.error || 'Dados inválidos.' });
        } else {
          setErrors({ _form: 'Erro interno. Tente novamente mais tarde.' });
        }
      }
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      setErrors({ _form: 'Erro ao conectar com o servidor.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData(initialFormState);
      setErrors({});
      onClose();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 size={24} className="text-primary-500" />
            Nova Empresa Cliente
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Erro geral */}
          {errors._form && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {errors._form}
            </div>
          )}

          {/* Seção: Dados do Representante */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User size={18} />
              Dados do Representante
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Representante <span className="text-red-500">*</span>
                </label>
                <input
                  data-testid="representante-nome"
                  type="text"
                  value={formData.representante_nome}
                  onChange={(e) =>
                    handleChange('representante_nome', e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.representante_nome
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Ex: João Silva Santos"
                  disabled={loading}
                />
                {errors.representante_nome && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.representante_nome}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone <span className="text-red-500">*</span>
                </label>
                <input
                  data-testid="representante-fone"
                  type="text"
                  value={formData.representante_fone}
                  onChange={(e) =>
                    handleTelefoneChange('representante_fone', e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.representante_fone
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  disabled={loading}
                />
                {errors.representante_fone && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.representante_fone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  data-testid="representante-email"
                  type="email"
                  value={formData.representante_email}
                  onChange={(e) =>
                    handleChange('representante_email', e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.representante_email
                      ? 'border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="joao.silva@empresa.com"
                  disabled={loading}
                />
                {errors.representante_email && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.representante_email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Seção: Dados da Empresa */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 size={18} />
              Dados da Empresa
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  data-testid="empresa-nome"
                  type="text"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.nome ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Empresa XYZ Ltda"
                  disabled={loading}
                />
                {errors.nome && (
                  <p className="mt-1 text-xs text-red-500">{errors.nome}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={(e) => handleCNPJChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.cnpj ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  disabled={loading}
                />
                {errors.cnpj && (
                  <p className="mt-1 text-xs text-red-500">{errors.cnpj}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email da Empresa
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="contato@empresa.com"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  value={formData.telefone}
                  onChange={(e) =>
                    handleTelefoneChange('telefone', e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => handleChange('endereco', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Rua, número, complemento"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => handleChange('cidade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: São Paulo"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    UF
                  </label>
                  <input
                    type="text"
                    value={formData.estado}
                    onChange={(e) =>
                      handleChange('estado', e.target.value.toUpperCase())
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="SP"
                    maxLength={2}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => handleChange('cep', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="00000-000"
                    maxLength={9}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Botões (sticky para garantir visibilidade) */}
          <div className="sticky bottom-0 bg-white z-20 py-4 px-6 flex justify-end gap-3 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Salvando...' : 'Salvar Empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(
    modalContent,
    document.getElementById('modal-root') || document.body
  );
}
