'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import QworkLogo from '@/components/QworkLogo'

interface AvaliacaoInfo {
  id: string
  dataConclusao: string
  horaConclusao: string
}

export default function AvaliacaoConcluidaPage() {
  const router = useRouter()
  const [avaliacaoInfo, setAvaliacaoInfo] = useState<AvaliacaoInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAvaliacaoInfo = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const idAvaliacao = urlParams.get('avaliacao_id')

        if (!idAvaliacao) {
          throw new Error('ID da avaliação não encontrado')
        }

        // Buscar informações básicas da avaliação
        const response = await fetch(`/api/avaliacao/status?avaliacao_id=${idAvaliacao}`)
        if (!response.ok) {
          throw new Error('Erro ao buscar informações da avaliação')
        }
        await response.json()

        // Simular data/hora de conclusão (pode ser ajustado conforme a API)
        const agora = new Date()
        const dataConclusao = agora.toLocaleDateString('pt-BR')
        const horaConclusao = agora.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })

        setAvaliacaoInfo({
          id: idAvaliacao,
          dataConclusao,
          horaConclusao
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchAvaliacaoInfo()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 max-w-2xl w-full text-center">
          <div className="animate-spin mx-auto w-10 h-10 sm:w-12 sm:h-12 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Carregando recibo...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 max-w-2xl w-full text-center">
          <p className="text-sm sm:text-base text-red-600 mb-4">Erro ao carregar recibo: {error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-primary text-white py-3 px-4 sm:px-6 rounded-lg hover:bg-primary-hover transition-colors text-sm sm:text-base"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 text-center">
          <div className="mb-4">
            <QworkLogo size="lg" showSlogan={true} />
          </div>

          <div className="mb-4 sm:mb-6">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-success rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Avaliação Concluída!
          </h1>

          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            Obrigado por completar a avaliação psicossocial Qwork.
          </p>

          {/* Recibo */}
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
              📄 Recibo de Conclusão
            </h2>

            <div className="text-left space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">Avaliação:</span>
                <span className="text-gray-900">#{avaliacaoInfo?.id}</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">Data de Conclusão:</span>
                <span className="text-gray-900">{avaliacaoInfo?.dataConclusao}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-700">Hora de Conclusão:</span>
                <span className="text-gray-900">{avaliacaoInfo?.horaConclusao}</span>
              </div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white py-3 px-4 sm:px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              🖨️ Imprimir Recibo
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="bg-primary text-white py-3 px-4 sm:px-6 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              ← Voltar ao Dashboard
            </button>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mt-4">
            💾 Suas respostas foram salvas com segurança
          </p>
        </div>
      </div>
    </div>
  )
}
