'use client';

import { useState } from 'react';

interface SubStep {
  label: string;
  tooltip: string;
}

interface FlowStep {
  label: string;
  tooltip: string;
  subSteps?: SubStep[];
}

interface FlowStepsExplainerProps {
  isClinica?: boolean;
}

const entidadeSteps: FlowStep[] = [
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

const clinicaSteps: FlowStep[] = [
  {
    label: 'Inserção de Nova Empresa',
    tooltip:
      'Cadastre as empresas clientes que terão funcionários avaliados pela clínica. Informe CNPJ, nome e dados de contato da empresa.',
  },
  {
    label: 'Inserção de Funcionário',
    tooltip:
      'Cadastre os funcionários que serão avaliados na plataforma. Informações como nome, CPF, cargo e dados de contato são registrados nesta etapa.',
    subSteps: [
      {
        label: "via 'Importação em massa'",
        tooltip:
          "Clique em 'Importação em massa' no menu a esquerda, onde a planilha deve ter colunas: i. para funcionários: nome, cpf, data de nascimento, setor, função, NIVEL = GESTAO OU OPERACIONAL. ii. para empresas: CNPJ e nome da empresa.",
      },
      {
        label: "via 'Nova empresa'",
        tooltip:
          "Clique em '+Nova empresa' e depois que a empresa for criada acesse via card abaixo, entre na aba 'Funcionários' e insira via botão '+Adicionar' ou 'Importar XLSX'.",
      },
    ],
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
  const [hoveredSubKey, setHoveredSubKey] = useState<string | null>(null);
  const flowSteps = isClinica ? clinicaSteps : entidadeSteps;

  return (
    <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200 mb-8">
      <h2 className="text-lg font-semibold text-blue-900 mb-4">
        📋 Entenda o Fluxo Completo
      </h2>

      {/* Flow Steps com Tooltips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {flowSteps.map((step, index) => {
          const isLast = index === flowSteps.length - 1;
          return (
            <div key={index} className="flex items-center gap-2">
              {/* Main step button with tooltip */}
              <div className="relative">
                <button
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="px-3 py-2 bg-white rounded-md border border-blue-300 text-blue-900 text-sm font-medium hover:bg-blue-100 transition-colors cursor-help relative"
                  type="button"
                >
                  {step.label}
                </button>

                {/* Tooltip — abre para baixo no último passo para evitar corte */}
                {hoveredIndex === index &&
                  (isLast ? (
                    <div className="absolute top-full left-0 mt-2 z-50 pointer-events-none">
                      <div className="bg-gray-900 text-white text-sm rounded-md p-4 w-64 shadow-lg leading-relaxed">
                        {/* Seta de tooltip (apontando para cima) */}
                        <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
                        {step.tooltip}
                      </div>
                    </div>
                  ) : (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50 pointer-events-none">
                      <div className="bg-gray-900 text-white text-sm rounded-md p-4 w-56 shadow-lg leading-relaxed">
                        {step.tooltip}
                        {/* Seta de tooltip */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Sub-etapas — stacked vertical, mostradas quando o passo as possui */}
              {step.subSteps && step.subSteps.length > 0 && (
                <>
                  <span className="text-blue-400 font-bold">→</span>
                  <div className="flex flex-col gap-1.5">
                    {step.subSteps.map((sub, subIdx) => {
                      const subKey = `${index}-${subIdx}`;
                      return (
                        <div key={subIdx} className="relative">
                          <button
                            onMouseEnter={() => setHoveredSubKey(subKey)}
                            onMouseLeave={() => setHoveredSubKey(null)}
                            className="px-3 py-2 bg-white rounded-md border border-dashed border-blue-300 text-blue-900 text-sm font-medium hover:bg-blue-100 transition-colors cursor-help"
                            type="button"
                          >
                            {sub.label}
                          </button>
                          {hoveredSubKey === subKey && (
                            <div className="absolute bottom-full left-0 mb-2 z-50 pointer-events-none">
                              <div className="bg-gray-900 text-white text-sm rounded-md p-4 w-80 shadow-lg leading-relaxed">
                                {sub.tooltip}
                                <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
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
              {index < flowSteps.length - 1 && (
                <span className="text-blue-400 font-bold">→</span>
              )}
            </div>
          );
        })}
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
