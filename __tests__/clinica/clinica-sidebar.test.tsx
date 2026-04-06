/**
 * @file __tests__/clinica/clinica-sidebar.test.tsx
 * Testes: ClinicaSidebar
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClinicaSidebar from '@/components/clinica/ClinicaSidebar';

// Mock do useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/rh/empresas',
}));

// Mock do PWAMenuItem
jest.mock('@/components/PWAMenuItem', () => ({
  PWAMenuItem: jest.fn(() => (
    <div data-testid="pwa-menu-item">PWA Menu Item</div>
  )),
}));

// Mock do fetch
global.fetch = jest.fn();

describe('ClinicaSidebar', () => {
  const defaultProps = {
    counts: {
      empresas: 5,
      laudos: 2,
    },
    userName: 'João Silva',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
    });
  });

  it('renders correctly with all sections', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    // Verifica header
    expect(screen.getByText('QWork')).toBeInTheDocument();
    expect(screen.getByText('Painel Clínica')).toBeInTheDocument();

    // Verifica nome do usuário
    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Gestor de Clínica')).toBeInTheDocument();

    // Verifica seções do menu
    expect(screen.getByText('Empresas Clientes')).toBeInTheDocument();
    expect(screen.getByText('Importação em Massa')).toBeInTheDocument();
    expect(screen.getByText('Informações da Conta')).toBeInTheDocument();
  });

  it('displays counts correctly', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    // Verifica badge de empresas
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('highlights active section based on pathname', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    // pathname é '/rh/empresas' — nenhum item corresponde exatamente, logo nenhum ativo
    const contaButton = screen
      .getByText('Informações da Conta')
      .closest('button');
    expect(contaButton).not.toHaveClass('bg-primary-100');
  });

  it('navigates to correct routes when clicking menu items', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    // Clica na seção Conta
    fireEvent.click(screen.getByText('Informações da Conta'));
    expect(mockPush).toHaveBeenCalledWith('/rh/conta');

    // Clica na seção Empresas
    fireEvent.click(screen.getByText('Empresas Clientes'));
    expect(mockPush).toHaveBeenCalledWith('/rh');
  });

  it('shows CreditCard payment icon when pagamentos > 0', () => {
    render(
      <ClinicaSidebar
        {...defaultProps}
        counts={{ ...defaultProps.counts, pagamentos: 2 }}
      />
    );

    const paymentIcon = screen.getByLabelText('Pagamento em aberto');
    expect(paymentIcon).toBeInTheDocument();
  });

  it('does not show CreditCard payment icon when pagamentos is 0', () => {
    render(
      <ClinicaSidebar
        {...defaultProps}
        counts={{ ...defaultProps.counts, pagamentos: 0 }}
      />
    );

    expect(screen.queryByLabelText('Pagamento em aberto')).not.toBeInTheDocument();
  });

  it('does not show CreditCard payment icon when pagamentos is undefined', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    expect(screen.queryByLabelText('Pagamento em aberto')).not.toBeInTheDocument();
  });

  it('does not render numeric badge for pagamentos (uses icon instead)', () => {
    render(
      <ClinicaSidebar
        {...defaultProps}
        counts={{ ...defaultProps.counts, pagamentos: 7 }}
      />
    );

    // Ícone CreditCard presente
    expect(screen.getByLabelText('Pagamento em aberto')).toBeInTheDocument();
    // Número 7 NÃO deve aparecer como badge
    expect(screen.queryByText('7')).not.toBeInTheDocument();
  });

  it('handles logout correctly', async () => {
    render(<ClinicaSidebar {...defaultProps} />);

    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
      });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('handles missing counts gracefully', () => {
    render(<ClinicaSidebar {...defaultProps} counts={undefined} />);

    // Não deve mostrar badges quando counts são undefined
    expect(screen.queryByText('5')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Pagamento em aberto')).not.toBeInTheDocument();
  });

  it('handles missing userName gracefully', () => {
    render(<ClinicaSidebar {...defaultProps} userName={undefined} />);

    expect(screen.getByText('Gestor')).toBeInTheDocument();
  });

  it('places logout after navigation (last button in nav)', () => {
    const { container } = render(<ClinicaSidebar {...defaultProps} />);

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();

    const buttons = nav?.querySelectorAll('button');
    expect(buttons).toBeTruthy();

    const lastButton = buttons && buttons[buttons.length - 1];
    expect(lastButton).toBeTruthy();
    expect(lastButton?.textContent).toMatch(/Sair/);
  });

  it('renders PWA Menu Item', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    expect(screen.getByTestId('pwa-menu-item')).toBeInTheDocument();
  });

  it('passes isCollapsed prop to PWAMenuItem', () => {
    const {
      PWAMenuItem: MockPWAMenuItem,
    } = require('@/components/PWAMenuItem');

    render(<ClinicaSidebar {...defaultProps} />);

    expect(MockPWAMenuItem).toHaveBeenCalledWith(
      expect.objectContaining({
        isCollapsed: expect.any(Boolean),
      }),
      expect.anything()
    );
  });
});
