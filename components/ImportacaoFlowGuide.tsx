'use client';

import { useState } from 'react';

interface SubStep {
  label: string;
  tooltip: string;
}

interface GuideStep {
  label: string;
  tooltip: string;
  subSteps?: SubStep[];
}

const importacaoSteps: GuideStep[] = [
  {
    label: '1. Upload da Planilha',
    tooltip:
      'Envie um arquivo .xlsx ou .csv com os dados de empresas e funcionários. Limite de 10 MB. Você pode arrastar o arquivo ou clicar para selecionar. Para planilhas grandes a análise pode levar alguns segundos.',
  },
  {
    label: '2. Mapeamento de Colunas',
    tooltip:
      'Relacione as colunas da sua planilha com os campos do sistema QWork. Se você já importou uma planilha com o mesmo formato antes, pode reutilizar um template salvo.',
    subSteps: [
      {
        label: 'via Template Salvo',
        tooltip:
          'Se você já importou uma planilha com o mesmo formato de colunas, selecione o template salvo anteriormente para aplicar o mapeamento automaticamente.',
      },
      {
        label: 'Mapeamento Manual',
        tooltip:
          'Selecione manualmente qual coluna da planilha corresponde a cada campo: nome, CPF, data de nascimento, setor, função, nível (GESTAO ou OPERACIONAL), CNPJ da empresa e nome da empresa.',
      },
    ],
  },
  {
    label: '3. Validação',
    tooltip:
      'Revise os dados antes de importar. Erros de formatação (CPF inválido, data incorreta, etc.) são destacados para correção. A importação só acontece após confirmar.',
    subSteps: [
      {
        label: '💾 Salvar como Template',
        tooltip:
          'Grava o mapeamento de colunas desta planilha para reutilizar em importações futuras com o mesmo formato. Muito útil quando você importa a mesma planilha periodicamente.',
      },
    ],
  },
  {
    label: '4. Importação',
    tooltip:
      'Empresas e funcionários são criados ou atualizados automaticamente. Inativações são também aplicadas. Ao final, um resumo detalhado mostra o resultado de cada registro processado.',
  },
];

export default function ImportacaoFlowGuide() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredSubKey, setHoveredSubKey] = useState<string | null>(null);

  return (
    <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 mb-4">
      <h2 className="text-lg font-semibold text-blue-900 mb-2">
        📋 Como funciona a Importação por Planilha
      </h2>

      <div className="flex flex-wrap items-start gap-1.5 mb-2">
        {importacaoSteps.map((step, index) => {
          const isLast = index === importacaoSteps.length - 1;
          return (
            <div key={index} className="flex items-start gap-2">
              {/* Main step button with tooltip */}
              <div className="relative">
                <button
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="px-2.5 py-1.5 bg-white rounded-md border border-blue-300 text-blue-900 text-xs font-medium hover:bg-blue-100 transition-colors cursor-help"
                  type="button"
                >
                  {step.label}
                </button>

                {hoveredIndex === index && (
                  <div className="absolute top-full left-0 mt-2 z-50 pointer-events-none">
                    <div className="bg-gray-900 text-white text-sm rounded-md p-4 w-64 shadow-lg leading-relaxed">
                      <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
                      {step.tooltip}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-etapas */}
              {step.subSteps && step.subSteps.length > 0 && (
                <>
                  <span className="text-blue-400 font-bold mt-2">→</span>
                  <div className="flex flex-col gap-1.5">
                    {step.subSteps.map((sub, subIdx) => {
                      const subKey = `${index}-${subIdx}`;
                      return (
                        <div key={subIdx} className="relative">
                          <button
                            onMouseEnter={() => setHoveredSubKey(subKey)}
                            onMouseLeave={() => setHoveredSubKey(null)}
                            className="px-2.5 py-1.5 bg-white rounded-md border border-dashed border-blue-300 text-blue-900 text-xs font-medium hover:bg-blue-100 transition-colors cursor-help"
                            type="button"
                          >
                            {sub.label}
                          </button>
                          {hoveredSubKey === subKey && (
                            <div className="absolute top-full left-0 mt-2 z-50 pointer-events-none">
                              <div className="bg-gray-900 text-white text-sm rounded-md p-4 w-80 shadow-lg leading-relaxed">
                                {sub.tooltip}
                                <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Arrow separator */}
              {index < importacaoSteps.length - 1 && (
                <span className="text-blue-400 font-bold mt-2">→</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 pt-2 border-t border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>💡 Atalho no fluxo completo:</strong> A importação por
          planilha cria empresas <em>e</em> funcionários em um único passo —
          eliminando as duas primeiras etapas do fluxo individual.
        </p>
      </div>
    </div>
  );
}
