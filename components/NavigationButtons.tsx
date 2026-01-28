'use client'

interface NavigationButtonsProps {
  onPrevious?: () => void
  onNext?: () => void
  onSave?: () => void
  hasPrevious?: boolean
  hasNext?: boolean
  isLastQuestion?: boolean
  isSaving?: boolean
  canProceed?: boolean
  currentQuestion?: number
  totalQuestions?: number
}

export default function NavigationButtons({
  onPrevious,
  onNext,
  onSave,
  hasPrevious = false,
  hasNext = false,
  isLastQuestion = false,
  isSaving = false,
  canProceed = false,
  currentQuestion = 0,
  totalQuestions = 0
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
      {/* Botão Anterior */}
      <button
        onClick={onPrevious}
        disabled={!hasPrevious || isSaving}
        className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors border ${
          hasPrevious && !isSaving
            ? 'bg-white text-black border-green-500 hover:border-green-600'
            : 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
        }`}
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Anterior
      </button>

      {/* Indicador de posição */}
      {totalQuestions > 0 && (
        <div className="text-center">
          <div className="text-sm text-gray-500">
            {currentQuestion} de {totalQuestions}
          </div>
          {/* Dots indicator */}
          <div className="flex justify-center mt-2 space-x-1">
            {Array.from({ length: Math.min(totalQuestions, 7) }, (_, i) => {
              const questionIndex = i + 1
              const isActive = questionIndex === currentQuestion
              const isCompleted = questionIndex < currentQuestion
              
              return (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive
                      ? 'bg-primary'
                      : isCompleted
                      ? 'bg-green-400'
                      : 'bg-gray-300'
                  }`}
                />
              )
            })}
            {totalQuestions > 7 && (
              <span className="text-xs text-gray-400 ml-2">...</span>
            )}
          </div>
        </div>
      )}

      {/* Botão Próximo/Salvar */}
      <div className="flex items-center space-x-3">
        {/* Botão Save Automático */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className={`flex items-center px-4 py-2 rounded-lg text-sm transition-colors border ${
            isSaving
              ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
              : 'bg-white text-black border-green-500 hover:border-green-600'
          }`}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Salvar
            </>
          )}
        </button>

        {/* Botão Próximo */}
        <button
          onClick={onNext}
          disabled={!canProceed || !hasNext || isSaving}
          className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors border ${
            canProceed && hasNext && !isSaving
              ? 'bg-white text-black border-green-500 hover:border-green-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300'
          }`}
        >
          {isLastQuestion ? (
            <>
              Finalizar Grupo
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </>
          ) : (
            <>
              Próxima
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}