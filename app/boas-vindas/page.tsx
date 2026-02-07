'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Copy, Eye, EyeOff, LogIn } from 'lucide-react';
import QworkLogo from '@/components/QworkLogo';

export default function BoasVindasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const tomadorId = searchParams.get('tomador_id');
  const login = searchParams.get('login');
  const senha = searchParams.get('senha');

  const [tempo, setTempo] = useState(10);
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [copiado, setCopiado] = useState<'login' | 'senha' | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Validar se tem os parâmetros necessários
  useEffect(() => {
    if (!tomadorId || !login || !senha) {
      router.push('/');
      return;
    }
    setCarregando(false);
  }, [tomadorId, login, senha, router]);

  // Timer para piscança e redirecionamento automático
  useEffect(() => {
    if (tempo > 0) {
      const timer = setTimeout(() => setTempo(tempo - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [tempo]);

  const copiarParaClipboard = async (texto: string, tipo: 'login' | 'senha') => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(tipo);
      setTimeout(() => setCopiado(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
        <div className="text-center">
          <QworkLogo size="lg" />
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Cabeçalho com Logo */}
        <div className="text-center mb-12">
          <QworkLogo size="lg" />
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Sucesso Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Check className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white text-center">
              Parabéns!
            </h1>
            <p className="text-green-100 text-center mt-2">
              Seu cadastro foi concluído com sucesso
            </p>
          </div>

          {/* Conteúdo Principal */}
          <div className="px-8 py-12">
            {/* Seção de Credenciais */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Suas Credenciais de Acesso
              </h2>

              {/* Campo Login (CPF) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF (Usuário)
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={login || ''}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 font-mono text-lg"
                    />
                  </div>
                  <button
                    onClick={() => copiarParaClipboard(login || '', 'login')}
                    className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    <span className="hidden sm:inline">
                      {copiado === 'login' ? 'Copiado!' : 'Copiar'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Campo Senha */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={senhaVisivel ? 'text' : 'password'}
                      value={senha || ''}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-50 font-mono text-lg"
                    />
                  </div>
                  <button
                    onClick={() => setSenhaVisivel(!senhaVisivel)}
                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                  >
                    {senhaVisivel ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => copiarParaClipboard(senha || '', 'senha')}
                    className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    <span className="hidden sm:inline">
                      {copiado === 'senha' ? 'Copiado!' : 'Copiar'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Aviso de Piscança */}
              {tempo > 0 && (
                <div
                  className={`text-sm text-center transition-opacity mb-4 ${
                    tempo % 2 === 0 ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  ⚠️ Estas credenciais aparecerão novamente ao fazer login
                </div>
              )}
            </div>

            {/* Informação Importante */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded">
              <h3 className="font-bold text-blue-900 mb-2">
                ℹ️ Informação Importante sobre Cobrança
              </h3>
              <p className="text-blue-800 text-sm">
                Você <strong>não pagará agora</strong>. O pagamento será solicitado apenas quando você ou sua equipe solicitarem a emissão de um laudo. A cobrança será proporcional ao número de avaliações concluídas naquele momento.
              </p>
            </div>

            {/* Timer e Próximas Ações */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <p className="text-center text-gray-600 mb-4">
                Próximas ações:
              </p>
              <ol className="space-y-2 text-sm text-gray-700 mb-6">
                <li className="flex gap-3">
                  <span className="font-bold text-orange-500 flex-shrink-0">1.</span>
                  <span>Guarde suas credenciais com segurança</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-500 flex-shrink-0">2.</span>
                  <span>Acesse o sistema quando realizar avaliações</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-orange-500 flex-shrink-0">3.</span>
                  <span>Solicite a emissão de laudos quando necessário</span>
                </li>
              </ol>

              {/* Timer */}
              {tempo > 0 ? (
                <div className="text-center">
                  <p className="text-gray-600 text-sm mb-2">
                    Redirecionando para login em:
                  </p>
                  <div className="text-4xl font-bold text-orange-600">
                    {tempo}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-bold flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Ir para Login Agora
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Suporte */}
        <div className="text-center mt-8">
          <p className="text-gray-600 text-sm">
            Dúvidas? Entre em contato{' '}
            <a href="mailto:suporte@qwork.com.br" className="text-orange-500 hover:underline">
              conosco
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
