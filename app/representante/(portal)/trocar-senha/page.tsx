'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';

export default function TrocarSenhaRepresentantePage() {
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const validarSenha = (s: string): string | null => {
    if (s.length < 8) return 'Mínimo 8 caracteres';
    if (!/[A-Z]/.test(s)) return 'Pelo menos uma letra maiúscula';
    if (!/[0-9]/.test(s)) return 'Pelo menos um número';
    return null;
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setErro(null);

    const erroValidacao = validarSenha(novaSenha);
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }
    if (novaSenha !== confirmacao) {
      setErro('A confirmação não confere com a nova senha.');
      return;
    }

    setSalvando(true);
    try {
      const res = await fetch('/api/representante/trocar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senha_atual: senhaAtual,
          nova_senha: novaSenha,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? 'Erro ao trocar senha.');
        return;
      }
      setSucesso(true);
      // window.location.href força reload completo: o layout reinicia carregarSessao()
      // com a sessão fresca (precisa_trocar_senha=false) evitando loop do gate
      setTimeout(() => {
        window.location.href = '/representante/dashboard';
      }, 2000);
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const inputCls =
    'w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-all';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Lock size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold">Criar Nova Senha</h1>
          </div>
          <p className="text-orange-100 text-sm">
            Por segurança, crie uma nova senha para sua conta antes de
            continuar.
          </p>
        </div>

        <div className="px-8 py-6">
          {sucesso ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-green-600" />
              </div>
              <p className="text-sm font-semibold text-gray-900">
                Senha alterada com sucesso!
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Redirecionando para o dashboard…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {erro}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showAtual ? 'text' : 'password'}
                    className={inputCls}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowAtual((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showAtual ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showNova ? 'text' : 'password'}
                    className={inputCls}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNova((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNova ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <ul className="mt-2 space-y-0.5 text-xs text-gray-500">
                  <li className={novaSenha.length >= 8 ? 'text-green-600' : ''}>
                    ↳ Mínimo 8 caracteres
                  </li>
                  <li
                    className={/[A-Z]/.test(novaSenha) ? 'text-green-600' : ''}
                  >
                    ↳ Pelo menos uma letra maiúscula
                  </li>
                  <li
                    className={/[0-9]/.test(novaSenha) ? 'text-green-600' : ''}
                  >
                    ↳ Pelo menos um número
                  </li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={inputCls}
                    value={confirmacao}
                    onChange={(e) => setConfirmacao(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={salvando || !senhaAtual || !novaSenha || !confirmacao}
                className="w-full flex items-center justify-center gap-2 py-3 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors cursor-pointer focus:ring-2 focus:ring-orange-400 focus:outline-none"
              >
                {salvando && <Loader2 size={15} className="animate-spin" />}
                {salvando ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
