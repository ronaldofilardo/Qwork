'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { QWORK_LOGO_BASE64 } from '../lib/config/branding';
import { useOrgInfo } from '@/hooks/useOrgInfo';

interface HeaderProps {
  userName?: string;
  userRole?: 'funcionario' | 'rh' | 'admin' | 'emissor';
  nivelCargo?: 'operacional' | 'gestao';
}

interface Session {
  cpf: string;
  nome: string;
  perfil: 'funcionario' | 'rh' | 'admin' | 'emissor';
  nivelCargo?: 'operacional' | 'gestao';
}

export default function Header({
  userName,
  userRole,
  nivelCargo,
}: HeaderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const perfilAtual = userRole || session?.perfil;
  const { orgInfo } = useOrgInfo(perfilAtual === 'funcionario');

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.cpf) {
          setSession(data);
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
    } catch (error: unknown) {
      console.error('Erro ao buscar sessão:', error);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Sempre busca a sessão se não houver props
    if (!userName || !userRole) {
      fetchSession();
    } else {
      setSession({
        cpf: '',
        nome: userName,
        perfil: userRole,
        nivelCargo: nivelCargo,
      });
      setLoading(false);
    }
  }, [userName, userRole, nivelCargo]);

  const getRoleTitle = (role?: string) => {
    switch (role) {
      case 'emissor':
        return 'Emissor de Laudos';
      case 'admin':
        return 'Administração';
      case 'rh':
        return 'Clínica Qwork';
      case 'funcionario':
        return 'Avaliação Psicossocial';
      default:
        return 'Qwork';
    }
  };

  if (loading) {
    return null;
  }

  // Prioriza props, se não existirem usa session
  const nome = userName || session?.nome;
  const perfil = perfilAtual;

  // Se não há informação de usuário, não renderiza o header
  if (!nome && !perfil) {
    return null;
  }

  return (
    <header
      className="bg-black text-white border-b-4 border-accent sticky top-0 z-[1000] w-full min-h-[60px] sm:min-h-[70px] flex items-center justify-between gap-3 px-3 sm:px-6 lg:px-8 box-border"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* Logo + Título */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <div className="w-8 h-8 sm:w-11 sm:h-11 flex-shrink-0 flex items-center justify-center bg-white rounded-lg p-1">
          <Image
            src={QWORK_LOGO_BASE64}
            alt="QWork Logo"
            width={40}
            height={40}
            className="w-full h-full object-contain rounded"
          />
        </div>
        <div className="min-w-0">
          <div className="font-bold text-lg sm:text-xl leading-tight truncate">
            {getRoleTitle(perfil)}
          </div>
          <div className="text-[9px] sm:text-[11px] text-accent tracking-[0.08em] mt-0.5 hidden xs:block">
            AVALIE. PREVINA. PROTEJA.
          </div>
        </div>
      </div>

      {/* Nome do usuário */}
      {nome && (
        <span className="font-bold text-sm sm:text-base text-accent px-2.5 py-1.5 sm:px-4 sm:py-2 bg-accent/10 rounded-lg ml-2 truncate max-w-[140px] sm:max-w-xs text-right">
          {nome}
        </span>
      )}
      {/* Logo da organização - apenas para funcionários */}
      {perfil === 'funcionario' && orgInfo?.logo_url && (
        <div className="flex-shrink-0 bg-white rounded-lg p-1 ml-2">
          <Image
            src={orgInfo.logo_url}
            alt={orgInfo.nome}
            width={40}
            height={40}
            className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
            unoptimized
          />
        </div>
      )}
    </header>
  );
}
