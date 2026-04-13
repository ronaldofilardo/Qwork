'use client';

/**
 * /representante/aceitar-contrato
 *
 * Página pública para novo representante aceitar contrato e termos APÓS criar sua senha.
 *
 * Fluxo:
 * 1. Representante cria senha via token → é redirecionado aqui
 * 2. Exibe modal de aceite de contrato + termos
 * 3. Após aceitar, redireciona para /login
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QworkLogo from '@/components/QworkLogo';
import ModalTermosRepresentante from '@/components/modals/ModalTermosRepresentante';

export default function AceitarContratoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [temSessao, setTemSessao] = useState(false);

  // Verificar se o representante tem sessão válida (acabou de criar a senha)
  useEffect(() => {
    const verificarSessao = async () => {
      try {
        const res = await fetch('/api/representante/me', {
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (res.ok) {
          const data = await res.json();
          setTemSessao(!!data.representante);
        } else {
          // Sem sessão válida — redirecionar para criar senha
          setErro(
            'Sessão expirada. Por favor, verifique o link de convite e crie sua senha novamente.'
          );
          setTimeout(() => {
            router.push('/login');
          }, 4000);
        }
      } catch {
        setErro('Erro ao validar acesso. Tente novamente.');
        setTimeout(() => {
          router.push('/login');
        }, 4000);
      } finally {
        setIsLoading(false);
      }
    };

    verificarSessao();
  }, [router]);

  const handleConcluir = () => {
    // Aceites registrados — redirecionar para login (para autenticar novamente)
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <QworkLogo size="lg" />
          <p className="mt-4 text-gray-600 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600 mb-3">
            Acesso Expirado
          </h2>
          <p className="text-gray-600 mb-6">{erro}</p>
          <p className="text-sm text-gray-500">
            Redirecionando para o login em alguns segundos...
          </p>
        </div>
      </div>
    );
  }

  if (!temSessao) {
    return null; // Será redirecionado em useEffect
  }

  return <ModalTermosRepresentante onConcluir={handleConcluir} />;
}
