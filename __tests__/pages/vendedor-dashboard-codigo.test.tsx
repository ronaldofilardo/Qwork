/**
 * @file __tests__/pages/vendedor-dashboard-codigo.test.tsx
 *
 * Testes para o banner de código do vendedor no dashboard real.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock de navegação
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/vendedor/dashboard',
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

// Mock do contexto do vendedor
const mockSessionVendedor = {
  id: 10,
  nome: 'Maria Vendedora',
  cpf: '000.000.000-00',
  email: 'maria@vend.com',
  perfil: 'vendedor',
  primeira_senha_alterada: true,
  aceite_politica_privacidade: true,
};

jest.mock('@/app/vendedor/(portal)/vendedor-context', () => ({
  useVendedor: () => ({
    session: mockSessionVendedor,
    recarregarSessao: jest.fn(),
  }),
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

import VendedorDashboard from '@/app/vendedor/(portal)/dashboard/page';

describe('VendedorDashboard — banner do código', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          representantes_ativos: 2,
          emissoes_mes: 5,
          representante: { id: 1, nome: 'Rep Teste' },
        }),
    });
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn(() => Promise.resolve()) },
    });
  });

  it('deve exibir o ID do vendedor no banner', async () => {
    render(<VendedorDashboard />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });
    expect(screen.getByText('Seu ID no sistema')).toBeInTheDocument();
  });

  it('deve exibir o botão de copiar no banner', async () => {
    render(<VendedorDashboard />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /copiar ID/i })
      ).toBeInTheDocument();
    });
  });

  it('deve copiar o ID ao clicar no botão', async () => {
    const mockWriteText = jest.fn(() => Promise.resolve());
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText },
    });

    render(<VendedorDashboard />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /copiar ID/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /copiar ID/i }));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('10');
    });
  });
});
