'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { QWORK_LOGO_BASE64 } from '../lib/config/branding';

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
  const perfil = userRole || session?.perfil;

  // Se não há informação de usuário, não renderiza o header
  if (!nome && !perfil) {
    return null;
  }

  return (
    <header
      style={{
        background: '#000000',
        color: 'white',
        borderBottom: '4px solid #9ACD32',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100%',
        minHeight: 70,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
      }}
    >
      {/* Logo + Título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            borderRadius: '8px',
            padding: '4px',
          }}
        >
          <Image
            src={QWORK_LOGO_BASE64}
            alt="QWork Logo"
            width={40}
            height={40}
            style={{
              objectFit: 'contain',
              borderRadius: '4px',
            }}
          />
        </div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 20, letterSpacing: 0.5 }}>
            {getRoleTitle(perfil)}
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#9ACD32',
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            AVALIE. PREVINA. PROTEJA.
          </div>
        </div>
      </div>

      {/* Nome do usuário */}
      {nome && (
        <span
          style={{
            fontWeight: 'bold',
            fontSize: 16,
            color: '#9ACD32',
            padding: '8px 16px',
            background: 'rgba(154, 205, 50, 0.1)',
            borderRadius: '8px',
          }}
        >
          {nome}
        </span>
      )}
    </header>
  );
}
