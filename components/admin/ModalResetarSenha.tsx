'use client';

import React, { useState } from 'react';
import { KeyRound, X, Copy, Check, AlertCircle } from 'lucide-react';

interface ModalResetarSenhaProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ResultadoReset {
  link: string;
  nome: string;
  perfil: string;
  expira_em: string;
}

function formatarCPF(valor: string): string {
  const nums = valor.replace(/\D/g, '').slice(0, 11);
  if (nums.length <= 3) return nums;
  if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
  if (nums.length <= 9)
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
  return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9)}`;
}

const perfilLabels: Record<string, string> = {
  suporte: 'Suporte',
  comercial: 'Comercial',
  rh: 'RH',
  gestor: 'Gestor',
  emissor: 'Emissor de Laudos',
  representante: 'Representante',
};

export function ModalResetarSenha({ isOpen, onClose }: ModalResetarSenhaProps) {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoReset | null>(null);
  const [copiado, setCopiado] = useState(false);

  const handleClose = () => {
    setCpf('');
    setLoading(false);
    setErro(null);
    setResultado(null);
    setCopiado(false);
    onClose();
  };

  const handleChangeCPF = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatarCPF(e.target.value));
    setErro(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setErro('Informe um CPF válido com 11 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/reset-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: cpfLimpo }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResultado({
          link: data.link,
          nome: data.nome,
          perfil: data.perfil,
          expira_em: data.expira_em,
        });
      } else {
        setErro(
          data.error ??
            'Erro ao gerar link. Tente novamente.'
        );
      }
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopiar = async () => {
    if (!resultado) return;
    try {
      await navigator.clipboard.writeText(resultado.link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch {
      // fallback: selecionar texto manualmente
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-semibold text-gray-900">
              Resetar Senha
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {!resultado ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Digite o CPF do usuário (perfil{' '}
                <strong>Suporte, Comercial, RH, Gestor ou Representante</strong>). O
                sistema irá inativar o usuário e gerar um link de reset de senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="cpf-reset"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    CPF do usuário
                  </label>
                  <input
                    id="cpf-reset"
                    type="text"
                    inputMode="numeric"
                    value={cpf}
                    onChange={handleChangeCPF}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    maxLength={14}
                    autoComplete="off"
                    required
                  />
                </div>

                {erro && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{erro}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Gerando...' : 'Gerar Link'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Resultado: exibe o link gerado */
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                <Check className="w-4 h-4 text-green-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-green-800">
                    Link gerado com sucesso
                  </p>
                  <p className="text-xs text-green-700">
                    Usuário{' '}
                    <strong>{resultado.nome}</strong> (
                    {perfilLabels[resultado.perfil] ?? resultado.perfil}) foi{' '}
                    <span className="font-semibold">inativado</span> e aguarda
                    redefinição de senha.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  Link de reset (válido por 7 dias)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={resultado.link}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs bg-gray-50 text-gray-700 truncate focus:outline-none"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={handleCopiar}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
                    title="Copiar link"
                  >
                    {copiado ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                {copiado && (
                  <p className="text-xs text-green-600 mt-1">
                    Link copiado para a área de transferência!
                  </p>
                )}
              </div>

              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                Envie este link diretamente ao usuário. O link expira em 7 dias e
                só pode ser usado uma vez.
              </p>

              <button
                onClick={handleClose}
                className="w-full py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
