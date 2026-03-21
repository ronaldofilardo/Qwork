import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

export default function HomePage() {
  const session = getSession();

  if (!session) {
    redirect('/login');
  }

  // Redirecionamento baseado no perfil da sessão
  switch (session.perfil) {
    case 'gestor':
      redirect('/entidade/dashboard');
      break;
    case 'rh':
      redirect('/rh');
      break;
    case 'admin':
      redirect('/admin');
      break;
    case 'emissor':
      redirect('/emissor');
      break;
    case 'suporte':
      redirect('/suporte');
      break;
    case 'comercial':
      redirect('/comercial');
      break;
    case 'vendedor':
      redirect('/vendedor');
      break;
    default:
      redirect('/dashboard');
  }
}
