'use client';

import { redirect } from 'next/navigation';

export default function EntidadePage() {
  // Redireciona para a página de lotes (padrão)
  redirect('/entidade/lotes');
}
