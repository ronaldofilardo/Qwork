'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QworkLogo from '@/components/QworkLogo';
import ModalCadastroContratante from '@/components/modals/ModalCadastroContratante';
import { Building2 } from 'lucide-react';

export default function LoginPage() {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const _router = useRouter();

  const formatarCPF = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    return apenasNumeros.slice(0, 11);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf, senha }),
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Esperar confirmação da sessão antes de redirecionar (garante cookie aplicado)
      const maxRetries = 4;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const s = await fetch('/api/auth/session', {
            credentials: 'same-origin',
            cache: 'no-store',
          });
          if (s.ok) {
            break;
          }
        } catch {
          // ignore and retry
        }
        // pequeno atraso antes da próxima tentativa
        await new Promise((r) => setTimeout(r, 150));
      }

      // Redirecionar baseado no redirectTo da API usando window.location para forçar navegação completa
      const targetUrl = data.redirectTo || '/dashboard';
      console.log(
        '[LOGIN] Redirecionando para:',
        targetUrl,
        'Perfil:',
        data.perfil
      );
      window.location.href = targetUrl;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <QworkLogo size="xl" showSlogan={false} className="mb-4" />
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Avaliação Psicossocial baseada no COPSOQ III
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="cpf"
              className="block text-sm font-medium text-gray-700 required"
            >
              CPF
            </label>
            <input
              id="cpf"
              name="cpf"
              type="text"
              value={cpf}
              onChange={(e) =>
                setCpf(formatarCPF((e.target as HTMLInputElement).value))
              }
              placeholder="00000000000"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base"
              required
              maxLength={11}
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="block text-sm font-medium text-gray-700 required"
            >
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha((e.target as HTMLInputElement).value)}
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base"
              required
            />
          </div>

          {error && (
            <div className="text-danger text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 sm:mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Ou cadastre-se
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setModalAberto(true)}
              className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 border border-orange-300 rounded-md shadow-sm bg-white text-sm font-medium text-orange-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
            >
              <Building2 className="w-5 h-5" />
              <span>Cadastrar Empresa</span>
            </button>
          </div>
        </div>
      </div>

      <ModalCadastroContratante
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />
    </div>
  );
}
