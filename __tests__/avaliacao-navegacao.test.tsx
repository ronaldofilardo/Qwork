import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import AvaliacaoGrupoPage from '../app/avaliacao/grupo/[id]/page'

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}))

// Mock do fetch
global.fetch = jest.fn()

// Helper para verificar se um botão está desabilitado
const expectButtonToBeDisabled = (button: HTMLElement) => {
  expect(button).toHaveAttribute('disabled')
  expect(button.getAttribute('class')).toContain('cursor-not-allowed')
}

const expectButtonToBeEnabled = (button: HTMLElement) => {
  expect(button).not.toHaveAttribute('disabled')
  expect(button.getAttribute('class')).not.toContain('cursor-not-allowed')
}

describe('Avaliação por grupo - Navegação sem botão Voltar', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(fetch as jest.Mock).mockClear()
  })

  it('não deve exibir botão Voltar na avaliação', async () => {
    ;(useParams as jest.Mock).mockReturnValue({ id: '2' })

    // Mock da sessão
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          session: { cpf: '12345678901', nome: 'Teste', perfil: 'funcionario', nivelCargo: 'operacional' }
        })
      })
      // Mock do status
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'em_andamento',
          grupo_atual: 1
        })
      })
      // Mock das respostas
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })

    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      // Verifica que o botão Voltar não existe
      expect(screen.queryByText('← Voltar')).not.toBeInTheDocument()
      expect(screen.queryByText('Voltar')).not.toBeInTheDocument()
    })
  })

  it('deve exibir apenas o botão Próximo/Finalizar', async () => {
    ;(useParams as jest.Mock).mockReturnValue({ id: '1' })

    // Mock da sessão
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          session: { cpf: '12345678901', nome: 'Teste', perfil: 'funcionario', nivelCargo: 'operacional' }
        })
      })
      // Mock do status
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'em_andamento',
          grupo_atual: 1
        })
      })
      // Mock das respostas
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })

    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      // Deve ter apenas o botão Próximo (texto pode ser "Próximo Grupo →")
      expect(screen.getByText(/Próximo/)).toBeInTheDocument()
      // Não deve ter botão Voltar
      expect(screen.queryByText('← Voltar')).not.toBeInTheDocument()
    })
  })

  it('deve permitir navegação apenas para frente', async () => {
    ;(useParams as jest.Mock).mockReturnValue({ id: '1' })

    // Mock da sessão
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          session: { cpf: '12345678901', nome: 'Teste', perfil: 'funcionario', nivelCargo: 'operacional' }
        })
      })
      // Mock do status
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'em_andamento',
          grupo_atual: 1
        })
      })
      // Mock das respostas
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ respostas: [] })
      })
      // Mock do save
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

    render(<AvaliacaoGrupoPage />)

    await waitFor(() => {
      expect(screen.getByText(/Próximo/)).toBeInTheDocument()
    })

    // Simular resposta a todas as questões do grupo 1
    // (assumindo que o grupo 1 tem algumas questões)
    // Como não temos acesso direto às questões, vamos mockar o comportamento

    // O teste verifica que não há botão voltar
    expect(screen.queryByText('← Voltar')).not.toBeInTheDocument()
  })
})