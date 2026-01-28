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

// Mock do fetch
global.fetch = jest.fn();

describe('ClinicaSidebar', () => {
  const defaultProps = {
    counts: {
      empresas: 5,
      notificacoes: 3,
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
    expect(screen.getByText('Laudos')).toBeInTheDocument();
    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(screen.getByText('Informações da Conta')).toBeInTheDocument();
  });

  it('displays counts correctly', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    // Verifica badges de contagem
    expect(screen.getByText('5')).toBeInTheDocument(); // empresas
    expect(screen.getByText('3')).toBeInTheDocument(); // notificacoes
    expect(screen.getByText('2')).toBeInTheDocument(); // laudos
  });

  it('highlights active section based on pathname', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    // O botão é o elemento pai do span com o texto
    const empresasButton = screen
      .getByText('Empresas Clientes')
      .closest('button');
    expect(empresasButton).toHaveClass('bg-primary-100');
    expect(empresasButton).toHaveClass('text-primary-600');
  });

  it('navigates to correct routes when clicking menu items', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    // Clica na seção Laudos
    fireEvent.click(screen.getByText('Laudos'));
    expect(mockPush).toHaveBeenCalledWith('/rh/laudos');

    // Clica na seção Notificações
    fireEvent.click(screen.getByText('Notificações'));
    expect(mockPush).toHaveBeenCalledWith('/rh/notificacoes');

    // Clica na seção Conta
    fireEvent.click(screen.getByText('Informações da Conta'));
    expect(mockPush).toHaveBeenCalledWith('/rh/conta');
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
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
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
});
