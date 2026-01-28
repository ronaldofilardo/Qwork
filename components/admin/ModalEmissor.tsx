import React from 'react'
import { X } from 'lucide-react'
import { validarCPF, validarEmail } from '@/lib/validators'

interface Emissor {
  cpf: string
  nome: string
  email: string
  ativo: boolean
  total_laudos_emitidos: number
}

interface ModalEmissorProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  emissor?: Emissor | null
  mode: 'create' | 'edit'
}

export function ModalEmissor({ isOpen, onClose, onSuccess, emissor, mode }: ModalEmissorProps) {
  const [formData, setFormData] = React.useState({
    cpf: '',
    nome: '',
    email: '',
    senha: ''
  })

  React.useEffect(() => {
    if (mode === 'edit' && emissor) {
      setFormData({
        cpf: emissor.cpf,
        nome: emissor.nome,
        email: emissor.email,
        senha: ''
      })
    } else {
      setFormData({
        cpf: '',
        nome: '',
        email: '',
        senha: ''
      })
    }
  }, [mode, emissor, isOpen])

  if (!isOpen) return null

  const handleSubmit = async () => {
    // Validações
    if (!formData.nome || !formData.email) {
      alert('Nome e email são obrigatórios')
      return
    }

    if (mode === 'create') {
      if (!formData.cpf) {
        alert('CPF é obrigatório')
        return
      }

      if (!validarCPF(formData.cpf)) {
        alert('CPF inválido')
        return
      }
    }

    if (!validarEmail(formData.email)) {
      alert('Email inválido')
      return
    }

    try {
      let response
      if (mode === 'create') {
        response = await fetch('/api/admin/emissores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cpf: formData.cpf,
            nome: formData.nome,
            email: formData.email,
            senha: formData.senha
          })
        })
      } else {
        response = await fetch(`/api/admin/emissores/${emissor?.cpf}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formData.nome,
            email: formData.email,
            senha: formData.senha || undefined
          })
        })
      }

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        alert(mode === 'create' ? 'Emissor criado com sucesso!' : 'Emissor atualizado com sucesso!')
        onSuccess()
        onClose()
      } else {
        alert(`Erro: ${data.error || 'Erro desconhecido'}`)
      }
    } catch (error: unknown) {
      console.error('Erro:', error)
      alert(`Erro ao ${mode === 'create' ? 'criar' : 'atualizar'} emissor`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <h3 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Novo Emissor' : 'Editar Emissor'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => setFormData({...formData, cpf: (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 11)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="00000000000"
                maxLength={11}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: (e.target as HTMLInputElement).value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: (e.target as HTMLInputElement).value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="emissor@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {mode === 'create' ? 'Senha (opcional)' : 'Nova Senha (deixe em branco para não alterar)'}
            </label>
            <input
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: (e.target as HTMLInputElement).value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={mode === 'create' ? 'Padrão: 123456' : ''}
            />
          </div>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {mode === 'create' ? 'Criar' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
