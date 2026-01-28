'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserX, X, AlertTriangle } from 'lucide-react';

interface Funcionario {
  cpf: string;
  nome: string;
  email: string;
  setor: string;
  funcao: string;
}

interface DesligarFuncionarioModalProps {
  funcionario: Funcionario;
  contexto: 'entidade' | 'clinica';
  onClose: () => void;
  onSuccess: () => void;
}

export default function DesligarFuncionarioModal({
  funcionario,
  contexto,
  onClose,
  onSuccess,
}: DesligarFuncionarioModalProps) {
  const [mounted, setMounted] = useState(false);
  const [motivo, setMotivo] = useState('');
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

  const validateMotivo = (): boolean => {
    if (motivo.trim().length < 50) {
      setError('O motivo deve ter no mínimo 50 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateMotivo()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Primeiro inativar o funcionário
      const statusUrl =
        contexto === 'entidade'
          ? '/api/entidade/funcionarios/status'
          : '/api/rh/funcionarios/status';

      const statusRes = await fetch(statusUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: funcionario.cpf,
          ativo: false,
        }),
      });

      if (!statusRes.ok) {
        const errorData = await statusRes.json();
        throw new Error(errorData.error || 'Erro ao inativar funcionário');
      }

      // Depois registrar o motivo de desligamento (buscar avaliação mais recente)
      const avaliacoesRes = await fetch(
        `/api/avaliacoes?funcionario_cpf=${funcionario.cpf}&limit=1`
      );

      if (avaliacoesRes.ok) {
        const avaliacoesData = await avaliacoesRes.json();
        const ultimaAvaliacao = avaliacoesData.avaliacoes?.[0];

        if (ultimaAvaliacao) {
          // Inativar a avaliação com motivo
          const inativarRes = await fetch('/api/avaliacoes/inativar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avaliacao_id: ultimaAvaliacao.id,
              motivo_inativacao: motivo.trim(),
            }),
          });

          if (!inativarRes.ok) {
            console.warn(
              'Aviso: não foi possível registrar o motivo na avaliação'
            );
          }
        }
      }

      // Sucesso
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao desligar funcionário:', err);
      setError(err.message || 'Erro ao desligar funcionário');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <UserX className="text-red-600" size={24} />
            <h2 className="text-xl font-bold text-red-900">
              Desligar Funcionário
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Aviso */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertTriangle
              className="text-yellow-600 flex-shrink-0"
              size={20}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1">
                Atenção: Esta ação é irreversível
              </h3>
              <p className="text-sm text-yellow-800">
                O funcionário será <strong>inativado</strong> e não poderá mais
                acessar o sistema. Todas as avaliações pendentes serão
                canceladas.
              </p>
            </div>
          </div>

          {/* Dados do funcionário */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Dados do Funcionário:
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Nome:</span>
                <p className="font-medium text-gray-900">{funcionario.nome}</p>
              </div>
              <div>
                <span className="text-gray-500">CPF:</span>
                <p className="font-medium text-gray-900">{funcionario.cpf}</p>
              </div>
              <div>
                <span className="text-gray-500">Setor:</span>
                <p className="font-medium text-gray-900">{funcionario.setor}</p>
              </div>
              <div>
                <span className="text-gray-500">Função:</span>
                <p className="font-medium text-gray-900">
                  {funcionario.funcao}
                </p>
              </div>
            </div>
          </div>

          {/* Campo de motivo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo do Desligamento <span className="text-red-600">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setError('');
              }}
              placeholder="Descreva o motivo do desligamento (mínimo 50 caracteres)..."
              rows={5}
              maxLength={500}
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition resize-none ${
                error
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-primary'
              } disabled:opacity-50`}
            />
            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-xs ${
                  motivo.trim().length < 50 ? 'text-red-600' : 'text-green-600'
                }`}
              >
                {motivo.trim().length < 50
                  ? `Faltam ${50 - motivo.trim().length} caracteres`
                  : `${motivo.trim().length}/500 caracteres`}
              </span>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || motivo.trim().length < 50}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processando...
                </>
              ) : (
                <>
                  <UserX size={18} />
                  Confirmar Desligamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
