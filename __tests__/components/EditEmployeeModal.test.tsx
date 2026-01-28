/// <reference types="@testing-library/jest-dom" />

import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditEmployeeModal from '@/components/EditEmployeeModal'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

// Mock das dependências
jest.mock('next-auth/react')
jest.mock('react-hot-toast')

// Mock do fetch global
global.fetch = jest.fn()

describe('EditEmployeeModal - Component', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
  const mockToast = toast as jest.MockedFunction<typeof toast>
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    // Configurar mocks básicos
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: 'RH Teste',
          email: 'rh@test.com'
        },
        expires: '2023-12-31T23:59:59.000Z'
      },
      status: 'authenticated',
      update: jest.fn()
    })

    mockToast.mockImplementation(() => 'id')
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: 'Funcionário atualizado com sucesso',
        funcionario: {
          cpf: '10101010101',
          nome: 'André Silva',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          email: 'andre@empresa.com'
        }
      })
    } as Response)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('deve renderizar o modal corretamente', () => {
    const { container } = render(
      <EditEmployeeModal
        onClose={() => {}}
        onSuccess={() => {}}
        funcionario={{
          cpf: '10101010101',
          nome: 'André Silva',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          email: 'andre@empresa.com',
          matricula: '12345',
          nivel_cargo: 'operacional',
          turno: 'Manhã',
          escala: '5x2'
        }}
      />
    )

    expect(screen.getByText('Editar Funcionário - André Silva')).toBeInTheDocument()
    expect(screen.getByDisplayValue('101.010.101-01')).toBeInTheDocument()
    expect(screen.getByDisplayValue('André Silva')).toBeInTheDocument()
    expect(screen.getByDisplayValue('TI')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Desenvolvedor')).toBeInTheDocument()
    expect(screen.getByDisplayValue('andre@empresa.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12345')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Operacional')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Manhã')).toBeInTheDocument()
    expect(screen.getByDisplayValue('5x2')).toBeInTheDocument()
  })

  it('deve validar campos obrigatórios', async () => {
    render(
      <EditEmployeeModal
        onClose={() => {}}
        onSuccess={() => {}}
        funcionario={{
          cpf: '10101010101',
          nome: '',
          setor: '',
          funcao: '',
          email: '',
          matricula: '',
          nivel_cargo: null,
          turno: '',
          escala: ''
        }}
      />
    )

    fireEvent.submit(document.querySelector('form'))

    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument()
    })
  })

  it('deve validar formato de email', async () => {
    render(
      <EditEmployeeModal
        onClose={() => {}}
        onSuccess={() => {}}
        funcionario={{
          cpf: '10101010101',
          nome: 'Teste',
          setor: 'TI',
          funcao: 'Dev',
          email: 'invalido',
          matricula: '',
          nivel_cargo: null,
          turno: '',
          escala: ''
        }}
      />
    )

    fireEvent.submit(document.querySelector('form'))

    await waitFor(() => {
      expect(screen.getByText('Email válido é obrigatório')).toBeInTheDocument()
    })
  })

  it('deve chamar onUpdate ao salvar com sucesso', async () => {
    const mockOnUpdate = jest.fn()
    const mockOnClose = jest.fn()
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, message: 'Funcionário atualizado com sucesso' })
    } as Response)

    render(
      <EditEmployeeModal
        onClose={mockOnClose}
        onSuccess={mockOnUpdate}
        funcionario={{
          cpf: '10101010101',
          nome: 'André Silva',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          email: 'andre@empresa.com',
          matricula: '12345',
          nivel_cargo: 'operacional',
          turno: 'Manhã',
          escala: '5x2'
        }}
      />
    )

    await user.click(screen.getByText('Atualizar Funcionário'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/rh/funcionarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpf: '10101010101',
          nome: 'André Silva',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          email: 'andre@empresa.com',
          matricula: '12345',
          nivel_cargo: 'operacional',
          turno: 'Manhã',
          escala: '5x2'
        })
      })
      expect(mockToast.success).toHaveBeenCalledWith('Funcionário atualizado com sucesso!')
      expect(mockOnUpdate).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('deve mostrar erro ao falhar na atualização', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Erro interno do servidor' })
    } as Response)

    render(
      <EditEmployeeModal
        onClose={() => {}}
        onSuccess={() => {}}
        funcionario={{
          cpf: '10101010101',
          nome: 'André Silva',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          email: 'andre@empresa.com',
          matricula: '12345',
          nivel_cargo: 'operacional',
          turno: 'Manhã',
          escala: '5x2'
        }}
      />
    )

    fireEvent.submit(document.querySelector('form'))

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Erro interno do servidor')
    })
  })

  it('deve fechar o modal ao clicar em cancelar', () => {
    const mockOnClose = jest.fn()

    render(
      <EditEmployeeModal
        onClose={mockOnClose}
        onSuccess={() => {}}
        funcionario={{
          cpf: '10101010101',
          nome: 'André Silva',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          email: 'andre@empresa.com',
          matricula: '12345',
          nivel_cargo: 'operacional',
          turno: 'Manhã',
          escala: '5x2'
        }}
      />
    )

    fireEvent.click(screen.getByText('Cancelar'))

    expect(mockOnClose).toHaveBeenCalled()
  })
})
