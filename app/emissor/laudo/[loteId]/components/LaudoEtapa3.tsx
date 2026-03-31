'use client';

import type { LaudoPadronizado } from '@/lib/laudo-tipos';

type Grupo = { grupo: number; dominio: string; acaoRecomendada: string };

interface GroupSectionProps {
  emoji: string;
  title: string;
  colorClass: string;
  labelColor: string;
  borderColor: string;
  grupos: Grupo[];
}

function GroupSection({
  emoji,
  title,
  colorClass,
  labelColor,
  borderColor,
  grupos,
}: GroupSectionProps) {
  return (
    <div className="rounded-lg p-5">
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">{emoji}</span>
        <h4 className={`font-bold text-base ${colorClass}`}>{title}</h4>
      </div>
      <div className="mt-4">
        <p className={`text-xs font-medium mb-2 ${labelColor}`}>
          Grupos identificados:
        </p>
        <div className="space-y-3">
          {grupos.map((g, idx) => (
            <div key={idx} className={`border-l-2 ${borderColor} pl-3`}>
              <p className={`text-sm font-semibold mb-1 ${colorClass}`}>
                {g.grupo}. {g.dominio}
              </p>
              <p className={`text-xs leading-relaxed ${labelColor}`}>
                {g.acaoRecomendada}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface LaudoEtapa3Props {
  etapa3: LaudoPadronizado['etapa3'];
}

export default function LaudoEtapa3({ etapa3 }: LaudoEtapa3Props) {
  if (!etapa3) return null;

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b-2 border-gray-600">
        3. INTERPRETAÇÃO E RECOMENDAÇÕES
      </h2>
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border-l-4 border-blue-500">
          <p className="text-gray-700 leading-relaxed">{etapa3.conclusao}</p>
        </div>
      </div>
      <div className="space-y-6">
        {etapa3.gruposExcelente && etapa3.gruposExcelente.length > 0 && (
          <GroupSection
            emoji="🟢"
            title="Risco Psicossocial Baixo (menor que 33%)"
            colorClass="text-green-800"
            labelColor="text-green-700"
            borderColor="border-green-300"
            grupos={etapa3.gruposExcelente}
          />
        )}
        {etapa3.gruposMonitoramento &&
          etapa3.gruposMonitoramento.length > 0 && (
            <GroupSection
              emoji="🟡"
              title="Risco Psicossocial Moderado (entre 33% e 66%)"
              colorClass="text-yellow-800"
              labelColor="text-yellow-700"
              borderColor="border-yellow-300"
              grupos={etapa3.gruposMonitoramento}
            />
          )}
        {etapa3.gruposAltoRisco && etapa3.gruposAltoRisco.length > 0 && (
          <GroupSection
            emoji="🔴"
            title="Risco Psicossocial Elevado (maior que 66%)"
            colorClass="text-red-800"
            labelColor="text-red-700"
            borderColor="border-red-300"
            grupos={etapa3.gruposAltoRisco}
          />
        )}
      </div>
    </div>
  );
}
