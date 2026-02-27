'use client';

import { AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';

const PendenciasSection = dynamic(
  () => import('@/components/pendencias/PendenciasSection'),
  { ssr: false }
);

export default function EntidadePendenciasPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          Pendências
        </h1>
        <p className="text-gray-600 mt-1">
          Funcionários sem avaliação concluída em nenhum ciclo avaliativo
          liberado.
        </p>
      </div>
      {/* Gestor: sem empresa_id — API detect entidade_id from session */}
      <PendenciasSection />
    </div>
  );
}
