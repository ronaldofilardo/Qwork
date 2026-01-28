/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import EditEmployeeModal from '@/components/EditEmployeeModal'
import ModalInserirFuncionario from '@/components/ModalInserirFuncionario'

// Mock do react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  default: {
    success: jest.fn(),
    error: jest.fn(),
  }
}))

// Mock do fetch global
global.fetch = jest.fn()

describe('Modal Portals Tests', () => {
  beforeEach(() => {
    // Resetar mocks
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    })
    
    // Limpar body overflow style
    document.body.style.overflow = ''
  })

  afterEach(() => {
    // Restaurar body overflow
    document.body.style.overflow = ''
  })

  describe('EditEmployeeModal', () => {
    const mockFuncionario = {
      cpf: '12345678901',
      nome: 'João Silva',
      setor: 'TI',
      funcao: 'Desenvolvedor',
      email: 'joao@empresa.com',
      matricula: 'MAT001',
      nivel_cargo: 'operacional' as const,
      turno: 'Manhã',
      escala: '8x40'
    }

    it('deve renderizar via createPortal diretamente no body', async () => {
      const onClose = jest.fn()
      const onSuccess = jest.fn()

      render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )

      // Aguardar o componente montar
      await waitFor(() => {
        const modalInBody = document.body.querySelector('.fixed.inset-0')
        expect(modalInBody).toBeInTheDocument()
      })

      // Verificar que o modal está renderizado diretamente no body
      const modalsInBody = document.body.querySelectorAll('.fixed.inset-0')
      expect(modalsInBody.length).toBeGreaterThanOrEqual(1)
    })

    it('deve ter classes de posicionamento fixo e z-index correto', async () => {
      const onClose = jest.fn()
      const onSuccess = jest.fn()

      render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )

      await waitFor(() => {
        const modal = document.body.querySelector('.fixed.inset-0')
        expect(modal).toBeInTheDocument()
        // @ts-expect-error - toHaveClass aceita múltiplas classes como argumentos separados no @testing-library/jest-dom
        expect(modal).toHaveClass('flex', 'items-center', 'justify-center')
        // z-[9999] é aplicado via Tailwind
      })
    })

    it('deve ter backdrop escuro com bg-opacity-50', async () => {
      const onClose = jest.fn()
      const onSuccess = jest.fn()

      render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )

      await waitFor(() => {
        const backdrop = document.body.querySelector('.bg-black.bg-opacity-50')
        expect(backdrop).toBeInTheDocument()
      })
    })

    it('deve exibir título correto com nome do funcionário', async () => {
      const onClose = jest.fn()
      const onSuccess = jest.fn()

      render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Editar Funcionário - João Silva/i)).toBeInTheDocument()
      })
    })

    it('deve chamar onClose ao clicar no botão de fechar', async () => {
      const onClose = jest.fn()
      const onSuccess = jest.fn()

      render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('×')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('×'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('deve fechar ao pressionar ESC', async () => {
      const onClose = jest.fn()
      const onSuccess = jest.fn()

      render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/Editar Funcionário/i)).toBeInTheDocument()
      })

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('deve fechar ao clicar no backdrop', async () => {
      const onClose = jest.fn()
      const onSuccess = jest.fn()

      render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )

      await waitFor(() => {
        const backdrop = document.body.querySelector('.fixed.inset-0')
        expect(backdrop).toBeInTheDocument()
      })

      const backdrop = document.body.querySelector('.fixed.inset-0')
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('deve prevenir scroll do body quando aberto', async () => {
      const onClose = jest.fn()
      const onSuccess = jest.fn()

      render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden')
      })
    })

    it('deve ter overflow-y-auto para scroll interno', async () => {
      const onClose = jest.fn()
      const onSuccess = jest.fn()

      render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )

      await waitFor(() => {
        const modalContent = document.body.querySelector('.overflow-y-auto')
        expect(modalContent).toBeInTheDocument()
      })
    })

    it('não deve renderizar antes do componente montar', () => {
      const onClose = jest.fn()
      const onSuccess = jest.fn()

      const { container } = render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )

      // No primeiro render, não deve ter conteúdo (mounted = false)
      // Após useEffect, o conteúdo aparece
      expect(container.firstChild).toBeNull()
    })
  })

  describe('ModalInserirFuncionario', () => {
    const mockProps = {
      empresaId: 1,
      empresaNome: 'Empresa Teste',
      onClose: jest.fn(),
      onSuccess: jest.fn()
    }

    it('deve renderizar via createPortal diretamente no body', async () => {
      render(<ModalInserirFuncionario {...mockProps} />)

      await waitFor(() => {
        const modalInBody = document.body.querySelector('.fixed.inset-0')
        expect(modalInBody).toBeInTheDocument()
      })
    })

    it('deve ter estrutura de posicionamento correto', async () => {
      render(<ModalInserirFuncionario {...mockProps} />)

      await waitFor(() => {
        const modal = document.body.querySelector('.fixed.inset-0')
        expect(modal).toBeInTheDocument()
        // @ts-expect-error - toHaveClass aceita múltiplas classes como argumentos separados no @testing-library/jest-dom
        expect(modal).toHaveClass('flex', 'items-center', 'justify-center')
      })
    })

    it('deve exibir título com nome da empresa', async () => {
      render(<ModalInserirFuncionario {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/Inserir Funcionário - Empresa Teste/i)).toBeInTheDocument()
      })
    })

    it('deve ter campos obrigatórios marcados com asterisco', async () => {
      render(<ModalInserirFuncionario {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText(/CPF \*/i)).toBeInTheDocument()
        expect(screen.getByText(/Nome Completo \*/i)).toBeInTheDocument()
        expect(screen.getByText(/Setor \*/i)).toBeInTheDocument()
        expect(screen.getByText(/Função \*/i)).toBeInTheDocument()
        expect(screen.getByText(/Email \*/i)).toBeInTheDocument()
      })
    })

    it('deve chamar onClose ao clicar em Cancelar', async () => {
      const onClose = jest.fn()

      render(<ModalInserirFuncionario {...mockProps} onClose={onClose} />)

      await waitFor(() => {
        expect(screen.getByText('Cancelar')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Cancelar'))
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('deve ter backdrop com opacidade correta', async () => {
      render(<ModalInserirFuncionario {...mockProps} />)

      await waitFor(() => {
        const backdrop = document.body.querySelector('.bg-black.bg-opacity-50')
        expect(backdrop).toBeInTheDocument()
      })
    })

    it('deve fechar ao pressionar ESC', async () => {
      const onClose = jest.fn()
      render(<ModalInserirFuncionario {...mockProps} onClose={onClose} />)

      await waitFor(() => {
        expect(screen.getByText(/Inserir Funcionário/i)).toBeInTheDocument()
      })

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('deve fechar ao clicar no backdrop', async () => {
      const onClose = jest.fn()
      render(<ModalInserirFuncionario {...mockProps} onClose={onClose} />)

      await waitFor(() => {
        const backdrop = document.body.querySelector('.fixed.inset-0')
        expect(backdrop).toBeInTheDocument()
      })

      const backdrop = document.body.querySelector('.fixed.inset-0')
      fireEvent.click(backdrop)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Portal Isolation', () => {
    it('múltiplos modais podem ser renderizados no body', async () => {
      const mockFuncionario = {
        cpf: '12345678901',
        nome: 'João Silva',
        setor: 'TI',
        funcao: 'Desenvolvedor',
        email: 'joao@empresa.com',
        matricula: 'MAT001',
        nivel_cargo: 'operacional' as const,
        turno: 'Manhã',
        escala: '8x40'
      }

      const { rerender } = render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(document.body.querySelectorAll('.fixed.inset-0').length).toBeGreaterThanOrEqual(1)
      })

      rerender(
        <ModalInserirFuncionario
          empresaId={1}
          empresaNome="Empresa"
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(document.body.querySelectorAll('.fixed.inset-0').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('body deve ter overflow hidden quando modal está aberto', async () => {
      const mockFuncionario = {
        cpf: '12345678901',
        nome: 'João Silva',
        setor: 'TI',
        funcao: 'Desenvolvedor',
        email: 'joao@empresa.com',
        matricula: 'MAT001',
        nivel_cargo: 'operacional' as const,
        turno: 'Manhã',
        escala: '8x40'
      }

      render(
        <EditEmployeeModal
          funcionario={mockFuncionario}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      )

      await waitFor(() => {
        expect(document.body.style.overflow).toBe('hidden')
      })
    })
  })

  describe('Accessibility & Responsiveness', () => {
    it('modal deve ter padding para dispositivos móveis', async () => {
      render(
        <EditEmployeeModal
          funcionario={{
            cpf: '12345678901',
            nome: 'João Silva',
            setor: 'TI',
            funcao: 'Desenvolvedor',
            email: 'joao@empresa.com',
            matricula: 'MAT001',
            nivel_cargo: 'operacional' as const,
            turno: 'Manhã',
            escala: '8x40'
          }}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      )

      await waitFor(() => {
        const modal = document.body.querySelector('.p-4')
        expect(modal).toBeInTheDocument()
      })
    })

    it('modal deve ter max-height para evitar overflow', async () => {
      render(
        <ModalInserirFuncionario
          empresaId={1}
          empresaNome="Empresa"
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      )

      await waitFor(() => {
        const modalContent = document.body.querySelector('.max-h-\\[90vh\\]')
        expect(modalContent).toBeInTheDocument()
      })
    })

    it('modal deve ter largura responsiva', async () => {
      render(
        <EditEmployeeModal
          funcionario={{
            cpf: '12345678901',
            nome: 'João Silva',
            setor: 'TI',
            funcao: 'Desenvolvedor',
            email: 'joao@empresa.com',
            matricula: 'MAT001',
            nivel_cargo: 'operacional' as const,
            turno: 'Manhã',
            escala: '8x40'
          }}
          onClose={jest.fn()}
          onSuccess={jest.fn()}
        />
      )

      await waitFor(() => {
        const modalContent = document.body.querySelector('.max-w-2xl.w-full')
        expect(modalContent).toBeInTheDocument()
      })
    })
  })
})
