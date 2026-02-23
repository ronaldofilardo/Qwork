'use client';

import { useState } from 'react';

interface FlowStep {
  label: string;
  tooltip: string;
}

interface FlowStepsExplainerProps {
  isClinica?: boolean;
}

const flowSteps: FlowStep[] = [
  {
    label: 'Inserção de Funcionário',
    tooltip:
      'Cadastre os funcionários que serão avaliados na plataforma. Informações como nome, CPF, cargo e dados de contato são registrados nesta etapa.',
  },
  {
    label: 'Liberação de Lotes',
    tooltip:
      'Libere lotes de avaliação para que os funcionários faça o acesso e completem às avaliações psicossociais.',
  },
  {
    label: 'Avaliações',
    tooltip:
      'Os funcionários respondem ao questionário de avaliação psicossocial. Após a conclusão, poderá solicitar a emissão do laudo.',
  },
  {
    label: 'Solicitação de Emissão de Laudo',
    tooltip:
      'Você solicita a emissão do laudo à plataforma após as avaliações serem respondidas. Em seguida negocia o valor diretamente com a plataforma.',
  },
  {
    label: 'Recebimento do Link para Pagamento',
    tooltip:
      'Logo receberá um link para pagamento via WhatsApp ou e-mail cadastrado. Assim que a plataforma identificar o pagamento, o laudo será emitido automaticamente.',
  },
  {
    label: 'Emissão e Recebimento do Laudo',
    tooltip:
      'O laudo final em PDF é gerado e disponibilizado. Você poderá fazer o download ou compartilhá-lo com as empresa cliente [no caso de medicina ocupacional] e ser incluído no PGR.',
  },
];

export default function FlowStepsExplainer({
  isClinica = false,
}: FlowStepsExplainerProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200 mb-8">
      <h2 className="text-lg font-semibold text-blue-900 mb-4">
        📋 Entenda o Fluxo Completo
      </h2>

      {/* Flow Steps com Tooltips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {flowSteps.map((step, index) => (
          <div key={index} className="relative">
            {/* Step Button */}
            <button
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="px-3 py-2 bg-white rounded-md border border-blue-300 text-blue-900 text-sm font-medium hover:bg-blue-100 transition-colors cursor-help relative"
              type="button"
            >
              {step.label}
            </button>

            {/* Tooltip */}
            {hoveredIndex === index && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
                <div className="bg-gray-900 text-white text-sm rounded-md p-4 w-56 shadow-lg leading-relaxed">
                  {step.tooltip}
                  {/* Seta de tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}

            {/* Arrow separator */}
            {index < flowSteps.length - 1 && (
              <span className="ml-2 text-blue-400 font-bold">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Aviso específico para clínicas */}
      {isClinica && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>💡 Importante:</strong> O laudo é cobrado por lote de cada
            empresa. Cada lote liberado resultará em uma solicitação de emissão
            com seu valor específico.
          </p>
        </div>
      )}
    </div>
  );
}
