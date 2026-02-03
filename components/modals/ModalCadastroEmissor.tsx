'use client';

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { validarCPF, validarEmail } from '@/lib/validators';

interface ModalCadastroEmissorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * Modal para cadastro de emissor independente
 * Campos: CPF, Nome, Email
 * Não exibe campos de clínica/empresa (emissor é global)
 */
export function ModalCadastroEmissor({
  isOpen,
  onClose,
  onSuccess,
}: ModalCadastroEmissorProps) {
  const [formData, setFormData] = useState({
    cpf: '',
    nome: '',
    email: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [senhaTemporaria, setSenhaTemporaria] = useState<string | null>(null);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({ cpf: '', nome: '', email: '' });
      setError(null);
      setSenhaTemporaria(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    console.debug('[ModalCadastroEmissor] handleSubmit called');
    e.preventDefault();
    setError(null);
    setSenhaTemporaria(null);

    // Validações client-side
    console.debug('[ModalCadastroEmissor] formData at submit', formData);
    if (!formData.cpf || !formData.nome || !formData.email) {
      console.debug(
        '[ModalCadastroEmissor] setError: Todos os campos são obrigatórios'
      );
      setError('Todos os campos são obrigatórios');
      return;
    }

    const cpfLimpo = formData.cpf.replace(/\D/g, '');
    console.debug('[ModalCadastroEmissor] cpfLimpo:', cpfLimpo);

    if (cpfLimpo.length !== 11) {
      console.debug('[ModalCadastroEmissor] setError: CPF deve ter 11 dígitos');
      setError('CPF deve ter 11 dígitos');
      return;
    }

    if (!validarCPF(cpfLimpo)) {
      console.debug('[ModalCadastroEmissor] setError: CPF inválido');
      setError('CPF inválido');
      return;
    }

    console.debug(
      '[ModalCadastroEmissor] after cpf validation, nome:',
      formData.nome
    );

    console.debug(
      '[ModalCadastroEmissor] validarEmail for',
      formData.email,
      'result:',
      validarEmail(formData.email)
    );
    if (!validarEmail(formData.email)) {
      console.debug('[ModalCadastroEmissor] setError: Email inválido');
      setError('Email inválido');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/emissores/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: cpfLimpo,
          nome: formData.nome.trim(),
          email: formData.email.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSenhaTemporaria(data.senha_temporaria || '123456');
        // Aguardar 3 segundos para mostrar a senha
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      } else {
        if (data?.error === 'MFA_REQUIRED') {
          setError(
            data?.message ||
              'Autenticação de dois fatores requerida. Verifique a MFA do administrador e tente novamente.'
          );
        } else {
          setError(data?.error || 'Erro ao criar emissor');
        }
      }
    } catch (err) {
      console.error('Erro ao criar emissor:', err);
      setError('Erro de comunicação com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData({ ...formData, cpf: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h3 className="text-xl font-semibold text-white">
            Novo Emissor Independente
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:text-orange-100 transition-colors"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mensagem de sucesso */}
          {senhaTemporaria && (
            <div className="bg-green-100 border-4 border-green-500 rounded-lg p-6 flex items-start gap-3 shadow-lg animate-pulse">
              <CheckCircle className="w-6 h-6 text-green-700 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-lg font-bold text-green-900">
                  Emissor criado com sucesso!
                </p>
                <p className="text-base text-green-800 mt-2">
                  <strong>Senha temporária:</strong>{' '}
                  <span className="font-mono text-xl font-black text-red-600 bg-yellow-200 px-2 py-1 rounded border-2 border-red-400 animate-bounce">
                    {senhaTemporaria}
                  </span>
                </p>
                <p className="text-sm text-green-700 mt-2 font-semibold">
                  ⚠️ Anote esta senha! Compartilhe com o emissor para primeiro
                  acesso.
                </p>
              </div>
            </div>
          )}

          {/* Mensagem de erro */}
          {error && !senhaTemporaria && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Informação sobre emissor independente */}
          {!senhaTemporaria && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Emissor Independente:</strong> Não vinculado a nenhuma
                clínica específica. Pode emitir laudos de qualquer lote do
                sistema.
              </p>
            </div>
          )}

          {/* Campo CPF */}
          <div>
            <label
              htmlFor="emissor-cpf"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              id="emissor-cpf"
              type="text"
              value={formData.cpf}
              onChange={handleCPFChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="00000000000"
              maxLength={11}
              disabled={loading || !!senhaTemporaria}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.cpf.length}/11 dígitos
            </p>
          </div>

          {/* Campo Nome */}
          <div>
            <label
              htmlFor="emissor-nome"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              id="emissor-nome"
              type="text"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Nome do emissor"
              disabled={loading || !!senhaTemporaria}
            />
          </div>

          {/* Campo Email */}
          <div>
            <label
              htmlFor="emissor-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="emissor-email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="emissor@email.com"
              disabled={loading || !!senhaTemporaria}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {senhaTemporaria ? 'Fechar' : 'Cancelar'}
            </button>
            {!senhaTemporaria && (
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Criando...
                  </>
                ) : (
                  'Criar Emissor'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
