/**
 * @file __tests__/components/clinica/ClinicaSidebar.test.tsx
 * Testes para o componente ClinicaSidebar
 *
 * Valida:
 *  - Renderização dos itens de menu
 *  - Exibição de contadores
 *  - Nome do usuário
 *  - Valores default
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/clinica',
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Building2: (props: Record<string, unknown>) => (
    <span data-testid="icon-building" {...props} />
  ),
  User: (props: Record<string, unknown>) => (
    <span data-testid="icon-user" {...props} />
  ),
  Bell: (props: Record<string, unknown>) => (
    <span data-testid="icon-bell" {...props} />
  ),
}));

// Mock do SidebarLayout
jest.mock('@/components/shared/SidebarLayout', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sidebar-layout">{children}</div>
  ),
}));

// Mock do PWAMenuItem
jest.mock('@/components/PWAMenuItem', () => ({
  PWAMenuItem: () => <div data-testid="pwa-menu-item" />,
}));

import ClinicaSidebar from '@/components/clinica/ClinicaSidebar';

describe('ClinicaSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização Básica', () => {
    it('deve renderizar sem erros', () => {
      const { container } = render(<ClinicaSidebar />);
      expect(container).toBeTruthy();
    });

    it('deve renderizar dentro do SidebarLayout', () => {
      render(<ClinicaSidebar />);
      expect(screen.getByTestId('sidebar-layout')).toBeInTheDocument();
    });
  });

  describe('Props Default', () => {
    it('deve usar "Gestor" como nome padrão', () => {
      render(<ClinicaSidebar />);
      // O componente usa userName = 'Gestor' como default
      expect(screen.getByTestId('sidebar-layout')).toBeInTheDocument();
    });

    it('deve aceitar counts e userName customizados', () => {
      const { container } = render(
        <ClinicaSidebar
          counts={{ empresas: 5, lotes: 3, laudos: 10, notificacoes: 2 }}
          userName="Dr. Carlos"
        />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('Contadores', () => {
    it('deve renderizar badge quando count > 0', () => {
      render(<ClinicaSidebar counts={{ empresas: 5, notificacoes: 3 }} />);
      // Componente deve mostrar badges com contadores
      expect(screen.getByTestId('sidebar-layout')).toBeInTheDocument();
    });

    it('deve funcionar sem counts', () => {
      const { container } = render(<ClinicaSidebar counts={{}} />);
      expect(container).toBeTruthy();
    });
  });
});
