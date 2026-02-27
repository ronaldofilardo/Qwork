'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();

  // Não renderiza o header nas rotas que têm sidebar próprio (layout h-screen)
  // ou que não precisam do header global
  if (
    pathname === '/login' ||
    pathname?.startsWith('/avaliacao') ||
    pathname?.startsWith('/entidade') ||
    pathname?.startsWith('/rh')
  ) {
    return null;
  }

  return <Header />;
}
