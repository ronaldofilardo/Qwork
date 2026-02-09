import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EntidadeSidebar from '@/components/entidade/EntidadeSidebar';

// Mock do useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/entidade/dashboard',
}));

// Mock do PWAMenuItem
jest.mock('@/components/PWAMenuItem', () => ({
  PWAMenuItem: jest.fn(() => (
    <div data-testid="pwa-menu-item">PWA Menu Item</div>
  )),
}));

describe('EntidadeSidebar', () => {
  const defaultProps = {
    counts: {
      funcionarios: 10,
      lotes: 2,
    },
    userName: 'Gestor Entidade',
  };

  it('renders and places logout after navigation (last button)', () => {
    const { container } = render(<EntidadeSidebar {...defaultProps} />);

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();

    const buttons = nav?.querySelectorAll('button');
    expect(buttons).toBeTruthy();
    // último botão dentro da nav deve ser o logout
    const lastButton = buttons && buttons[buttons.length - 1];
    expect(lastButton).toBeTruthy();
    expect(lastButton?.textContent).toMatch(/Sair/);
  });

  it('renders PWA Menu Item', () => {
    render(<EntidadeSidebar {...defaultProps} />);

    expect(screen.getByTestId('pwa-menu-item')).toBeInTheDocument();
  });

  it('passes isCollapsed prop to PWAMenuItem', () => {
    const {
      PWAMenuItem: MockPWAMenuItem,
    } = require('@/components/PWAMenuItem');

    render(<EntidadeSidebar {...defaultProps} />);

    expect(MockPWAMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({
        isCollapsed: expect.any(Boolean),
      }),
      expect.anything()
    );
  });
});
