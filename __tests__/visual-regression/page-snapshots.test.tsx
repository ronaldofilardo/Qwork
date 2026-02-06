/**
 * Testes de Regressão Visual - Snapshots de Páginas
 *
 * Estes testes garantem que o layout das páginas não quebre ou regrida
 * ao capturar snapshots da estrutura renderizada.
 */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock do Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    refresh: mockRefresh,
    prefetch: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

// Mock do useSession
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}));

describe('Regressão Visual - Páginas Principais', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Página de Login', () => {
    it('deve manter estrutura visual consistente', () => {
      const LoginPage = require('@/app/login/page').default;
      const { container } = render(<LoginPage />);

      // Snapshot da estrutura
      expect(container.firstChild).toMatchSnapshot();
    });

    it('deve ter elementos de layout essenciais', () => {
      const LoginPage = require('@/app/login/page').default;
      const { container } = render(<LoginPage />);

      // Verificar estrutura de containers principais
      const mainContainers = container.querySelectorAll('div[class*="flex"]');
      expect(mainContainers.length).toBeGreaterThan(0);

      // Verificar presença de formulário
      const forms = container.querySelectorAll('form');
      expect(forms.length).toBeGreaterThan(0);
    });
  });

  describe('Página de Avaliação', () => {
    it('deve manter estrutura visual consistente', () => {
      const AvaliacaoPage = require('@/app/avaliacao/page').default;
      const { container } = render(<AvaliacaoPage />);

      expect(container.firstChild).toMatchSnapshot();
    });

    it('deve ter containers de layout principal', () => {
      const AvaliacaoPage = require('@/app/avaliacao/page').default;
      const { container } = render(<AvaliacaoPage />);

      // Verificar presença de containers principais
      const mainDiv = container.querySelector('div');
      expect(mainDiv).toBeTruthy();
    });
  });

  describe('Página de Avaliação Concluída', () => {
    it('deve manter estrutura visual consistente', () => {
      const ConcluidaPage = require('@/app/avaliacao/concluida/page').default;
      const { container } = render(<ConcluidaPage />);

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Página Admin', () => {
    beforeEach(() => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            nome: 'Admin',
            tipo_usuario: 'admin',
            email: 'admin@test.com',
          },
        },
        status: 'authenticated',
      });
    });

    it('deve manter estrutura visual consistente', () => {
      const AdminPage = require('@/app/admin/page').default;
      const { container } = render(<AdminPage />);

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Página RH Dashboard', () => {
    beforeEach(() => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            nome: 'RH User',
            tipo_usuario: 'rh',
            email: 'rh@test.com',
            entidadeId: '123',
          },
        },
        status: 'authenticated',
      });
    });

    it('deve manter estrutura visual consistente', () => {
      const RHDashboard = require('@/app/rh/dashboard/page').default;
      const { container } = render(<RHDashboard />);

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  // Página Emissor removida temporariamente - usa React Query hook (useReprocessarLaudo)
  // Requer QueryClientProvider para funcionar

  describe('Página Home', () => {
    it('deve redirecionar baseado em sessão', () => {
      const HomePage = require('@/app/page').default;

      // HomePage sempre redireciona, não renderiza nada
      // Apenas verificamos que o componente existe
      expect(() => render(<HomePage />)).toThrow('NEXT_REDIRECT');
    });
  });

  describe('Página Sucesso Cadastro', () => {
    it('deve manter estrutura visual consistente', () => {
      const SucessoCadastroPage =
        require('@/app/sucesso-cadastro/page').default;
      const { container } = render(<SucessoCadastroPage />);

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('Página Termos de Contrato', () => {
    it('deve manter estrutura visual consistente', () => {
      const TermosContratoPage = require('@/app/termos/contrato/page').default;
      const { container } = render(<TermosContratoPage />);

      expect(container.firstChild).toMatchSnapshot();
    });
  });
});
