'use client'

import { CreditCard } from 'lucide-react'

export function PagamentosContent() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Histórico de Pagamentos</h2>
      </div>

      <div className="text-center py-12">
        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">Módulo de Pagamentos</p>
        <p className="text-sm text-gray-400">
          Histórico e comprovantes em desenvolvimento
        </p>
      </div>
    </div>
  )
}
