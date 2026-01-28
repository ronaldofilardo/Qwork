'use client'

import { escalasResposta, RespostaValor } from '@/lib/questoes'

interface RadioScaleProps {
  questionId: string
  questionText: string
  value: number | null
  onChange: (value: number) => void
  required?: boolean
}

export default function RadioScale({
  questionId,
  questionText,
  value,
  onChange,
  required = true,
}: RadioScaleProps) {
  const opcoes = Object.entries(escalasResposta) as [RespostaValor, number][]

  return (
    <div className="py-6 border-b border-gray-200">
      {/* Pergunta centralizada */}
      <div className="mb-6">
        <label
          htmlFor={questionId}
          className={`block text-[1.2rem] sm:text-[1.5rem] font-semibold text-center text-gray-800 ${required ? 'required' : ''}`}
        >
          {questionText}
        </label>
      </div>

      {/* Escala de opções responsiva */}
      {/* Mobile: container horizontal com snap e touch targets maiores */}
      {/* Mobile: grid compacto com todas as 5 opções visíveis ao mesmo tempo */}
      <div className="sm:hidden mb-4 -mx-2 px-2">
        <div className="grid grid-cols-5 gap-2">
          {opcoes.map(([label, val]) => (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all touch-target min-h-[72px] ${
                value === val
                  ? 'border-primary bg-primary text-white'
                  : 'border-gray-300 bg-white hover:border-primary hover:bg-gray-50'
              }`}
              title={label}
              aria-pressed={value === val}
            >
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mb-2 ${
                  value === val
                    ? 'border-white bg-white/30'
                    : 'border-gray-400 bg-white'
                }`}
              >
                {value === val && (
                  <div className="w-3 h-3 rounded-full bg-white"></div>
                )}
              </div>
              <span className={`text-[10px] sm:text-sm text-center ${
                value === val ? 'text-white' : 'text-gray-600'
              }`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop/tablet: grid de 5 colunas */}
      <div className="hidden sm:grid grid-cols-5 gap-3 sm:gap-4 mb-4">
        {opcoes.map(([label, val]) => (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-sm ${
              value === val
                ? 'border-primary bg-primary shadow-md'
                : 'border-gray-300 bg-white hover:border-primary hover:bg-gray-50'
            }`}
            title={label}
            aria-pressed={value === val}
          >
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center mb-3 ${
                value === val
                  ? 'border-primary bg-primary'
                  : 'border-gray-400 bg-white'
              }`}
            >
              {value === val && (
                <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white"></div>
              )}
            </div>
            <span className={`text-xs sm:text-base font-medium text-center ${
              value === val ? 'text-gray-900' : 'text-gray-600'
            }`}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Texto de instrução */}
      <p className="text-center text-sm text-gray-500 mt-4">
        Selecione uma opção acima
      </p>
    </div>
  )
}