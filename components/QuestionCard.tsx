'use client'

import { useState, useEffect } from 'react'

interface QuestionCardProps {
  questionId: string
  texto: string
  valor?: number
  onChange: (questionId: string, valor: number) => void
  onSave?: () => void
  autoSave?: boolean
}

const escalasResposta = {
  'Sempre': 100,
  'Muitas vezes': 75,
  'Às vezes': 50,
  'Raramente': 25,
  'Nunca': 0,
}

export default function QuestionCard({
  questionId,
  texto,
  valor,
  onChange,
  onSave,
  autoSave = true
}: QuestionCardProps) {
  const [selectedValue, setSelectedValue] = useState<number | undefined>(valor)
  const [lastSaved, setLastSaved] = useState<number | undefined>(valor)

  // Auto-save quando valor muda
  useEffect(() => {
    if (autoSave && selectedValue !== undefined && selectedValue !== lastSaved) {
      const timer = setTimeout(() => {
        onChange(questionId, selectedValue)
        onSave?.()
        setLastSaved(selectedValue)
      }, 1000) // Save after 1 second of inactivity

      return () => clearTimeout(timer)
    }
  }, [selectedValue, lastSaved, autoSave, questionId, onChange, onSave])

  const handleChange = (novoValor: number) => {
    setSelectedValue(novoValor)
    if (!autoSave) {
      onChange(questionId, novoValor)
    }
  }

  const hasUnsavedChanges = selectedValue !== lastSaved && selectedValue !== undefined

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-[1.8rem] font-semibold text-gray-800 leading-relaxed">
          {texto}
        </h3>
        {hasUnsavedChanges && (
          <div className="flex items-center text-yellow-600 text-sm">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Salvando...
          </div>
        )}
      </div>

      <div className="space-y-3">
        {Object.entries(escalasResposta).map(([label, value]) => (
          <label
            key={value}
            className={`flex items-center p-4 rounded-lg cursor-pointer transition-all duration-200 bg-white ${
              selectedValue === value
                ? 'border-2 border-green-600 shadow-md'
                : 'border-2 border-green-500 hover:border-green-600 hover:shadow-sm'
            }`}
          >
            <input
              type="radio"
              name={questionId}
              value={value}
              checked={selectedValue === value}
              onChange={() => handleChange(value)}
              className="sr-only"
            />
            <div className={`w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center ${
              selectedValue === value
                ? 'border-green-600 bg-green-100'
                : 'border-green-500 bg-white'
            }`}>
              {selectedValue === value && (
                <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
              )}
            </div>
            <span className="font-medium text-gray-900">
              {label}
            </span>
            <span className="ml-auto text-sm text-gray-600">
              {value}
            </span>
          </label>
        ))}
      </div>

      {/* Indicador de status */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
        <div className={`text-sm ${selectedValue !== undefined ? 'text-green-600' : 'text-gray-500'}`}>
          {selectedValue !== undefined ? (
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Respondido
            </div>
          ) : (
            'Selecione uma opção'
          )}
        </div>
        
        {selectedValue !== undefined && (
          <div className="text-sm text-gray-500">
            Valor selecionado: <span className="font-medium text-primary">{selectedValue}</span>
          </div>
        )}
      </div>
    </div>
  )
}