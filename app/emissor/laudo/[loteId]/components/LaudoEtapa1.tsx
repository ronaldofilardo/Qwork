'use client';

import type { LaudoPadronizado } from '@/lib/laudo-tipos';

interface LaudoEtapa1Props {
  etapa1: LaudoPadronizado['etapa1'];
}

export default function LaudoEtapa1({ etapa1 }: LaudoEtapa1Props) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900 mb-3 pb-1 border-b-2 border-gray-600">
        1. DADOS GERAIS DA EMPRESA AVALIADA
      </h2>
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex flex-wrap items-baseline">
          <span className="text-xs font-medium text-gray-500 mr-2">
            Empresa Avaliada:
          </span>
          <span className="text-sm font-semibold text-gray-900">
            {etapa1.empresaAvaliada}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline">
          <span className="text-xs font-medium text-gray-500 mr-2">CNPJ:</span>
          <span className="text-sm text-gray-900">{etapa1.cnpj}</span>
        </div>
        <div className="flex flex-wrap items-baseline">
          <span className="text-xs font-medium text-gray-500 mr-2">
            Período das Avaliações Consideradas:
          </span>
          <span className="text-sm text-gray-900">
            {etapa1.periodoAvaliacoes.dataLiberacao} a{' '}
            {etapa1.periodoAvaliacoes.dataUltimaConclusao}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline">
          <span className="text-xs font-medium text-gray-500 mr-2">
            Total de Funcionários Avaliados:
          </span>
          <span className="text-sm text-gray-900">
            {etapa1.totalFuncionariosAvaliados}
          </span>
        </div>
        <div className="flex flex-wrap items-baseline">
          <span className="text-xs font-medium text-gray-500 mr-2">
            Amostra:
          </span>
          <span className="text-sm text-gray-900">
            {etapa1.amostra.operacional} funcionários do nível{' '}
            <span className="font-semibold">Operacional</span> +{' '}
            {etapa1.amostra.gestao} do nível{' '}
            <span className="font-semibold">Gestão</span>
          </span>
        </div>
      </div>
    </div>
  );
}
