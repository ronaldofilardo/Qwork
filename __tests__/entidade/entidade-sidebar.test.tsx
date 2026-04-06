/**
 * @file __tests__/entidade/entidade-sidebar.test.tsx
 * Testes: EntidadeSidebar
 */

import { render, screen, fireEvent } from '@testing-library/react';
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

  it('shows CreditCard payment icon when pagamentos > 0', () => {
    render(
      <EntidadeSidebar
        {...defaultProps}
        counts={{ ...defaultProps.counts, pagamentos: 3 }}
      />
    );

    const paymentIcon = screen.getByLabelText('Pagamento em aberto');
    expect(paymentIcon).toBeInTheDocument();
  });

  it('does not show CreditCard payment icon when pagamentos is 0', () => {
    render(
      <EntidadeSidebar
        {...defaultProps}
        counts={{ ...defaultProps.counts, pagamentos: 0 }}
      />
    );

    expect(screen.queryByLabelText('Pagamento em aberto')).not.toBeInTheDocument();
  });

  it('does not show CreditCard payment icon when pagamentos is undefined', () => {
    render(<EntidadeSidebar {...defaultProps} />);

    expect(screen.queryByLabelText('Pagamento em aberto')).not.toBeInTheDocument();
  });

  it('does not render numeric badge for pagamentos (uses icon instead)', () => {
    render(
      <EntidadeSidebar
        {...defaultProps}
        counts={{ ...defaultProps.counts, pagamentos: 4 }}
      />
    );

    // Ícone CreditCard presente
    expect(screen.getByLabelText('Pagamento em aberto')).toBeInTheDocument();
    // Número 4 NÃO deve aparecer como badge de pagamentos
    expect(screen.queryByText('4')).not.toBeInTheDocument();
  });

  it('navigates to conta when clicking Informações da Conta', () => {
    render(<EntidadeSidebar {...defaultProps} />);

    fireEvent.click(screen.getByText('Informações da Conta'));
    expect(mockPush).toHaveBeenCalledWith('/entidade/conta');
  });
});
