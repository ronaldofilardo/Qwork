import { renderHook, act, waitFor } from '@testing-library/react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

describe('usePWAInstall', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window.matchMedia
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

  it('deve inicializar com canInstall=false', () => {
    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.canInstall).toBe(false);
  });

  it('deve detectar beforeinstallprompt e habilitar instalação', () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it('deve chamar prompt ao clicar em handleInstallClick', async () => {
    const mockPrompt = jest.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const });

    const { result } = renderHook(() => usePWAInstall());

    // Simular beforeinstallprompt
    act(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.prompt = mockPrompt;
      event.userChoice = mockUserChoice;
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.handleInstallClick();
    });

    expect(mockPrompt).toHaveBeenCalled();
  });

  it('deve desabilitar instalação após sucesso', async () => {
    const mockPrompt = jest.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const });

    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.prompt = mockPrompt;
      event.userChoice = mockUserChoice;
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);

    await act(async () => {
      await result.current.handleInstallClick();
    });

    await waitFor(() => {
      expect(result.current.canInstall).toBe(false);
    });
  });

  it('deve desabilitar ao chamar dismissPrompt', () => {
    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event('beforeinstallprompt');
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);

    act(() => {
      result.current.dismissPrompt();
    });

    expect(result.current.canInstall).toBe(false);
  });

  it('deve desabilitar se já está instalado como standalone', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => {
        if (query === '(display-mode: standalone)') {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
          };
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      }),
    });

    const { result } = renderHook(() => usePWAInstall());
    expect(result.current.canInstall).toBe(false);
  });

  it('deve remover event listener ao desmontar', () => {
    const mockRemoveEventListener = jest.fn();
    const originalRemoveEventListener = window.removeEventListener;
    window.removeEventListener = mockRemoveEventListener;

    const { unmount } = renderHook(() => usePWAInstall());
    unmount();

    expect(mockRemoveEventListener).toHaveBeenCalledWith(
      'beforeinstallprompt',
      expect.any(Function)
    );

    window.removeEventListener = originalRemoveEventListener;
  });

  it('deve lidar com erro ao instalar', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockPrompt = jest.fn().mockRejectedValue(new Error('Install failed'));

    const { result } = renderHook(() => usePWAInstall());

    act(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.prompt = mockPrompt;
      window.dispatchEvent(event);
    });

    await act(async () => {
      await result.current.handleInstallClick();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Erro ao instalar PWA:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});
