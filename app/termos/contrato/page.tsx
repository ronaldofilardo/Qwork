import React from 'react';
import ContratoPadrao from '@/components/terms/ContratoPadrao';

export const metadata = {
  title: 'Contrato — QWork',
  description: 'Contrato de Prestação de Serviços Digitais — Plataforma QWork',
};

export default function TermosContratoPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-10">
        <ContratoPadrao />
      </div>
    </main>
  );
}
