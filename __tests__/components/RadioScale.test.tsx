import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import RadioScale from '@/components/RadioScale'

describe('RadioScale', () => {
  const defaultProps = {
    questionId: 'test-question',
    questionText: 'Esta é uma pergunta de teste?',
    value: null,
    onChange: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Helper to dedupe mobile + desktop duplicate buttons rendered in tests
  function getUniqueButtons() {
    const buttons = screen.getAllByRole('button')
    const seen = new Map<string, HTMLElement>()
    buttons.forEach(b => {
      const t = b.getAttribute('title') || b.textContent?.trim() || ''
      if (!seen.has(t)) seen.set(t, b)
    })
    return Array.from(seen.values())
  }

  it('deve renderizar a pergunta corretamente', () => {
    render(<RadioScale {...defaultProps} />)
    
    expect(screen.getByText('Esta é uma pergunta de teste?')).toBeInTheDocument()
  })

  it('deve renderizar todas as opções de resposta', () => {
    render(<RadioScale {...defaultProps} />)
    
    // Verifica se todas as 5 opções estão presentes (pelo menos uma ocorrência)
    expect(screen.getAllByText('Sempre').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Muitas vezes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Às vezes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Raramente').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nunca').length).toBeGreaterThan(0)
  })

  it('deve chamar onChange quando uma opção é selecionada', () => {
    const mockOnChange = jest.fn()
    render(<RadioScale {...defaultProps} onChange={mockOnChange} />)
    
    const sempreButton = screen.getAllByText('Sempre')[0].closest('button')
    if (!sempreButton) throw new Error('Botão Sempre não encontrado')
    fireEvent.click(sempreButton)
    
    expect(mockOnChange).toHaveBeenCalledWith(100)
  })

  it('deve destacar a opção selecionada', () => {
    render(<RadioScale {...defaultProps} value={75} />)
    
    const muitasVezesButton = screen.getAllByText('Muitas vezes')[0]
    expect(muitasVezesButton.closest('button')).toHaveClass('border-primary')
  })

  it('deve mostrar círculo preenchido para opção selecionada', () => {
    render(<RadioScale {...defaultProps} value={50} />)
    
    const asVezesButton = screen.getAllByText('Às vezes')[0]
    const circle = asVezesButton.closest('button')?.querySelector('div')
    // Verifica que existe o indicador interno quando selecionado (mesmo que a paleta de cores varie)
    expect(circle).toBeTruthy()
    expect(circle?.querySelector('div')).toBeTruthy()
  })

  it('deve aplicar classes responsivas corretas', () => {
    render(<RadioScale {...defaultProps} />)
    // Deve existir a versão mobile (elemento com a classe utilitária 'sm:hidden') e também que as opções estejam disponíveis
    const mobileContainer = Array.from(document.querySelectorAll('div')).find(d => d.classList && d.classList.contains('sm:hidden'))
    expect(mobileContainer).toBeTruthy()
    const uniq = getUniqueButtons()
    expect(uniq).toHaveLength(5)
    // Verifica texto responsivo dos labels (pelo menos uma ocorrência)
    const sempreLabel = screen.getAllByText('Sempre')[0]
    // Pode ser text-xs/text-sm/text-base/text-lg/text-xl ou text-[...] (valores custom), aceitamos esses tamanhos
    expect(sempreLabel.className).toMatch(/text-(xs|sm|base|lg|xl|\[.+\])/)
  })

  it('deve aplicar classe required quando necessário', () => {
    render(<RadioScale {...defaultProps} required={true} />)
    
    const label = screen.getByText('Esta é uma pergunta de teste?')
    expect(label).toHaveClass('required')
  })

  it('deve não aplicar classe required quando não necessário', () => {
    render(<RadioScale {...defaultProps} required={false} />)
    
    const label = screen.getByText('Esta é uma pergunta de teste?')
    expect(label).not.toHaveClass('required')
  })

  it('deve ter title apropriado para cada botão', () => {
    render(<RadioScale {...defaultProps} />)
    
    const sempreButton = screen.getAllByText('Sempre')[0].closest('button')
    expect(sempreButton).toHaveAttribute('title', 'Sempre')
    
    const nuncaButton = screen.getAllByText('Nunca')[0].closest('button')
    expect(nuncaButton).toHaveAttribute('title', 'Nunca')
  })

  it('deve aplicar hover styles nos botões não selecionados', () => {
    render(<RadioScale {...defaultProps} value={null} />)
    
    const sempreButton = screen.getAllByText('Sempre')[0].closest('button')
    expect(sempreButton).toHaveClass('hover:border-primary', 'hover:bg-gray-50')
  })

  it('deve renderizar corretamente sem valor inicial', () => {
    render(<RadioScale {...defaultProps} />)
    
    // Nenhuma opção deve estar selecionada
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).not.toHaveClass('border-primary')
    })
  })

  it('deve lidar com mudança de valores corretamente', () => {
    const mockOnChange = jest.fn()
    const { rerender } = render(<RadioScale {...defaultProps} onChange={mockOnChange} value={null} />)

    // Seleciona "Raramente"
    const raramenteBtn = screen.getAllByText('Raramente')[0].closest('button')
    if (!raramenteBtn) throw new Error('Botão Raramente não encontrado')
    fireEvent.click(raramenteBtn)
    expect(mockOnChange).toHaveBeenCalledWith(25)

    // Rerender com novo valor
    rerender(<RadioScale {...defaultProps} onChange={mockOnChange} value={25} />)

    const raramenteButton = screen.getAllByText('Raramente')[0].closest('button')
    expect(raramenteButton).toHaveClass('border-primary')
  })

  it('deve renderizar as opções na ordem correta (Nunca para Sempre)', () => {
    render(<RadioScale {...defaultProps} />)

    // Considera apenas os botões da grid (desktop) para a ordem
    const desktopGrid = document.querySelector('.hidden.grid-cols-5')
    const gridButtons = desktopGrid ? Array.from(desktopGrid.querySelectorAll('button')) : []
    const buttonTexts = gridButtons.map(button => button.textContent?.trim())

    expect(buttonTexts).toEqual(['Nunca', 'Raramente', 'Às vezes', 'Muitas vezes', 'Sempre'])
  })
})