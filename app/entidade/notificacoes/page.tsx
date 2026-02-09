'use client';

import { useRouter } from 'next/navigation';
import CentroOperacoes from '@/components/CentroOperacoes';

export default function NotificacoesEntidadePage() {
  const router = useRouter();

  const handleNavigate = (url: string) => {
    router.push(url);
  };

  return <CentroOperacoes tipoUsuario="tomador" onNavigate={handleNavigate} />;
}
