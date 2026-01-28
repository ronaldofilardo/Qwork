"use client";

import { useState, useEffect } from "react";

interface Question {
  grupoId: number;
  grupoTitulo: string;
  itemId: string;
  texto: string;
  inversa?: boolean;
}

interface Progress {
  current: number;
  total: number;
}

interface QuestionModalProps {
  question: Question;
  progress: Progress;
  respostasAnteriores: { [key: string]: number };
  avaliacaoId: number | null;
  onNext: (valor: number) => void;
  onClose: () => void;
}

const opcoes = [
  { valor: 0, label: "Nunca", cor: "bg-green-500" },
  { valor: 25, label: "Raramente", cor: "bg-lime-500" },
  { valor: 50, label: "Às vezes", cor: "bg-yellow-500" },
  { valor: 75, label: "Frequentemente", cor: "bg-orange-500" },
  { valor: 100, label: "Sempre", cor: "bg-red-600" },
];

// Ícone X feito à mão (sem lucide-react)
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);

export default function QuestionModal({
  question,
  progress,
  respostasAnteriores,
  avaliacaoId,
  onNext,
  onClose,
}: QuestionModalProps) {
  // Não pré-selecionar a resposta com base em `respostasAnteriores`.
  // Mantemos o auto-advance chamando `onNext`, mas não mostramos nenhuma
  // seleção visual para evitar induzir o usuário.
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (respostasAnteriores[question.itemId] !== undefined) {
      const timer = setTimeout(() => onNext(respostasAnteriores[question.itemId]), 800);
      return () => clearTimeout(timer);
    }
  }, [question.itemId, respostasAnteriores, onNext]);

  // Reset local selection when the question changes so the new question
  // does not inherit the previous selection and avoids user confusion.
  useEffect(() => {
    setSelecionado(null);
    setEnviando(false);
  }, [question.itemId]);

  async function handleResposta(valor: number) {
    if (enviando || selecionado !== null) return;
    setEnviando(true);
    setSelecionado(valor);

    try {
      await fetch("/api/avaliacao/respostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          avaliacaoId,
          grupo: question.grupoId,
          item: question.itemId,
          valor,
        }),
      });
    } catch (err: unknown) {
      console.warn("Falha ao salvar – será sincronizado depois", err);
    }

    setTimeout(() => {
      onNext(valor);
      setEnviando(false);
    }, 400);
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col safe-area">
      <div className="bg-primary text-white p-4 shadow-lg">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-lg font-bold">Avaliação Psicossocial</h2>
            <p className="text-sm opacity-90">{question.grupoTitulo}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Sair"
            className="p-2 hover:bg-white/10 rounded-full transition text-white hover:text-white focus:text-white z-50 ring-1 ring-white/10 focus:ring-white/30"
            title="Sair e continuar depois"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-4 bg-white/30 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-500"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
        <p className="text-sm text-right mt-1">
          {progress.current} de {progress.total}
        </p>
      </div>

      <div className="flex-1 flex flex-col justify-start sm:justify-center items-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="max-w-xl sm:max-w-2xl w-full question-mobile">
          <h3 className="text-[1.8rem] md:text-[2.7rem] font-semibold text-center text-gray-800 leading-relaxed">
            {question.texto}
          </h3>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-5 gap-4">
            {opcoes.map((op) => (
              <button
                key={op.valor}
                onClick={() => handleResposta(op.valor)}
                disabled={enviando || selecionado !== null}
                className={`relative p-6 rounded-2xl font-semibold text-white shadow-lg transition-all transform
                  ${selecionado === op.valor ? "scale-95 opacity-90" : "hover:scale-105"}
                  ${enviando && selecionado === op.valor ? "animate-pulse" : ""}
                  ${op.cor}
                `}
              >
                <span className="block text-sm md:text-base">{op.label}</span>
                <span className="block text-3xl md:text-4xl font-bold mt-2">
                  {op.valor === 0 && "0"}
                  {op.valor === 25 && "¼"}
                  {op.valor === 50 && "½"}
                  {op.valor === 75 && "¾"}
                  {op.valor === 100 && "100"}
                </span>
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-10">
            Toque na resposta que melhor descreve sua situação.<br />
            Você pode sair a qualquer momento e continuar depois.
          </p>

          <div className="mt-4 flex justify-center">
            <button
              onClick={onClose}
              aria-label="Sair e continuar depois"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Sair e continuar depois
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
