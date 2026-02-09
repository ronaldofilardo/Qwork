import React from 'react';
import { render, screen } from '@testing-library/react';
import PWAInitializer from '@/components/PWAInitializer';

// Mock lib/offline
jest.mock('@/lib/offline', () => ({
  registerServiceWorker: jest.fn(),
  setupOnlineSync: jest.fn(),
  syncIndicesFuncionarios: jest.fn(),
}));

import {
  registerServiceWorker,
  setupOnlineSync,
  syncIndicesFuncionarios,
} from '@/lib/offline';

// Mock do service worker
Object.defineProperty(window, 'navigator', {
  value: {
    serviceWorker: {
      register: jest.fn().mockResolvedValue({}),
    },
    onLine: true,
  },
  writable: true,
});

describe('PWAInitializer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpar localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      configurable: true,
    });
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it('deve renderizar sem erros', () => {
    render(<PWAInitializer />);
    // Componente não renderiza conteúdo visível, apenas executa efeitos
    expect(document.body).toBeInTheDocument();
  });

  it('deve registrar service worker quando suportado', () => {
    render(<PWAInitializer />);

    expect(registerServiceWorker).toHaveBeenCalled();
  });

  it('deve configurar sincronização online ao renderizar', () => {
    render(<PWAInitializer />);

    expect(setupOnlineSync).toHaveBeenCalled();
  });

  it('deve configurar listeners online/offline', () => {
    const mockAddEventListener = jest.fn();
    Object.defineProperty(window, 'addEventListener', {
      value: mockAddEventListener,
      writable: true,
    });

    render(<PWAInitializer />);

    expect(mockAddEventListener).toHaveBeenCalledWith(
      'online',
      expect.any(Function)
    );
    expect(mockAddEventListener).toHaveBeenCalledWith(
      'offline',
      expect.any(Function)
    );
  });

  it('deve lidar com erros no registro do service worker', () => {
    const mockRegister = jest.fn().mockRejectedValue(new Error('SW Error'));
    Object.defineProperty(window, 'navigator', {
      value: {
        serviceWorker: {
          register: mockRegister,
        },
        onLine: true,
      },
      writable: true,
    });

    // Não deve dar erro, apenas logar
    expect(() => render(<PWAInitializer />)).not.toThrow();
  });

  it('deve ser um componente funcional válido', () => {
    const component = <PWAInitializer />;
    expect(React.isValidElement(component)).toBe(true);
  });

  it('deve renderizar apenas o indicador de status offline quando offline', () => {
    // Simular navegador offline
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
    });

    const { container } = render(<PWAInitializer />);

    // Deve ter um elemento visível (indicador de offline)
    const offlineIndicator = container.querySelector('.bg-yellow-500');
    expect(offlineIndicator).toBeInTheDocument();
  });

  it('não deve renderizar prompt de instalação flutuante', () => {
    render(<PWAInitializer />);

    // Não deve haver div com "Instalar App" (prompt flutuante removido)
    expect(screen.queryByText('Instalar App')).not.toBeInTheDocument();
  });

  it('deve remover event listeners ao desmontar', () => {
    const mockRemoveEventListener = jest.fn();
    Object.defineProperty(window, 'removeEventListener', {
      value: mockRemoveEventListener,
      writable: true,
    });

    const { unmount } = render(<PWAInitializer />);

    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'online',
      expect.any(Function)
    );
    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'offline',
      expect.any(Function)
    );
  });
});
