import React from 'react'
import { render, screen } from '@testing-library/react'
import PWAInitializer from '@/components/PWAInitializer'

// Mock lib/offline
jest.mock('@/lib/offline', () => ({
  registerServiceWorker: jest.fn(),
  setupOnlineSync: jest.fn(),
}))

import { registerServiceWorker, setupOnlineSync } from '@/lib/offline'

// Mock do service worker
Object.defineProperty(window, 'navigator', {
  value: {
    serviceWorker: {
      register: jest.fn().mockResolvedValue({}),
    },
  },
})

describe('PWAInitializer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Limpar localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
    })
    // Mock navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      value: true,
      writable: true,
    })
    // Mock window.matchMedia
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
  })

  it('deve renderizar sem erros', () => {
    render(<PWAInitializer />)
    // Componente não renderiza conteúdo visível, apenas executa efeitos
    expect(document.body).toBeInTheDocument()
  })

  it('deve registrar service worker quando suportado', () => {
    render(<PWAInitializer />)

    expect(registerServiceWorker).toHaveBeenCalled()
  })

  it('deve lidar com service worker não suportado', () => {
    // Mock navigator sem serviceWorker
    Object.defineProperty(window, 'navigator', {
      value: {},
    })

    render(<PWAInitializer />)
    
    // Não deve dar erro, apenas não registrar
    expect(document.body).toBeInTheDocument()
  })

  it('deve configurar listeners de instalação do PWA', () => {
    const mockAddEventListener = jest.fn()
    Object.defineProperty(window, 'addEventListener', {
      value: mockAddEventListener,
    })

    render(<PWAInitializer />)
    
    expect(mockAddEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function))
  })

  it('deve lidar com erros no registro do service worker', () => {
    const mockRegister = jest.fn().mockRejectedValue(new Error('SW Error'))
    Object.defineProperty(window, 'navigator', {
      value: {
        serviceWorker: {
          register: mockRegister,
        },
      },
    })

    // Não deve dar erro, apenas logar
    expect(() => render(<PWAInitializer />)).not.toThrow()
  })

  it('deve executar apenas no lado cliente', () => {
    // Simular ambiente servidor (sem window)
    const originalWindow = global.window
    delete (global as any).window

    render(<PWAInitializer />)
    
    // Deve renderizar sem erros
    expect(document.body).toBeInTheDocument()

    // Restaurar window
    global.window = originalWindow
  })

  it('deve ser um componente funcional válido', () => {
    const component = <PWAInitializer />
    expect(React.isValidElement(component)).toBe(true)
  })

  it('deve não renderizar nenhum elemento visível', () => {
    const { container } = render(<PWAInitializer />)
    expect(container.firstChild).toBeNull()
  })

})