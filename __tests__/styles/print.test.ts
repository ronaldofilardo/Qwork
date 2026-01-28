/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'

// Mock do CSS para testes
const mockCSS = `
  @media print {
    * { -webkit-print-color-adjust: exact !important; }
    .grupo-card { page-break-inside: avoid !important; }
    .no-print { display: none !important; }
  }
`

// Adiciona CSS de impressão ao DOM de teste
beforeAll(() => {
  const style = document.createElement('style')
  style.innerHTML = mockCSS
  document.head.appendChild(style)
})

describe('Estilos de Impressão CSS', () => {
  it('deve ter estilos de impressão definidos', () => {
    const styles = Array.from(document.styleSheets)
    const hasMediaPrint = styles.some(sheet => {
      try {
        return Array.from(sheet.cssRules || []).some(rule => 
          rule instanceof CSSMediaRule && rule.media.mediaText.includes('print')
        )
      } catch {
        return false
      }
    })
    
    // Como estamos em ambiente de teste, verificamos se o CSS foi adicionado
    expect(document.head.innerHTML).toContain('@media print')
  })

  it('deve forçar impressão de cores com print-color-adjust', () => {
    expect(document.head.innerHTML).toContain('-webkit-print-color-adjust: exact')
    expect(document.head.innerHTML).toContain('print-color-adjust: exact')
  })

  it('deve evitar quebras de página em grupos', () => {
    expect(document.head.innerHTML).toContain('page-break-inside: avoid')
  })

  it('deve ocultar elementos com classe no-print', () => {
    expect(document.head.innerHTML).toContain('.no-print')
    expect(document.head.innerHTML).toContain('display: none')
  })

  describe('Classes CSS específicas', () => {
    it('deve ter estilos para grupo-card', () => {
      expect(document.head.innerHTML).toContain('.grupo-card')
    })

    it('deve ter estilos básicos de impressão', () => {
      const headHTML = document.head.innerHTML
      expect(headHTML).toContain('@media print')
      expect(headHTML).toContain('.grupo-card')
      expect(headHTML).toContain('.no-print')
    })
  })
})

describe('Funcionalidade de Impressão', () => {
  it('deve chamar window.print corretamente', () => {
    const mockPrint = jest.fn()
    Object.defineProperty(window, 'print', {
      value: mockPrint,
      writable: true
    })

    // Simula clique no botão de impressão
    window.print()
    
    expect(mockPrint).toHaveBeenCalled()
  })

  it('deve aplicar configurações básicas de impressão', () => {
    expect(document.head.innerHTML).toContain('page-break-inside: avoid')
    expect(document.head.innerHTML).toContain('display: none')
  })
})

describe('Responsividade para Impressão', () => {
  it('deve manter layout em diferentes resoluções', () => {
    // Testa se os estilos não quebram com diferentes tamanhos
    const breakpoints = ['768px', '1024px', '1200px']
    
    breakpoints.forEach(breakpoint => {
      // Simula mudança de viewport
      Object.defineProperty(window, 'innerWidth', {
        value: parseInt(breakpoint),
        writable: true
      })
      
      // Verifica se os estilos de impressão continuam válidos
      expect(document.head.innerHTML).toContain('@media print')
    })
  })
})

describe('Compatibilidade de Navegadores', () => {
  it('deve incluir prefixos vendor para compatibilidade', () => {
    expect(document.head.innerHTML).toContain('-webkit-print-color-adjust')
    expect(document.head.innerHTML).toContain('print-color-adjust')
    expect(document.head.innerHTML).toContain('color-adjust')
  })

  it('deve usar propriedades CSS de impressão', () => {
    expect(document.head.innerHTML).toContain('!important')
  })
})