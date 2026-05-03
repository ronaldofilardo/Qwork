/**
 * Testes para navegação baseada em rotas - ClinicaSidebar
 * - Navegação para URLs corretas
 * - Destaque da seção ativa baseado no pathname
 * - Logout funcional
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClinicaSidebar from '@/components/clinica/ClinicaSidebar';

// Mock do useRouter
const mockPush = jest.fn();
const mockPathname = '/rh/empresas';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

// Mock do fetch
global.fetch = jest.fn();

describe('ClinicaSidebar Route-based Navigation', () => {
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

  it('renders sidebar with correct navigation structure', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    // Verifica header
    expect(screen.getByText('QWork')).toBeInTheDocument();
    expect(screen.getByText('Painel Clínica')).toBeInTheDocument();

    // Verifica menu items
    expect(screen.getByText('Empresas Clientes')).toBeInTheDocument();
    expect(screen.getByText('Laudos')).toBeInTheDocument();
    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(screen.getByText('Informações da Conta')).toBeInTheDocument();
  });

  it('highlights active section based on current pathname', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    const empresasButton = screen
      .getByText('Empresas Clientes')
      .closest('button');
    expect(empresasButton).toHaveClass('bg-primary-100');
    expect(empresasButton).toHaveClass('text-primary-600');
  });

  it('navigates to correct routes when clicking menu items', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    // Testa navegação para Laudos
    fireEvent.click(screen.getByText('Laudos'));
    expect(mockPush).toHaveBeenCalledWith('/rh/laudos');

    // Testa navegação para Notificações
    fireEvent.click(screen.getByText('Notificações'));
    expect(mockPush).toHaveBeenCalledWith('/rh/notificacoes');

    // Testa navegação para Conta
    fireEvent.click(screen.getByText('Informações da Conta'));
    expect(mockPush).toHaveBeenCalledWith('/rh/conta');
  });

  it('handles logout with navigation to login', async () => {
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

  it('displays counts correctly in badges', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    expect(screen.getByText('5')).toBeInTheDocument(); // empresas
    expect(screen.getByText('3')).toBeInTheDocument(); // notificacoes
    expect(screen.getByText('2')).toBeInTheDocument(); // laudos
  });

  it('handles missing counts gracefully', () => {
    render(<ClinicaSidebar {...defaultProps} counts={undefined} />);

    // Não deve mostrar badges quando counts são undefined
    expect(screen.queryByText('5')).not.toBeInTheDocument();
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
  });

  it.skip('toggles sidebar collapse state (feature not implemented)', () => {
    render(<ClinicaSidebar {...defaultProps} />);

    const toggleButton = screen.getByTitle('Expandir menu');
    fireEvent.click(toggleButton);

    expect(screen.getByTitle('Recolher menu')).toBeInTheDocument();
  });
});
