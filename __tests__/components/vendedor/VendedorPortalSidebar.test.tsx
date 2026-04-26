/**
 * @file __tests__/components/vendedor/VendedorPortalSidebar.test.tsx
 * Testes para o componente VendedorPortalSidebar
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mocks de navegação
const mockPathname = jest.fn(() => '/vendedor/dashboard');
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// Mock SidebarLayout para isolar o componente
jest.mock('@/components/shared/SidebarLayout', () => ({
  __esModule: true,
  default: ({
    children,
    title,
    subtitle,
    userName,
    roleLabel,
    footer,
    onLogout,
  }: {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    userName?: string;
    roleLabel?: string;
    footer?: React.ReactNode;
    onLogout?: () => void;
  }) => (
    <div
      data-testid="sidebar-layout"
      data-username={userName}
      data-role={roleLabel}
    >
      <span data-testid="sidebar-title">{title}</span>
      {subtitle && <span data-testid="sidebar-subtitle">{subtitle}</span>}
      <button data-testid="logout-btn" onClick={onLogout}>
        Sair
      </button>
      <nav>{children}</nav>
      {footer && <div data-testid="sidebar-footer">{footer}</div>}
    </div>
  ),
}));

import VendedorPortalSidebar from '@/components/vendedor/VendedorPortalSidebar';
import type { VendedorSession } from '@/app/vendedor/(portal)/vendedor-context';

const mockSession: VendedorSession = {
  id: 2,
  nome: 'Maria Vendedora',
  cpf: '000.000.000-00',
  email: 'maria@vend.com',
  perfil: 'vendedor',
  primeira_senha_alterada: true,
  aceite_politica_privacidade: true,
};

describe('VendedorPortalSidebar', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/vendedor/dashboard');
  });

  it('deve renderizar o SidebarLayout com título e subtítulo corretos', () => {
    render(
      <VendedorPortalSidebar session={mockSession} onLogout={mockLogout} />
    );
    expect(screen.getByTestId('sidebar-title').textContent).toBe('QWork');
    expect(screen.getByTestId('sidebar-subtitle').textContent).toBe(
      'Portal do Vendedor'
    );
  });

  it('deve passar o nome do vendedor como userName', () => {
    render(
      <VendedorPortalSidebar session={mockSession} onLogout={mockLogout} />
    );
    expect(screen.getByTestId('sidebar-layout')).toHaveAttribute(
      'data-username',
      'Maria Vendedora'
    );
  });

  it('deve renderizar os 4 itens de navegação', () => {
    render(
      <VendedorPortalSidebar session={mockSession} onLogout={mockLogout} />
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Vínculos')).toBeInTheDocument();
    expect(screen.getByText('Dados')).toBeInTheDocument();
  });

  it('deve marcar Dashboard como ativo quando pathname é /vendedor/dashboard', () => {
    mockPathname.mockReturnValue('/vendedor/dashboard');
    render(
      <VendedorPortalSidebar session={mockSession} onLogout={mockLogout} />
    );
    const link = screen.getByText('Dashboard').closest('a');
    expect(link?.className).toContain('bg-green-50');
    expect(link?.className).toContain('text-green-700');
  });

  it('deve marcar Leads como ativo quando pathname começa com /vendedor/leads', () => {
    mockPathname.mockReturnValue('/vendedor/leads');
    render(
      <VendedorPortalSidebar session={mockSession} onLogout={mockLogout} />
    );
    const link = screen.getByText('Leads').closest('a');
    expect(link?.className).toContain('bg-green-50');
  });

  it('não deve marcar Dashboard quando pathname é /vendedor/leads', () => {
    mockPathname.mockReturnValue('/vendedor/leads');
    render(
      <VendedorPortalSidebar session={mockSession} onLogout={mockLogout} />
    );
    const dashLink = screen.getByText('Dashboard').closest('a');
    expect(dashLink?.className).not.toContain('bg-green-50');
  });

  it('deve exibir o ID do vendedor no footer', () => {
    render(
      <VendedorPortalSidebar session={mockSession} onLogout={mockLogout} />
    );
    const footer = screen.getByTestId('sidebar-footer');
    expect(footer.textContent).toContain('#2');
  });

  it('deve exibir o footer com o ID do vendedor', () => {
    render(
      <VendedorPortalSidebar session={mockSession} onLogout={mockLogout} />
    );
    expect(screen.getByTestId('sidebar-footer')).toBeInTheDocument();
  });

  it('deve chamar onLogout ao clicar no botão Sair', async () => {
    render(
      <VendedorPortalSidebar session={mockSession} onLogout={mockLogout} />
    );
    fireEvent.click(screen.getByTestId('logout-btn'));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('todos os links de navegação têm href correto', () => {
    render(
      <VendedorPortalSidebar session={mockSession} onLogout={mockLogout} />
    );
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute(
      'href',
      '/vendedor/dashboard'
    );
    expect(screen.getByText('Leads').closest('a')).toHaveAttribute(
      'href',
      '/vendedor/leads'
    );
    expect(screen.getByText('Vínculos').closest('a')).toHaveAttribute(
      'href',
      '/vendedor/vinculos'
    );
    expect(screen.getByText('Dados').closest('a')).toHaveAttribute(
      'href',
      '/vendedor/dados'
    );
  });
});
