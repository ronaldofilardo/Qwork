"use client";

import RadioScale from "./RadioScale";
import { GrupoAvaliacao } from "@/lib/questoes";

interface FormGroupProps {
  grupo: GrupoAvaliacao;
  respostas: Map<string, number>;
  onChange: (itemId: string, valor: number) => void;
}

import { useMemo } from "react";

export default function FormGroup({
  grupo,
  respostas,
  onChange,
}: FormGroupProps) {
  // Calcula o índice da próxima questão a ser respondida
  const nextIndex = useMemo(() => {
    return grupo.itens.findIndex((item) => !respostas.has(item.id));
  }, [grupo.itens, respostas]);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Cabeçalho do Grupo */}
      <div className="bg-black px-6 py-6 sm:px-8 sm:py-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl sm:text-2xl font-normal text-white">
            {grupo.titulo}
          </h2>
          <button
            type="button"
            className="text-white hover:text-gray-300 transition-colors"
            aria-label="Fechar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {grupo.descricao && (
          <p className="text-base sm:text-lg text-white/90 mb-2">
            {grupo.descricao}
          </p>
        )}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 bg-white/20 rounded-full h-1.5">
            <div
              className="bg-white rounded-full h-1.5 transition-all duration-300"
              style={{
                width: `${
                  (grupo.itens.filter((item) => respostas.has(item.id)).length /
                    grupo.itens.length) *
                  100
                }%`,
              }}
            />
          </div>
          <span className="text-white/90 text-sm font-normal whitespace-nowrap">
            {grupo.itens.filter((item) => respostas.has(item.id)).length} de{" "}
            {grupo.itens.length}
          </span>
        </div>
      </div>

      {/* Questões */}
      <div className="divide-y divide-gray-100">
        {grupo.itens.map((item, idx) => {
          // Só exibe se for a próxima a responder ou já respondida
          const liberada = idx <= nextIndex;
          const desabilitada = idx < nextIndex;

          return liberada ? (
            <div
              key={item.id}
              className={`
                relative
                ${
                  desabilitada
                    ? "opacity-40 pointer-events-none select-none bg-gray-50"
                    : "bg-white"
                }
              `}
            >
              <RadioScale
                questionId={item.id}
                questionText={item.texto}
                value={respostas.get(item.id) ?? null}
                onChange={
                  desabilitada
                    ? () => {}
                    : (valor) => void onChange(item.id, valor)
                }
                required
              />
            </div>
          ) : null;
        })}
      </div>

      {/* Instruções */}
      <div className="px-6 py-5 bg-gray-50 border-t border-gray-200">
        <div className="flex items-start gap-3 max-w-3xl mx-auto">
          <svg
            className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm sm:text-base text-gray-700">
            <strong>Instruções:</strong> Responda todas as perguntas pensando
            nas últimas 4 semanas. Selecione a opção que melhor representa sua
            situação. As respostas são salvas automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
}
