'use client'

interface ProgressBarProps {
  currentGroup: number
  totalGroups: number
  currentQuestion?: number
  totalQuestions?: number
  groupTitle?: string
}

export default function ProgressBar({ 
  currentGroup, 
  totalGroups, 
  currentQuestion = 0, 
  totalQuestions = 0, 
  groupTitle 
}: ProgressBarProps) {
  const overallProgress = (currentGroup / totalGroups) * 100
  const groupProgress = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0

  // Seções do COPSOQ-III
  const secoes = [
    { nome: 'Demandas', grupos: [1] },
    { nome: 'Organização', grupos: [2] },
    { nome: 'Relações Sociais', grupos: [3, 4] },
    { nome: 'Liderança', grupos: [5] },
    { nome: 'Valores', grupos: [6] },
    { nome: 'Saúde', grupos: [7] },
    { nome: 'Comportamentos', grupos: [8] },
    { nome: 'Extras', grupos: [9, 10] }
  ]

  const secaoAtual = secoes.find(s => s.grupos.includes(currentGroup))

  return (
    <div className="mb-6 bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* Progress geral */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800">Progresso da Avaliação</h3>
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 px-3 py-1 rounded-full">
              <span className="text-sm font-bold text-gray-700">{Math.round(overallProgress)}% concluído</span>
            </div>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className="bg-gray-800 h-3 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${overallProgress}%` }}
          >
            <div className="absolute inset-0 bg-white/10"></div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-2 mt-3 text-sm text-gray-600">
          <span className="font-medium">Grupo {currentGroup} de {totalGroups}</span>
          {secaoAtual && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
              </svg>
              Seção: {secaoAtual.nome}
            </span>
          )}
        </div>
      </div>

      {/* Progress do grupo atual */}
      <div className="pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-700">
            {groupTitle || `Grupo ${currentGroup}`}
          </h4>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{Math.round(groupProgress)}% do grupo</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${groupProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Questão {currentQuestion} de {totalQuestions}</span>
          <span className="font-medium">{totalQuestions - currentQuestion} restantes</span>
        </div>
      </div>
    </div>
  )
}
