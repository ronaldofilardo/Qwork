'use client';

import { useEffect, useRef, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';

interface ImportProgressModalProps {
  /** Total de linhas a importar — exibido como contexto */
  totalLinhas: number;
  /** Quando true, a API respondeu: avança para 100% e fecha o modal */
  concluido: boolean;
  /** Callback após o modal fechar (após animação de conclusão) */
  onClose: () => void;
}

interface Fase {
  label: string;
  /** Percentual alvo desta fase (0–100) */
  alvo: number;
  /** Duração aproximada em ms para chegar ao alvo */
  duracaoMs: number;
}

const FASES: Fase[] = [
  { label: 'Preparando dados...', alvo: 20, duracaoMs: 600 },
  { label: 'Processando empresas...', alvo: 55, duracaoMs: 1800 },
  { label: 'Importando funcionários...', alvo: 88, duracaoMs: 3000 },
  { label: 'Finalizando registros...', alvo: 95, duracaoMs: 1200 },
];

const TICK_MS = 80; // intervalo de atualização do progresso

/**
 * Modal de progresso para a execução de importação em massa.
 * Usa animação determinística — não depende de eventos da API.
 * Quando `concluido` se torna true, salta para 100% e fecha após 600ms.
 */
export default function ImportProgressModal({
  totalLinhas,
  concluido,
  onClose,
}: ImportProgressModalProps) {
  const [progresso, setProgresso] = useState(0);
  const [faseAtual, setFaseAtual] = useState(0);
  const [encerrado, setEncerrado] = useState(false);
  const rafRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startRef = useRef<number>(Date.now());
  const concluidoRef = useRef(false);

  // Calcular tempo total acumulado de todas as fases
  const temposFases = FASES.reduce<number[]>((acc, f) => {
    const anterior = acc.length > 0 ? (acc[acc.length - 1] ?? 0) : 0;
    acc.push(anterior + f.duracaoMs);
    return acc;
  }, []);
  const tempoTotal = temposFases[temposFases.length - 1] ?? 6000;

  useEffect(() => {
    startRef.current = Date.now();
    concluidoRef.current = false;

    const tick = () => {
      const elapsed = Date.now() - startRef.current;

      if (concluidoRef.current) {
        // Animar rapidamente para 100%
        setProgresso((prev) => {
          const next = Math.min(100, prev + 5);
          if (next >= 100) {
            setTimeout(() => setEncerrado(true), 400);
          }
          return next;
        });
        return;
      }

      // Calcular progresso proporcional ao tempo decorrido
      const ratio = Math.min(elapsed / tempoTotal, 1);
      // Mapear ratio para porcentagem máxima das fases (95)
      const maxFaseAlvo = FASES[FASES.length - 1]?.alvo ?? 95;
      const targetPct = Math.round(ratio * maxFaseAlvo);

      setProgresso(targetPct);

      // Atualizar fase visual
      let fase = 0;
      for (let i = 0; i < temposFases.length; i++) {
        if (elapsed >= (temposFases[i] ?? 0)) fase = i + 1;
      }
      setFaseAtual(Math.min(fase, FASES.length - 1));

      if (ratio < 1) {
        rafRef.current = setTimeout(tick, TICK_MS);
      }
    };

    rafRef.current = setTimeout(tick, TICK_MS);

    return () => {
      if (rafRef.current) clearTimeout(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quando a API conclui: acelerar para 100%
  useEffect(() => {
    if (concluido && !concluidoRef.current) {
      concluidoRef.current = true;
      if (rafRef.current) clearTimeout(rafRef.current);
      // Disparar ticks rápidos até 100%
      const fastTick = () => {
        setProgresso((prev) => {
          const next = Math.min(100, prev + 4);
          if (next < 100) {
            setTimeout(fastTick, 40);
          } else {
            setTimeout(() => setEncerrado(true), 400);
          }
          return next;
        });
      };
      fastTick();
    }
  }, [concluido]);

  // Fechar após encerramento
  useEffect(() => {
    if (encerrado) onClose();
  }, [encerrado, onClose]);

  const faseLabel = FASES[faseAtual]?.label ?? 'Processando...';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-label="Importando registros"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-8 flex flex-col items-center gap-6">
        {/* Ícone + título */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet size={28} className="text-primary" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Importando {totalLinhas.toLocaleString('pt-BR')} registro
            {totalLinhas !== 1 ? 's' : ''}
          </h2>
          <p className="text-sm text-gray-500 text-center">
            Por favor, aguarde. Não feche esta janela.
          </p>
        </div>

        {/* Barra de progresso */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span className="truncate">{progresso < 100 ? faseLabel : 'Concluído!'}</span>
            <span className="font-semibold text-gray-700 ml-2">{progresso}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {/* Indicador de fases */}
        <div className="w-full flex justify-between gap-1">
          {FASES.map((f, i) => (
            <div
              key={f.label}
              className={`flex-1 h-1 rounded-full transition-colors duration-300 ${
                i <= faseAtual || progresso >= 100
                  ? 'bg-primary'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
