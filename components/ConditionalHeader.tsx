'use client'

import { usePathname } from 'next/navigation'
import Header from './Header'

export default function ConditionalHeader() {
  const pathname = usePathname()
  
  // Não renderiza o header nas rotas de login e avaliação
  if (pathname === '/login' || pathname?.startsWith('/avaliacao')) {
    return null
  }
  
  return <Header />
}
