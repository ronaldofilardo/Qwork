import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PWAMenuItem } from '@/components/PWAMenuItem';

// Mock o hook usePWAInstall
jest.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: jest.fn(),
}));

import { usePWAInstall } from '@/hooks/usePWAInstall';

describe('PWAMenuItem', () => {
  const mockHandleInstallClick = jest.fn();
  const mockDismissPrompt = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve não renderizar quando canInstall é false', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: false,
      handleInstallClick: mockHandleInstallClick,
      dismissPrompt: mockDismissPrompt,
    });

    const { container } = render(<PWAMenuItem />);
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar botão quando canInstall é true', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: true,
      handleInstallClick: mockHandleInstallClick,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAMenuItem />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('deve mostrar texto "Instalar App" quando não colapsado', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: true,
      handleInstallClick: mockHandleInstallClick,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAMenuItem isCollapsed={false} />);

    expect(screen.getByText('Instalar App')).toBeInTheDocument();
  });

  it('deve ocultar texto quando colapsado', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: true,
      handleInstallClick: mockHandleInstallClick,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAMenuItem isCollapsed={true} />);

    expect(screen.queryByText('Instalar App')).not.toBeInTheDocument();
  });

  it('deve chamar handleInstallClick ao clicar no botão', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: true,
      handleInstallClick: mockHandleInstallClick,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAMenuItem />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockHandleInstallClick).toHaveBeenCalled();
  });

  it('deve ter classes de estilo corretas', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: true,
      handleInstallClick: mockHandleInstallClick,
      dismissPrompt: mockDismissPrompt,
    });

    const { container } = render(<PWAMenuItem />);

    const button = container.querySelector('button');
    expect(button).toHaveClass('text-blue-600');
    expect(button).toHaveClass('hover:bg-blue-50');
  });

  it('deve ter ícone de download', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: true,
      handleInstallClick: mockHandleInstallClick,
      dismissPrompt: mockDismissPrompt,
    });

    const { container } = render(<PWAMenuItem />);

    // Procura por um SVG (ícone do lucide-react)
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('deve ter tooltip correto', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: true,
      handleInstallClick: mockHandleInstallClick,
      dismissPrompt: mockDismissPrompt,
    });

    render(<PWAMenuItem />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute(
      'title',
      'Instalar aplicativo na tela inicial'
    );
  });

  it('deve aceitar className customizado', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: true,
      handleInstallClick: mockHandleInstallClick,
      dismissPrompt: mockDismissPrompt,
    });

    const { container } = render(<PWAMenuItem className="custom-class" />);

    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('deve ter layout correto quando colapsado', () => {
    (usePWAInstall as jest.Mock).mockReturnValue({
      canInstall: true,
      handleInstallClick: mockHandleInstallClick,
      dismissPrompt: mockDismissPrompt,
    });

    const { container } = render(<PWAMenuItem isCollapsed={true} />);

    const button = container.querySelector('button');
    expect(button).toHaveClass('justify-center');
  });
});
