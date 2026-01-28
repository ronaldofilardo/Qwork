import React from 'react';

interface StatusLoteBadgeProps {
  status: 'ativo' | 'concluido' | 'finalizado' | 'cancelado';
  processamentoEm?: string | null;
  className?: string;
}

/**
 * Badge para exibir status de lote de forma visual
 * Substitui cálculos de "dias pendentes" por rótulos claros
 */
export function StatusLoteBadge({
  status,
  processamentoEm,
  className = '',
}: StatusLoteBadgeProps) {
  // Se está em processamento, mostrar indicador específico
  if (processamentoEm) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}
        title="Laudo em processamento"
      >
        <svg
          className="animate-spin h-3 w-3"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Processando
      </span>
    );
  }

  // Configurações de badge por status
  const config = {
    ativo: {
      label: 'Ativo',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      title: 'Lote ativo - avaliações em andamento',
    },
    concluido: {
      label: 'Concluído',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      title: 'Lote concluído - aguardando emissão de laudo',
    },
    finalizado: {
      label: 'Finalizado',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      title: 'Lote finalizado - laudo enviado',
    },
    cancelado: {
      label: 'Cancelado',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      title: 'Lote cancelado',
    },
  };

  const { label, bgColor, textColor, title } = config[status] || {
    label: 'Desconhecido',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    title: 'Status desconhecido',
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor} ${className}`}
      title={title}
    >
      {label}
    </span>
  );
}
