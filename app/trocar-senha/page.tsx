'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Check, X, ShieldCheck } from 'lucide-react';
import QworkLogo from '@/components/QworkLogo';

interface SessionData {
  cpf: string;
  nome: string;
  perfil: string;
}

const SENHA_MIN_LENGTH = 8;

const requisitos = [
  {
    id: 'length',
    label: 'Mínimo de 8 caracteres',
    test: (s: string) => s.length >= SENHA_MIN_LENGTH,
  },
  {
    id: 'upper',
    label: 'Ao menos uma letra maiúscula',
    test: (s: string) => /[A-Z]/.test(s),
  },
  {
    id: 'lower',
    label: 'Ao menos uma letra minúscula',
    test: (s: string) => /[a-z]/.test(s),
  },
  {
    id: 'number',
    label: 'Ao menos um número',
    test: (s: string) => /\d/.test(s),
  },
];

export default function TrocarSenhaPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [mostrarSenhaAtual, setMostrarSenhaAtual] = useState(false);
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);

  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  // Verificar sessão no mount
  useEffect(() => {
    async function verificarSessao() {
      try {
        const res = await fetch('/api/auth/session', {
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();

        if (!data.cpf || !data.perfil) {
          router.push('/login');
          return;
        }

        // Apenas gestor e rh podem acessar esta página
        if (data.perfil !== 'gestor' && data.perfil !== 'rh') {
          const destino =
            data.perfil === 'admin'
              ? '/admin'
              : data.perfil === 'funcionario'
                ? '/dashboard'
                : '/emissor';
          router.push(destino);
          return;
        }

        setSession(data);
      } catch {
        router.push('/login');
      } finally {
        setCarregando(false);
      }
    }

    verificarSessao();
  }, [router]);

  const requisitosAtendidos = requisitos.filter((r) => r.test(novaSenha));
  const senhasConferem =
    novaSenha === confirmarSenha && confirmarSenha.length > 0;
  const formularioValido =
    senhaAtual.length > 0 &&
    requisitosAtendidos.length === requisitos.length &&
    senhasConferem;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formularioValido) return;

    setErro('');
    setEnviando(true);

    try {
      const res = await fetch('/api/auth/trocar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senha_atual: senhaAtual,
          nova_senha: novaSenha,
        }),
        credentials: 'same-origin',
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Erro ao trocar senha');
        return;
      }

      setSucesso(true);

      // Redirecionar após 2s
      setTimeout(() => {
        const destino = session?.perfil === 'gestor' ? '/entidade' : '/rh';
        window.location.href = destino;
      }, 2000);
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600" />
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Senha alterada com sucesso!
          </h2>
          <p className="text-gray-600 mb-4">Redirecionando para o painel...</p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-3 sm:p-6"
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="bg-white rounded-xl shadow-xl p-5 sm:p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <QworkLogo size="xl" showSlogan={false} className="mb-3" />
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            Crie sua nova senha
          </h1>
          <p className="text-sm text-gray-600">
            Por segurança, defina uma senha personalizada para o seu acesso
          </p>
        </div>

        {/* Aviso */}
        <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs sm:text-sm text-amber-800">
            Sua senha atual é provisória (6 últimos dígitos do CNPJ). Crie uma
            senha forte para proteger sua conta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Senha Atual */}
          <div>
            <label
              htmlFor="senha-atual"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Senha Atual (provisória)
            </label>
            <div className="relative">
              <input
                id="senha-atual"
                type={mostrarSenhaAtual ? 'text' : 'password'}
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="6 últimos dígitos do CNPJ"
                className="block w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setMostrarSenhaAtual(!mostrarSenhaAtual)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                tabIndex={-1}
                aria-label={
                  mostrarSenhaAtual ? 'Ocultar senha' : 'Mostrar senha'
                }
              >
                {mostrarSenhaAtual ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Nova Senha */}
          <div>
            <label
              htmlFor="nova-senha"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nova Senha
            </label>
            <div className="relative">
              <input
                id="nova-senha"
                type={mostrarNovaSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="block w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                tabIndex={-1}
                aria-label={
                  mostrarNovaSenha ? 'Ocultar senha' : 'Mostrar senha'
                }
              >
                {mostrarNovaSenha ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Indicadores de requisitos */}
            {novaSenha.length > 0 && (
              <div className="mt-2 space-y-1">
                {requisitos.map((req) => {
                  const atendido = req.test(novaSenha);
                  return (
                    <div
                      key={req.id}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        atendido ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {atendido ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      <span>{req.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <label
              htmlFor="confirmar-senha"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <input
                id="confirmar-senha"
                type={mostrarConfirmar ? 'text' : 'password'}
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                placeholder="Repita a nova senha"
                className={`block w-full px-3 py-3 pr-10 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base ${
                  confirmarSenha.length > 0 && !senhasConferem
                    ? 'border-red-300'
                    : 'border-gray-300'
                }`}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmar(!mostrarConfirmar)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                tabIndex={-1}
                aria-label={
                  mostrarConfirmar ? 'Ocultar senha' : 'Mostrar senha'
                }
              >
                {mostrarConfirmar ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {confirmarSenha.length > 0 && !senhasConferem && (
              <p className="mt-1 text-xs text-red-500">
                As senhas não conferem
              </p>
            )}
          </div>

          {/* Erro */}
          {erro && (
            <div className="text-red-700 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
              {erro}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={!formularioValido || enviando}
            className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            {enviando ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Alterando...
              </span>
            ) : (
              'Definir Minha Senha'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
