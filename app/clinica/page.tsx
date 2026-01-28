'use client';

import { redirect } from 'next/navigation';

export default function ClinicaAliasPage() {
  // Redireciona /clinica para /rh/empresas (mantém compatibilidade)
  redirect('/rh/empresas');
}
