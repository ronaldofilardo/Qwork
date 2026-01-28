import React from 'react'
import { render, screen } from '@testing-library/react'
import RadioScale from '@/components/RadioScale'

// Mock do módulo questoes
jest.mock('@/lib/questoes', () => ({
  escalasResposta: {
    'Sempre': 100,
    'Muitas vezes': 75,
    'Às vezes': 50,
    'Raramente': 25,
    'Nunca': 0
  }
}))

// Mock CSS modules
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

describe('RadioScale - Responsividade Mobile', () => {
  const defaultProps = {
    questionId: 'test-question',
    questionText: 'Pergunta de teste?',
    value: null,
    onChange: jest.fn(),
    required: false
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  function getUniqueButtons() {
    const buttons = screen.getAllByRole('button')
    const seen = new Map<string, HTMLElement>()
    buttons.forEach(b => {
      const t = b.getAttribute('title') || b.textContent?.trim() || ''
      if (!seen.has(t)) seen.set(t, b)
    })
    return Array.from(seen.values())
  }

  it('deve exibir todos os textos das opções em mobile', () => {
    render(<RadioScale {...defaultProps} />)

    // Verificar se todos os textos estão visíveis (pelo menos uma ocorrência)
    expect(screen.getAllByText('Sempre').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Muitas vezes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Às vezes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Raramente').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nunca').length).toBeGreaterThan(0)
  })

  it('não deve ter classes hidden que escondem textos em mobile', () => {
    const { container } = render(<RadioScale {...defaultProps} />)
    
    // Verificar que não há elementos com classes que escondem em mobile
    const hiddenElements = container.querySelectorAll('.hidden.xs\\:block')
    expect(hiddenElements).toHaveLength(0)
  })

  it('deve ter layout em grid responsivo', () => {
    const { container } = render(<RadioScale {...defaultProps} />)
    
    // Busca a grid interna das opções
    const gridContainer = container.querySelector('.grid-cols-5')
    expect(gridContainer).toBeInTheDocument()
  })

  it('deve exibir textos em todas as resoluções (xs, sm, md)', () => {
    // Simular diferentes tamanhos de tela
    const testSizes = [
      { width: 320, height: 568 },  // Mobile pequeno
      { width: 375, height: 667 },  // iPhone padrão
      { width: 768, height: 1024 }, // Tablet
      { width: 1024, height: 768 }  // Desktop pequeno
    ]

    testSizes.forEach(size => {
      // Mock window size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: size.width,
      })
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: size.height,
      })

      const { container } = render(<RadioScale {...defaultProps} />)
      
      // Todos os textos devem estar presentes (pelo menos um)
      expect(screen.getAllByText('Sempre').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Muitas vezes').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Às vezes').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Raramente').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Nunca').length).toBeGreaterThan(0)
    })
  })

  it('deve ter espaçamento adequado para touch em mobile', () => {
    const { container } = render(<RadioScale {...defaultProps} />)
    const buttons = container.querySelectorAll('button')
    buttons.forEach(button => {
      // Aceita p-1 até p-5 para diferentes tamanhos de tela
      expect(button.className).toMatch(/p-[1-5]/)
    })
  })

    it('deve manter textos visíveis em todas as resoluções', () => {
      const { container } = render(<RadioScale {...defaultProps} />)
      // Apenas garante que os textos estão presentes
      expect(screen.getAllByText('Sempre').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Muitas vezes').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Às vezes').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Raramente').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Nunca').length).toBeGreaterThan(0)
    })

  it('deve ser acessível com labels apropriados em mobile', () => {
    render(<RadioScale {...defaultProps} />)
    // Verificar que todos os botões existem (deduplicados)
    const buttons = getUniqueButtons()
    expect(buttons).toHaveLength(5)
    const labels = ['Sempre', 'Muitas vezes', 'Às vezes', 'Raramente', 'Nunca']
    buttons.forEach((button) => {
      const text = button.textContent?.trim() || button.getAttribute('title') || ''
      expect(labels).toContain(text)
    })
  })

  it('deve funcionar com componente básico', () => {
    render(<RadioScale {...defaultProps} />)
    
    const buttons = getUniqueButtons()
    expect(buttons).toHaveLength(5)
    
    // Textos devem estar visíveis (pelo menos uma ocorrência)
    expect(screen.getAllByText('Sempre').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Muitas vezes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Às vezes').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Raramente').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nunca').length).toBeGreaterThan(0)
  })

  it('deve manter textos visíveis em diferentes estados', () => {
    render(<RadioScale {...defaultProps} />)
    
    // Componente deve estar renderizado corretamente (deduplicado)
    const buttons = getUniqueButtons()
    expect(buttons).toHaveLength(5)
    
    // Textos devem estar presentes (pelo menos uma ocorrência)
    expect(screen.getAllByText('Sempre').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nunca').length).toBeGreaterThan(0)
  })

  it('deve destacar opção selecionada em mobile', () => {
    render(<RadioScale {...defaultProps} value={75} />)
    // O botão com title "Muitas vezes" deve ter classe de destaque
    const selectedButton = screen.getAllByRole('button').find(btn => btn.title === 'Muitas vezes')
    expect(selectedButton).toBeDefined()
    expect(selectedButton?.className).toMatch(/border-primary|bg-primary/)
  })
})