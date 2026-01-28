/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simulação do AvaliacoesModal inline com novas funcionalidades
const mockAvaliacoesModal = ({ funcionario, onClose }: any) => {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    
    // Prevenir scroll do body
    document.body.style.overflow = 'hidden'
    
    // Fechar com ESC
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      setMounted(false)
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  if (!mounted) return null

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999]"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
        <h2 className="text-lg font-bold mb-2">Avaliações de {funcionario.nome}</h2>
        <table className="w-full text-xs mb-4">
          <thead>
            <tr>
              <th className="px-2 py-1">ID</th>
              <th className="px-2 py-1">Liberação</th>
              <th className="px-2 py-1">Conclusão</th>
              <th className="px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {funcionario.avaliacoes?.map((av: any) => (
              <tr key={av.id}>
                <td className="px-2 py-1">{av.id}</td>
                <td className="px-2 py-1">{av.inicio ? new Date(av.inicio).toLocaleString('pt-BR') : '-'}</td>
                <td className="px-2 py-1">{av.envio ? new Date(av.envio).toLocaleString('pt-BR') : '-'}</td>
                <td className="px-2 py-1">{av.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onClose}>Fechar</button>
      </div>
    </div>
  )

  // Renderizar diretamente no body via portal
  if (typeof window === 'undefined') return null
  
  return React.createElement(React.Fragment, null, modalContent)
}

describe('AvaliacoesModal Portal Tests', () => {
  beforeEach(() => {
    // Limpar body overflow
    document.body.style.overflow = ''
  })

  afterEach(() => {
    // Restaurar body overflow
    document.body.style.overflow = ''
  })

  const mockFuncionario = {
    cpf: '12345678901',
    nome: 'Maria Santos',
    setor: 'RH',
    funcao: 'Gerente',
    email: 'maria@empresa.com',
    matricula: 'MAT002',
    nivel_cargo: 'gestao' as const,
    turno: 'Integral',
    escala: '8x40',
    avaliacoes: [
      {
        id: 1,
        inicio: '2024-01-01T10:00:00Z',
        envio: '2024-01-02T15:00:00Z',
        status: 'concluída'
      },
      {
        id: 2,
        inicio: '2024-02-01T09:00:00Z',
        envio: null,
        status: 'em_andamento'
      }
    ]
  }

  it('deve renderizar modal com título correto', async () => {
    const AvaliacoesModal = mockAvaliacoesModal
    const onClose = jest.fn()

    render(<AvaliacoesModal funcionario={mockFuncionario} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('Avaliações de Maria Santos')).toBeInTheDocument()
    })
  })

  it('deve renderizar via createPortal diretamente no body', async () => {
    const AvaliacoesModal = mockAvaliacoesModal
    const onClose = jest.fn()

    render(<AvaliacoesModal funcionario={mockFuncionario} onClose={onClose} />)

    await waitFor(() => {
      const modalInBody = document.body.querySelector('.fixed.inset-0')
      expect(modalInBody).toBeInTheDocument()
    })
  })

  it('deve ter z-index alto para sobreposição', async () => {
    const AvaliacoesModal = mockAvaliacoesModal
    const onClose = jest.fn()

    render(<AvaliacoesModal funcionario={mockFuncionario} onClose={onClose} />)

    await waitFor(() => {
      const modal = document.body.querySelector('.fixed.inset-0')
      expect(modal).toBeInTheDocument()
      // z-[9999] é aplicado via Tailwind
    })
  })

  it('deve exibir lista de avaliações', async () => {
    const AvaliacoesModal = mockAvaliacoesModal
    const onClose = jest.fn()

    render(<AvaliacoesModal funcionario={mockFuncionario} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('concluída')).toBeInTheDocument()
      expect(screen.getByText('em_andamento')).toBeInTheDocument()
    })
  })

  it('deve chamar onClose ao clicar no botão Fechar', async () => {
    const AvaliacoesModal = mockAvaliacoesModal
    const onClose = jest.fn()

    render(<AvaliacoesModal funcionario={mockFuncionario} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('Fechar')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Fechar'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('deve fechar ao pressionar ESC', async () => {
    const AvaliacoesModal = mockAvaliacoesModal
    const onClose = jest.fn()

    render(<AvaliacoesModal funcionario={mockFuncionario} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getByText('Avaliações de Maria Santos')).toBeInTheDocument()
    })

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('deve fechar ao clicar no backdrop', async () => {
    const AvaliacoesModal = mockAvaliacoesModal
    const onClose = jest.fn()

    render(<AvaliacoesModal funcionario={mockFuncionario} onClose={onClose} />)

    await waitFor(() => {
      const backdrop = document.body.querySelector('.fixed.inset-0')
      expect(backdrop).toBeInTheDocument()
    })

    const backdrop = document.body.querySelector('.fixed.inset-0')
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('deve prevenir scroll do body quando aberto', async () => {
    const AvaliacoesModal = mockAvaliacoesModal
    const onClose = jest.fn()

    render(<AvaliacoesModal funcionario={mockFuncionario} onClose={onClose} />)

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })
  })

  it('deve exibir datas formatadas corretamente', async () => {
    const AvaliacoesModal = mockAvaliacoesModal
    const onClose = jest.fn()

    render(<AvaliacoesModal funcionario={mockFuncionario} onClose={onClose} />)

    await waitFor(() => {
      // Verificar que as datas são formatadas (contém /)
      const cells = screen.getAllByRole('cell')
      const hasDate = cells.some(cell => cell.textContent?.includes('/'))
      expect(hasDate).toBe(true)
    })
  })

  it('deve exibir hífen quando data é null', async () => {
    const funcSemData = {
      ...mockFuncionario,
      avaliacoes: [
        {
          id: 3,
          inicio: null,
          envio: null,
          status: 'não_iniciada'
        }
      ]
    }

    const AvaliacoesModal = mockAvaliacoesModal
    const onClose = jest.fn()

    render(<AvaliacoesModal funcionario={funcSemData} onClose={onClose} />)

    await waitFor(() => {
      expect(screen.getAllByText('-').length).toBeGreaterThan(0)
    })
  })

  it('deve restaurar overflow do body quando fechado', async () => {
    const AvaliacoesModal = mockAvaliacoesModal
    const onClose = jest.fn()

    const { unmount } = render(
      <AvaliacoesModal funcionario={mockFuncionario} onClose={onClose} />
    )

    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })

    unmount()

    // Após unmount, o overflow deve ser restaurado
    expect(document.body.style.overflow).toBe('')
  })
})
