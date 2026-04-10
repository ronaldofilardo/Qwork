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

interface ForkPath {
  label: string;
  tooltip: string;
  recommended?: boolean;
  steps?: SubStep[];
}

interface FlowStepFork {
  kind: 'fork';
  paths: ForkPath[];
}

type AnyStep = FlowStep | FlowStepFork;

interface FlowStepsExplainerProps {
  isClinica?: boolean;
}

function isFork(step: AnyStep): step is FlowStepFork {
  return 'kind' in step && (step as FlowStepFork).kind === 'fork';
}

const entidadeSteps: FlowStep[] = [
  {
    label: '1. Inserção de Funcionário',
    tooltip:
      'Cadastre os funcionários que serão avaliados na plataforma. Informações como nome, CPF, cargo e dados de contato são registrados nesta etapa.',
  },
  {
    label: '2. Liberação de Lotes',
    tooltip:
      'Libere lotes de avaliação para que os funcionários faça o acesso e completem às avaliações psicossociais.',
  },
  {
    label: '3. Avaliações',
    tooltip:
      'Os funcionários respondem ao questionário de avaliação psicossocial. Após a conclusão, poderá solicitar a emissão do laudo.',
  },
  {
    label: '4. Solicitação de Emissão de Laudo',
    tooltip:
      'Você solicita a emissão do laudo à plataforma após as avaliações serem respondidas. Em seguida negocia o valor diretamente com a plataforma.',
  },
  {
    label: '5. Recebimento do Link para Pagamento',
    tooltip:
      'Logo receberá um link para pagamento via WhatsApp ou e-mail cadastrado. Assim que a plataforma identificar o pagamento, o laudo será emitido automaticamente.',
  },
  {
    label: '6. Emissão e Recebimento do Laudo',
    tooltip:
      'O laudo final em PDF é gerado e disponibilizado. Você poderá fazer o download ou compartilhá-lo com as empresa cliente [no caso de medicina ocupacional] e ser incluído no PGR.',
  },
];

const clinicaSteps: AnyStep[] = [
  {
    kind: 'fork',
    paths: [
      {
        label: '⚡ Importação em massa',
        tooltip:
          "Acesse 'Importação em massa' no menu à esquerda. Envie uma planilha com: nome, CPF, data de nascimento, setor, função, nível (GESTÃO ou OPERACIONAL), CNPJ e nome da empresa. Empresas e funcionários são criados em um único envio — pulando as etapas manuais.",
        recommended: true,
      },
      {
        label: 'Manual',
        tooltip: '',
        steps: [
          {
            label: '1. Nova Empresa',
            tooltip:
              "Clique em '+Nova empresa' no topo desta página. Informe CNPJ, nome e dados de contato da empresa cliente.",
          },
          {
            label: '2. Inserção de Funcionários',
            tooltip:
              "Após criar a empresa, acesse o card dela abaixo, entre na aba 'Funcionários' e adicione via 'Adicionar Funcionário' ou 'Importar XLSX'.",
          },
        ],
      },
    ],
  },
  {
    label: '3. Liberação de Lotes',
    tooltip:
      'Libere lotes de avaliação para que os funcionários façam o acesso e completem as avaliações psicossociais. 💡 Use os checkboxes à esquerda de cada empresa para selecionar múltiplas de uma vez — uma barra aparece no rodapé com o botão "Liberar Ciclos", que libera um lote para cada empresa selecionada que tiver funcionários elegíveis. Você pode selecionar todas elegíveis de uma vez pelo checkbox no cabeçalho da tabela.',
  },
  {
    label: '4. Avaliações',
    tooltip:
      'Os funcionários respondem ao questionário de avaliação psicossocial. Após a conclusão, poderá solicitar a emissão do laudo.',
  },
  {
    label: '5. Solicitação de Emissão de Laudo',
    tooltip:
      'Você solicita a emissão do laudo à plataforma após as avaliações serem respondidas. Em seguida negocia o valor diretamente com a plataforma.',
  },
  {
    label: '6. Recebimento do Link para Pagamento',
    tooltip:
      'Logo receberá um link para pagamento via WhatsApp ou e-mail cadastrado. Assim que a plataforma identificar o pagamento, o laudo será emitido automaticamente.',
  },
  {
    label: '7. Emissão e Recebimento do Laudo',
    tooltip:
      'O laudo final em PDF é gerado e disponibilizado. Você poderá fazer o download ou compartilhá-lo com a empresa cliente [no caso de medicina ocupacional] e ser incluído no PGR.',
  },
];

export default function FlowStepsExplainer({
  isClinica = false,
}: FlowStepsExplainerProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredSubKey, setHoveredSubKey] = useState<string | null>(null);
  const [hoveredForkKey, setHoveredForkKey] = useState<string | null>(null);
  const flowSteps: AnyStep[] = isClinica ? clinicaSteps : entidadeSteps;

  return (
    <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 mb-4">
      <h2 className="text-lg font-semibold text-blue-900 mb-2">
        📋 Entenda o Fluxo Completo
      </h2>

      {/* Flow Steps com Tooltips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {flowSteps.map((step, index) => {
          const isLast = index === flowSteps.length - 1;

          /* ── FORK BLOCK ── */
          if (isFork(step)) {
            const [pathA, pathB] = step.paths;
            return (
              <div key="fork" className="flex items-center gap-2">
                {/* Caixa visual com os dois caminhos de entrada */}
                <div className="border border-blue-200 rounded-lg bg-white px-3 py-2 flex flex-col gap-1.5">
                  {/* Caminho A — Importação em massa (recomendado) */}
                  <div className="relative flex items-center gap-1.5">
                    <button
                      onMouseEnter={() => setHoveredForkKey('A')}
                      onMouseLeave={() => setHoveredForkKey(null)}
                      className="px-2.5 py-1.5 bg-emerald-50 rounded-md border border-emerald-400 text-emerald-800 text-xs font-medium hover:bg-emerald-100 transition-colors cursor-help"
                      type="button"
                    >
                      {pathA.label}
                    </button>
                    {pathA.recommended && (
                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-semibold">
                        Recomendado
                      </span>
                    )}
                    {hoveredForkKey === 'A' && (
                      <div className="absolute top-full left-0 mt-2 z-50 pointer-events-none">
                        <div className="bg-gray-900 text-white text-sm rounded-md p-4 w-72 shadow-lg leading-relaxed">
                          <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
                          {pathA.tooltip}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Separador "ou" */}
                  <div className="flex items-center gap-1">
                    <div className="flex-1 border-t border-blue-100"></div>
                    <span className="text-xs text-gray-400 font-medium px-1">
                      ou
                    </span>
                    <div className="flex-1 border-t border-blue-100"></div>
                  </div>

                  {/* Caminho B — Manual (Nova Empresa → Inserção de Funcionários) */}
                  <div className="flex items-center gap-1.5">
                    {pathB.steps?.map((manualStep, stepIdx) => (
                      <div key={stepIdx} className="flex items-center gap-1.5">
                        <div className="relative">
                          <button
                            onMouseEnter={() =>
                              setHoveredForkKey(`B-${stepIdx}`)
                            }
                            onMouseLeave={() => setHoveredForkKey(null)}
                            className="px-2.5 py-1.5 bg-white rounded-md border border-blue-300 text-blue-900 text-xs font-medium hover:bg-blue-100 transition-colors cursor-help"
                            type="button"
                          >
                            {manualStep.label}
                          </button>
                          {hoveredForkKey === `B-${stepIdx}` && (
                            <div className="absolute top-full left-0 mt-2 z-50 pointer-events-none">
                              <div className="bg-gray-900 text-white text-sm rounded-md p-4 w-72 shadow-lg leading-relaxed">
                                <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
                                {manualStep.tooltip}
                              </div>
                            </div>
                          )}
                        </div>
                        {stepIdx < (pathB.steps?.length ?? 0) - 1 && (
                          <span className="text-blue-400 font-bold">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {!isLast && <span className="text-blue-400 font-bold">→</span>}
              </div>
            );
          }

          /* ── PASSO REGULAR ── */
          const regularStep = step as FlowStep;
          return (
            <div key={index} className="flex items-center gap-2">
              <div className="relative">
                <button
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="px-2.5 py-1.5 bg-white rounded-md border border-blue-300 text-blue-900 text-xs font-medium hover:bg-blue-100 transition-colors cursor-help relative"
                  type="button"
                >
                  {regularStep.label}
                </button>

                {/* Tooltip — sempre abre para baixo */}
                {hoveredIndex === index && (
                  <div className="absolute top-full left-0 mt-2 z-50 pointer-events-none">
                    <div className="bg-gray-900 text-white text-sm rounded-md p-4 w-64 shadow-lg leading-relaxed">
                      <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
                      {regularStep.tooltip}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-etapas (mantido para compatibilidade com entidadeSteps) */}
              {regularStep.subSteps && regularStep.subSteps.length > 0 && (
                <>
                  <span className="text-blue-400 font-bold">→</span>
                  <div className="flex flex-col gap-1.5">
                    {regularStep.subSteps.map((sub, subIdx) => {
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

              {/* Seta separadora */}
              {!isLast && <span className="text-blue-400 font-bold">→</span>}
            </div>
          );
        })}
      </div>

      {/* Aviso de cobrança por lote — exclusivo para clínicas */}
      {isClinica && (
        <div className="mt-2 pt-2 border-t border-blue-200 space-y-2">
          <p className="text-sm text-blue-800">
            <strong>💡 Importante:</strong> O laudo é cobrado por lote de cada
            empresa. Cada lote liberado resultará em uma solicitação de emissão
            com seu valor específico.
          </p>
          <p className="text-sm text-blue-700">
            <strong>
              ☑️ Liberação em massa de Ciclos de Coletas Avaliativas:
            </strong>{' '}
            Na tabela de empresas, use os <strong>checkboxes à esquerda</strong>{' '}
            de cada linha para selecionar as empresas desejadas. Ao selecionar
            uma ou mais, uma barra aparece no rodapé com o botão{' '}
            <strong>&ldquo;Liberar Ciclos&rdquo;</strong> — ele libera um novo
            lote para cada empresa selecionada que tiver funcionários elegíveis.
            O checkbox no cabeçalho da tabela seleciona todas as empresas
            elegíveis de uma vez.
          </p>
          <div className="flex items-center gap-2 mt-2 mb-1">
            <div className="h-px flex-1 bg-blue-200" />
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
              Formatação dos dados
            </span>
            <div className="h-px flex-1 bg-blue-200" />
          </div>
          <ul className="space-y-0.5 text-xs text-blue-700">
            <li>
              <strong>Data de Nascimento:</strong> dd/mm/aaaa{' '}
              <span className="text-blue-500">
                (use texto ou formato dd/mm/aaaa para evitar perda por
                formatação do Excel)
              </span>
            </li>
            <li>
              <strong>CPF:</strong> deve conter apenas 11 dígitos{' '}
              <span className="text-blue-500">(sem pontos ou hífen)</span>
            </li>
            <li>
              <strong>Função:</strong> importante para determinar a versão do
              questionário. Caso não tenha, o sistema permite selecionar na etapa{' '}
              <span className="italic">&ldquo;4. Níveis&rdquo;</span> em{' '}
              <strong>nivel_cargo</strong>.
            </li>
          </ul>
        </div>
      )}

      {/* Seção de Formatação dos Dados — exclusiva para entidades */}
      {!isClinica && (
        <div className="mt-2 pt-2 border-t border-blue-200 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px flex-1 bg-blue-200" />
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
              Formatação dos dados
            </span>
            <div className="h-px flex-1 bg-blue-200" />
          </div>
          <ul className="space-y-0.5 text-xs text-blue-700">
            <li>
              <strong>Data de Nascimento:</strong> dd/mm/aaaa{' '}
              <span className="text-blue-500">
                (use texto ou formato dd/mm/aaaa para evitar perda por
                formatação do Excel)
              </span>
            </li>
            <li>
              <strong>CPF:</strong> deve conter apenas 11 dígitos{' '}
              <span className="text-blue-500">(sem pontos ou hífen)</span>
            </li>
            <li>
              <strong>Função:</strong> importante para determinar a versão do
              questionário. Caso não tenha, o sistema permite selecionar na etapa{' '}
              <span className="italic">&ldquo;3. Avaliações&rdquo;</span> ou via
              edição individual do funcionário.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
