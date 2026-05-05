'use client';

import { useState } from 'react';

interface InstructionStep {
  label: string;
  tooltip: string;
  badge?: string;
}

interface PagamentosFlowGuideProps {
  section: 'aguardando_cobranca' | 'aguardando_pagamento';
}

const flowInstructions = {
  aguardando_cobranca: [
    {
      label: '1. Analisar Solicitação',
      tooltip:
        'Abra o card da solicitação para verificar os dados do lote: quantidade de avaliações, tomador/clínica, representante vinculado e histórico. Confirme se todos os dados estão corretos antes de prosseguir.',
    },
    {
      label: '2. Definir Valor',
      tooltip:
        'Insira o valor total da cobrança no campo correspondente e clique em "Definir Valor". O valor deve considerar a quantidade de avaliações liberadas e a tabela de preços do tomador ou clínica.',
    },
    {
      label: '3. Gerar Link',
      tooltip:
        'Após definir o valor, clique em "Gerar Link" para criar o link de pagamento no Asaas. O link será associado ao lote e ficará disponível para envio ao tomador/clínica.',
      badge: '💡',
    },
    {
      label: '4. Disponibilizar',
      tooltip:
        'Clique em "Disponibilizar" para liberar o link de pagamento ao tomador ou clínica. O link será exibido para que o responsável possa efetuar o pagamento e o lote avançar para emissão.',
    },
  ] as InstructionStep[],
  aguardando_pagamento: [
    {
      label: '1. Monitorar Status',
      tooltip:
        'Acompanhe os lotes aguardando confirmação de pagamento. Verifique a data de vencimento do link e o valor cobrado. Lotes próximos ao vencimento devem ser priorizados.',
    },
    {
      label: '2. Verificar no Asaas',
      tooltip:
        'Clique em "Verificar Pagamento" para consultar o status atualizado diretamente no Asaas. O sistema tentará confirmar automaticamente se o pagamento foi recebido.',
    },
    {
      label: '3. Confirmar Manualmente',
      tooltip:
        'Se o pagamento foi realizado mas não confirmado automaticamente (ex: transferência bancária, depósito), clique em "Confirmar Pagamento" para registrar manualmente e liberar o lote para emissão.',
      badge: '⚠️',
    },
    {
      label: '4. Vincular Representante',
      tooltip:
        'Se o lote não possui representante vinculado, utilize "Vincular Representante" informando o código do representante. Isso é necessário para o correto registro de comissões após a emissão.',
    },
  ] as InstructionStep[],
};

export default function PagamentosFlowGuide({
  section,
}: PagamentosFlowGuideProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const steps = flowInstructions[section];

  const headerText =
    section === 'aguardando_cobranca'
      ? '💳 Atribuições do Admin — Aguardando Cobrança'
      : '⏳ Atribuições do Admin — Aguardando Pagamento';

  const subtext =
    section === 'aguardando_cobranca'
      ? 'Defina o valor, gere e disponibilize o link de pagamento para o tomador ou clínica'
      : 'Monitore, verifique e confirme pagamentos recebidos para liberar lotes à emissão';

  return (
    <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 mb-4">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-blue-900">{headerText}</h2>
        <p className="text-xs text-blue-700 mt-0.5">{subtext}</p>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-1">
            <div className="relative">
              <button
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="px-2.5 py-1.5 bg-white rounded-md border border-blue-300 text-blue-900 text-xs font-medium hover:bg-blue-100 transition-colors cursor-help inline-flex items-center gap-1"
                type="button"
              >
                {step.badge && <span>{step.badge}</span>}
                {step.label}
              </button>

              {hoveredIndex === index && (
                <div className="absolute top-full left-0 mt-2 z-50 pointer-events-none">
                  <div className="bg-gray-900 text-white rounded-md p-3 w-72 shadow-lg leading-relaxed text-xs">
                    <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900" />
                    {step.tooltip}
                  </div>
                </div>
              )}
            </div>

            {index < steps.length - 1 && (
              <span className="text-blue-400 font-bold mt-2 px-1">→</span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>💡 Dica:</strong> Passe o mouse sobre cada etapa para ver
          instruções detalhadas sobre o que fazer em cada passo.
        </p>
      </div>
    </div>
  );
}
