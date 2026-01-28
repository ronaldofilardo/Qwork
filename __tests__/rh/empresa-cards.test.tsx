/**
 * DEPRECATED: Este teste está obsoleto.
 * Usar __tests__/rh/rh-cards-empresas.test.tsx para testes da nova tela raiz.
 *
 * Os contadores de "Funcionários" e "Avaliações" agora ESTÃO presentes nos cards.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RhPage from '@/app/rh/page';

// Mock das dependências
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  queryWithContext: jest.fn(),
}));

jest.mock('@/components/NotificationsSection', () => {
  return function MockNotificationsSection() {
    return <div data-testid="notifications-section">Notificações</div>;
  };
});

describe.skip('Cards de Empresas - DEPRECATED', () => {
  const mockEmpresas = [
    {
      id: 1,
      nome: 'Empresa Teste 1',
      cnpj: '12345678000100',
      ativa: true,
    },
    {
      id: 2,
      nome: 'Empresa Teste 2',
      cnpj: '98765432000199',
      ativa: false,
    },
  ];

  beforeEach(() => {
    // Mock da sessão
    const mockRequireAuth = require('@/lib/session').requireAuth;
    mockRequireAuth.mockResolvedValue({
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh',
    });

    // Mock da API de empresas
    global.fetch = jest.fn((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              cpf: '11111111111',
              nome: 'RH Teste',
              perfil: 'rh',
            }),
        });
      }

      if (url === '/api/rh/empresas') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmpresas),
        });
      }

      return Promise.reject(new Error('URL não mockada'));
    }) as jest.Mock;
  });

  it('deve renderizar cards de empresas sem os contadores removidos', async () => {
    render(<RhPage />);

    // Aguardar carregamento - usar seletor mais específico para o título do card
    await screen.findByRole('heading', { name: /empresa teste 1/i });

    // Verificar que os cards são renderizados
    expect(
      screen.getByRole('heading', { name: /empresa teste 1/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /empresa teste 2/i })
    ).toBeInTheDocument();

    // Verificar que os contadores foram removidos
    expect(screen.queryByText('Funcionários')).not.toBeInTheDocument();
    expect(screen.queryByText('Pendentes')).not.toBeInTheDocument();

    // Verificar que outras informações ainda estão presentes
    expect(screen.getByText('CNPJ: 12345678000100')).toBeInTheDocument();
    expect(screen.getByText('CNPJ: 98765432000199')).toBeInTheDocument();
    expect(screen.getAllByText('Ver Dashboard').length).toBeGreaterThan(0);
  });

  it('deve mostrar status correto das empresas', async () => {
    render(<RhPage />);

    // Aguardar carregamento - usar seletor mais específico para o título do card
    await screen.findByRole('heading', { name: /empresa teste 1/i });

    // Verificar status das empresas
    const statusElements = screen.getAllByText('Ativa');
    expect(statusElements.length).toBeGreaterThan(0);
    const inativaElements = screen.getAllByText('Inativa');
    expect(inativaElements.length).toBeGreaterThan(0);
  });

  it('deve aplicar estilos corretos baseado no status da empresa', async () => {
    render(<RhPage />);

    // Aguardar carregamento
    await screen.findByRole('heading', { name: /empresa teste 1/i });

    // Verificar que empresa ativa tem borda normal - buscar o card pai
    const empresaAtivaCard = screen
      .getByRole('heading', { name: /empresa teste 1/i })
      .closest('.bg-white') as HTMLElement;
    expect(empresaAtivaCard).toHaveClass('border-gray-200');

    // Verificar que empresa inativa tem borda vermelha e opacidade reduzida
    const empresaInativaCard = screen
      .getByRole('heading', { name: /empresa teste 2/i })
      .closest('.bg-white') as HTMLElement;
    expect(empresaInativaCard).toHaveClass('border-red-200');
    expect(empresaInativaCard).toHaveClass('bg-gray-50');
    expect(empresaInativaCard).toHaveClass('opacity-75');
  });

  it('deve mostrar botões de ação corretos para cada status', async () => {
    render(<RhPage />);

    // Aguardar carregamento
    await screen.findByRole('heading', { name: /empresa teste 1/i });

    // Empresa ativa deve ter botão de desativar (🔒)
    const botoesAtivarDesativar = screen.getAllByRole('button', {
      hidden: true,
    });
    const botaoDesativar = botoesAtivarDesativar.find((btn) =>
      btn.textContent?.includes('🔒')
    );
    expect(botaoDesativar).toBeInTheDocument();

    // Empresa inativa deve ter botão de ativar (✓)
    const botaoAtivar = botoesAtivarDesativar.find((btn) =>
      btn.textContent?.includes('✓')
    );
    expect(botaoAtivar).toBeInTheDocument();
  });
});
