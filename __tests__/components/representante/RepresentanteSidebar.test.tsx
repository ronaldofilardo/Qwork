/**
 * @file __tests__/components/representante/RepresentanteSidebar.test.tsx
 * Testes para o componente RepresentanteSidebar
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mocks de navegação
const mockPathname = jest.fn(() => '/representante/dashboard');
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

import RepresentanteSidebar from '@/components/representante/RepresentanteSidebar';
import type { RepresentanteSession } from '@/app/representante/(portal)/rep-context';

const mockSession: RepresentanteSession = {
  id: 1,
  nome: 'João Representante',
  email: 'joao@rep.com',
  codigo: 'REP-TESTE',
  status: 'apto',
  tipo_pessoa: 'pf',
  telefone: null,
  aceite_termos: true,
  aceite_disclaimer_nv: true,
  aceite_politica_privacidade: true,
  criado_em: '2025-01-01',
  aprovado_em: '2025-01-02',
};

describe('RepresentanteSidebar', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname.mockReturnValue('/representante/dashboard');
  });

  it('deve renderizar o SidebarLayout com título e subtítulo corretos', () => {
    render(
      <RepresentanteSidebar session={mockSession} onLogout={mockLogout} />
    );
    expect(screen.getByTestId('sidebar-title').textContent).toBe('QWork');
    expect(screen.getByTestId('sidebar-subtitle').textContent).toBe(
      'Portal do Representante'
    );
  });

  it('deve passar o nome do representante como userName', () => {
    render(
      <RepresentanteSidebar session={mockSession} onLogout={mockLogout} />
    );
    expect(screen.getByTestId('sidebar-layout')).toHaveAttribute(
      'data-username',
      'João Representante'
    );
  });

  it('deve renderizar todos os 6 itens de navegação', () => {
    render(
      <RepresentanteSidebar session={mockSession} onLogout={mockLogout} />
    );
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Métricas')).toBeInTheDocument();
    expect(screen.getByText('Minha Equipe')).toBeInTheDocument();
    expect(screen.getByText('Leads da Equipe')).toBeInTheDocument();
    expect(screen.getByText('Minhas Vendas')).toBeInTheDocument();
    expect(screen.getByText('Dados')).toBeInTheDocument();
  });

  it('deve marcar Dashboard como ativo quando pathname é /representante/dashboard', () => {
    mockPathname.mockReturnValue('/representante/dashboard');
    render(
      <RepresentanteSidebar session={mockSession} onLogout={mockLogout} />
    );
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.className).toContain('bg-blue-50');
    expect(dashboardLink?.className).toContain('text-blue-700');
  });

  it('deve marcar Métricas como ativo quando pathname é /representante/metricas', () => {
    mockPathname.mockReturnValue('/representante/metricas');
    render(
      <RepresentanteSidebar session={mockSession} onLogout={mockLogout} />
    );
    const link = screen.getByText('Métricas').closest('a');
    expect(link?.className).toContain('bg-blue-50');
  });

  it('deve marcar apenas Equipe (não Leads da Equipe) quando pathname é /representante/equipe', () => {
    mockPathname.mockReturnValue('/representante/equipe');
    render(
      <RepresentanteSidebar session={mockSession} onLogout={mockLogout} />
    );
    const equipeLink = screen.getByText('Minha Equipe').closest('a');
    const leadsLink = screen.getByText('Leads da Equipe').closest('a');
    expect(equipeLink?.className).toContain('bg-blue-50');
    expect(leadsLink?.className).not.toContain('bg-blue-50');
  });

  it('deve marcar apenas Leads da Equipe (não Equipe) quando pathname é /representante/equipe/leads', () => {
    mockPathname.mockReturnValue('/representante/equipe/leads');
    render(
      <RepresentanteSidebar session={mockSession} onLogout={mockLogout} />
    );
    const equipeLink = screen.getByText('Minha Equipe').closest('a');
    const leadsLink = screen.getByText('Leads da Equipe').closest('a');
    expect(equipeLink?.className).not.toContain('bg-blue-50');
    expect(leadsLink?.className).toContain('bg-blue-50');
  });

  it('deve exibir o código do representante no footer', () => {
    render(
      <RepresentanteSidebar session={mockSession} onLogout={mockLogout} />
    );
    const footer = screen.getByTestId('sidebar-footer');
    expect(footer.textContent).toContain('REP-TESTE');
  });

  it('deve exibir badge de status no footer', () => {
    render(
      <RepresentanteSidebar session={mockSession} onLogout={mockLogout} />
    );
    const footer = screen.getByTestId('sidebar-footer');
    expect(footer.textContent).toContain('APTO');
  });

  it('deve chamar onLogout ao clicar no botão Sair', async () => {
    render(
      <RepresentanteSidebar session={mockSession} onLogout={mockLogout} />
    );
    fireEvent.click(screen.getByTestId('logout-btn'));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('todos os links de navegação têm href correto', () => {
    render(
      <RepresentanteSidebar session={mockSession} onLogout={mockLogout} />
    );
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute(
      'href',
      '/representante/dashboard'
    );
    expect(screen.getByText('Métricas').closest('a')).toHaveAttribute(
      'href',
      '/representante/metricas'
    );
    expect(screen.getByText('Minha Equipe').closest('a')).toHaveAttribute(
      'href',
      '/representante/equipe'
    );
    expect(screen.getByText('Leads da Equipe').closest('a')).toHaveAttribute(
      'href',
      '/representante/equipe/leads'
    );
    expect(screen.getByText('Minhas Vendas').closest('a')).toHaveAttribute(
      'href',
      '/representante/minhas-vendas'
    );
    expect(screen.getByText('Dados').closest('a')).toHaveAttribute(
      'href',
      '/representante/dados'
    );
  });
});
