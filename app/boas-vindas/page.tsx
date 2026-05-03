'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  Copy,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import QworkLogo from '@/components/QworkLogo';

export default function BoasVindasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tomadorId = searchParams.get('tomador_id');
  const login = searchParams.get('login');
  const senha = searchParams.get('senha');

  const [tempo, setTempo] = useState(10);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [carregando, setCarregando] = useState(true);

  // Validar se tem os parâmetros necessários
  useEffect(() => {
    if (!tomadorId || !login || !senha) {
      router.push('/');
      return;
    }
    setCarregando(false);
  }, [tomadorId, login, senha, router]);

  // Timer para redirecionamento automático
  useEffect(() => {
    if (tempo > 0) {
      const timer = setTimeout(() => setTempo(tempo - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [tempo]);

  const copiarParaClipboard = async (
    texto: string,
    _tipo: 'login' | 'senha'
  ) => {
    try {
      await navigator.clipboard.writeText(texto);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-[100dvh] bg-zinc-50 flex items-center justify-center">
        <div className="text-center">
          <QworkLogo size="lg" />
          <p className="mt-4 text-zinc-600 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-zinc-50 py-6 px-4 flex flex-col">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <QworkLogo size="3xl" />
        </div>

        {/* Card Principal - Estrutura Compacta */}
        <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden shadow-sm flex-1 flex flex-col">
          {/* Success Header */}
          <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded flex items-center justify-center flex-shrink-0">
                <CheckCircle
                  className="w-6 h-6 text-emerald-600"
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
                  Cadastro Concluído
                </h1>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Guarde suas credenciais com segurança.
                </p>
              </div>
            </div>
          </div>

          {/* Conteúdo Principal */}
          <div className="px-6 py-5 flex-1 flex flex-col overflow-y-auto">
            {/* Seção de Credenciais */}
            <div className="mb-5">
              <h2 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-3">
                Credenciais
              </h2>

              {/* Campo Login */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  CPF
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={login || ''}
                    readOnly
                    className="flex-1 px-3 py-2 border border-zinc-300 rounded text-xs font-mono bg-zinc-50"
                  />
                  <button
                    onClick={() => copiarParaClipboard(login || '', 'login')}
                    className="px-3 py-2 bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 transition-colors text-xs"
                  >
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              {/* Campo Senha */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Senha
                </label>
                <div className="flex gap-2">
                  <input
                    type={senhaVisivel ? 'text' : 'password'}
                    value={senha || ''}
                    readOnly
                    className="flex-1 px-3 py-2 border border-zinc-300 rounded text-xs font-mono bg-zinc-50"
                  />
                  <button
                    onClick={() => setSenhaVisivel(!senhaVisivel)}
                    className="px-3 py-2 bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 transition-colors text-xs"
                  >
                    {senhaVisivel ? (
                      <EyeOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                    ) : (
                      <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                  </button>
                  <button
                    onClick={() => copiarParaClipboard(senha || '', 'senha')}
                    className="px-3 py-2 bg-zinc-100 text-zinc-700 rounded hover:bg-zinc-200 transition-colors text-xs"
                  >
                    <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div className="text-xs text-zinc-500 bg-zinc-50 p-2 rounded border border-zinc-200">
                Credenciais aparecerão novamente ao fazer login.
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-200 my-4" />

            {/* Informação Importante */}
            <div className="mb-5">
              <div className="flex items-start gap-2">
                <AlertCircle
                  className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"
                  strokeWidth={1.5}
                />
                <div>
                  <h3 className="font-semibold text-xs text-zinc-900 mb-1">
                    Pagamento
                  </h3>
                  <p className="text-xs text-zinc-600 leading-tight">
                    Sem cobrança agora. Paga-se apenas ao solicitar emissão de
                    laudo, proporcional às avaliações.
                  </p>
                </div>
              </div>
            </div>

            {/* Próximas Ações */}
            <div className="mb-5">
              <h3 className="text-xs font-semibold text-zinc-900 mb-2">
                Próximos Passos
              </h3>
              <ol className="space-y-1 text-xs text-zinc-600">
                <li>1. Guarde credenciais</li>
                <li>2. Acesse quando realizar avaliações</li>
                <li>3. Solicite laudos quando necessário</li>
              </ol>
            </div>

            {/* Timer e Botão */}
            <div className="mt-auto pt-4 border-t border-zinc-200">
              {tempo > 0 ? (
                <div className="text-center mb-3">
                  <p className="text-xs text-zinc-600 mb-1">
                    Redirecionando em {tempo}s
                  </p>
                </div>
              ) : null}
              <button
                onClick={() => router.push('/login')}
                className="w-full px-4 py-3 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" strokeWidth={1.5} />
                Ir para Login
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs text-zinc-600">
            <a
              href="mailto:suporte@qwork.com.br"
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Contato
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
