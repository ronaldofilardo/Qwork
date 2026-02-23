'use client';

import FlowStepsExplainer from '@/components/FlowStepsExplainer';

export default function EntidadeDashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard - Gestão da Empresa
        </h1>
        <p className="text-gray-600">
          Visão geral das avaliações e funcionários
        </p>
      </div>

      <FlowStepsExplainer isClinica={false} />

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Bem-vindo ao Painel de Gestão
        </h2>
        <p className="text-gray-600 mb-4">
          Use o menu lateral para navegar entre as diferentes seções:
        </p>
        <ul className="space-y-2 text-gray-600">
          <li>
            • <strong>Lotes de Avaliação:</strong> Gerencie os lotes de
            avaliações
          </li>
          <li>
            • <strong>Funcionários:</strong> Cadastre e gerencie funcionários
          </li>
          <li>
            • <strong>Informações da Conta:</strong> Gerencie seus dados
            pessoais
          </li>
        </ul>
      </div>
    </div>
  );
}
