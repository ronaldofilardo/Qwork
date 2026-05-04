'use client';

import { useState } from 'react';

interface InstructionStep {
  label: string;
  tooltip: string;
  badge?: string;
}

interface RepresentantesFlowGuideProps {
  section: 'ativos' | 'pendentes';
}

const flowInstructions = {
  ativos: [
    {
      label: '1. Verificar Status',
      tooltip:
        'Abra o card do representante para visualizar seu status atual, dados cadastrais e histórico. Procure por representantes com status "Sem comissão" ou "Em Cadastro".',
    },
    {
      label: '2. Sem Comissão?',
      tooltip:
        'Se o representante ainda não tem modelo de comissionamento definido, clique em "Editar Comissão". Você precisará escolher entre PERCENTUAL (% fixo sobre cada laudo) ou CUSTO FIXO (valor R$ por avaliação por tipo de cliente).',
    },
    {
      label: '3. Definir Modelo',
      tooltip:
        'Modelo PERCENTUAL: Define um % único cobrado sobre todas as avaliações do representante (ex: 10% do valor do laudo). Modelo CUSTO FIXO: Define dois valores fixos que QWork retém por avaliação — Custo Fixo Entidade (ex: R$ 6,00 por avaliação em tomadores) e Custo Fixo Clínica (ex: R$ 14,00 por avaliação em clínicas). O representante recebe o restante do valor do laudo após descontos de impostos e gateway.',
      badge: '💡',
    },
    {
      label: '4. Resetar Senha',
      tooltip:
        'Se o representante perdeu acesso ou precisa renovar sua senha, clique em "Resetar senha". Um link será enviado para o email cadastrado permitindo criar uma nova senha.',
    },
  ] as InstructionStep[],
  pendentes: [
    {
      label: '1. Analisar Documentação',
      tooltip:
        'Verifique os documentos enviados pelo candidato: comprovante de conta bancária, documento de identidade, CNPJ/CPF e outros. Procure por inconsistências ou documentos vencidos.',
    },
    {
      label: '2. Validar Dados',
      tooltip:
        'Confirme se os dados cadastrais estão completos e corretos: nome, email, telefone, dados bancários (PIX ou conta), tipo de pessoa (PF/PJ). Tudo deve estar preenchido antes da aprovação.',
    },
    {
      label: '3. Aprovar ou Rejeitar',
      tooltip:
        'Clique em "Aprovar" se tudo estiver ok — o candidato passará a ser um representante ativo com status "Em Cadastro". Se houver problemas, clique em "Rejeitar" e informe o motivo ao candidato para que possa corrigir.',
    },
    {
      label: '4. Converter & Enviar Link',
      tooltip:
        'Após aprovação, clique em "Converter". Um link será gerado e enviado por email ao representante. Ele usará este link para acessar a plataforma, definir sua senha, aceitar contrato e termos de uso.',
    },
  ] as InstructionStep[],
};

export default function RepresentantesFlowGuide({
  section = 'ativos',
}: RepresentantesFlowGuideProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const steps = flowInstructions[section];

  const headerText =
    section === 'ativos'
      ? '👥 Atribuições do Comercial — Representantes Ativos'
      : '📋 Atribuições do Comercial — Pendentes de Aprovação';

  const subtext =
    section === 'ativos'
      ? 'Defina modelo de comissão, resete senhas e gerencie representantes já cadastrados'
      : 'Analise documentação, aprove candidatos e envie links de acesso para ativação';

  return (
    <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200 mb-4">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-blue-900">{headerText}</h2>
        <p className="text-xs text-blue-700 mt-0.5">{subtext}</p>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start gap-1">
            {/* Step button with tooltip */}
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
                  <div className="bg-gray-900 text-white text-sm rounded-md p-3 w-72 shadow-lg leading-relaxed text-xs">
                    <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900" />
                    {step.tooltip}
                  </div>
                </div>
              )}
            </div>

            {/* Arrow separator */}
            {index < steps.length - 1 && (
              <span className="text-blue-400 font-bold mt-2 px-1">→</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="mt-3 pt-3 border-t border-blue-200">
        <p className="text-xs text-blue-800">
          <strong>💡 Dica:</strong> Passe o mouse sobre cada etapa para ver
          instruções detalhadas sobre o que fazer em cada passo.
        </p>
      </div>
    </div>
  );
}
