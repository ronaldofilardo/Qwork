/**
 * Testes de Integração - Exibição de Status das Empresas
 * - Verificar fluxo completo: API → Interface
 * - Garantir que empresas ativas/inativas são exibidas corretamente
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import RhPage from '@/app/rh/page';

// Alias para compatibilidade com referências legadas
const ClinicaOverviewPage = RhPage;

// Mock completo das dependências
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
    // Use React.createElement to avoid JSX transform issues in some environments
    return React.createElement(
      'div',
      { 'data-testid': 'notifications-section' },
      'Notificações'
    );
  };
});

describe('Integração - Exibição de Status das Empresas', () => {
  beforeEach(() => {
    // Mock da sessão
    const mockRequireAuth = require('@/lib/session')
      .requireAuth as jest.MockedFunction<any>;
    mockRequireAuth.mockResolvedValue({
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh',
    });

    // Mock do banco para simular dados reais
    const mockQuery = require('@/lib/db').query as jest.MockedFunction<any>;
    mockQuery.mockImplementation((sql: string, params?: any[]) => {
      if (sql.includes('SELECT clinica_id FROM funcionarios')) {
        return Promise.resolve({ rows: [{ clinica_id: 1 }], rowCount: 1 });
      }

      if (sql.includes('SELECT id, nome, cnpj, ativa FROM empresas_clientes')) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              nome: 'Empresa Ativa Ltda',
              cnpj: '12345678000100',
              ativa: true,
            },
            {
              id: 2,
              nome: 'Empresa Inativa S.A.',
              cnpj: '98765432000199',
              ativa: false,
            },
            {
              id: 3,
              nome: 'Empresa Reativada Corp',
              cnpj: '55555555000155',
              ativa: true,
            },
          ],
          rowCount: 3,
        });
      }

      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    // Mock fetch para endpoints usados pelo componente cliente
    (global.fetch as jest.Mock) = jest
      .fn()
      .mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              cpf: '11111111111',
              nome: 'RH Teste',
              perfil: 'rh',
            }),
          });
        }
        if (typeof url === 'string' && url.includes('/api/rh/empresas')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              {
                id: 1,
                nome: 'Empresa Ativa Ltda',
                cnpj: '12345678000100',
                ativa: true,
              },
              {
                id: 2,
                nome: 'Empresa Inativa S.A.',
                cnpj: '98765432000199',
                ativa: false,
              },
              {
                id: 3,
                nome: 'Empresa Reativada Corp',
                cnpj: '55555555000155',
                ativa: true,
              },
            ],
          });
        }
        return Promise.resolve({ ok: false });
      });
  });

  it('deve exibir todas as empresas da clínica com status correto', async () => {
    render(<ClinicaOverviewPage />);

    // Aguardar carregamento completo
    await waitFor(() => {
      expect(screen.getAllByText('Empresa Ativa Ltda').length).toBeGreaterThan(
        0
      );
      expect(
        screen.getAllByText('Empresa Inativa S.A.').length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText('Empresa Reativada Corp').length
      ).toBeGreaterThan(0);
    });

    // Verificar que todas as empresas são exibidas (somente os headings das empresas)
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(3);
  });

  it('deve aplicar visual correto para empresas ativas', async () => {
    render(<ClinicaOverviewPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Empresa Ativa Ltda').length).toBeGreaterThan(
        0
      );
    });

    // Empresa ativa deve ter:
    // - Status "Ativa" com fundo verde (específico do card da empresa)
    const statusAtiva = screen.getAllByText('Ativa')[0];
    expect(statusAtiva).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('deve aplicar visual correto para empresas inativas', async () => {
    render(<ClinicaOverviewPage />);

    await waitFor(() => {
      expect(
        screen.getAllByText('Empresa Inativa S.A.').length
      ).toBeGreaterThan(0);
    });

    // Empresa inativa deve ter:
    // - Status "Inativa" com fundo vermelho (específico do card)
    const cardInativa = screen
      .getAllByText('Empresa Inativa S.A.')[0]
      .closest('div') as HTMLElement;
    const statusInativa = within(cardInativa).getByText('Inativa');
    expect(statusInativa).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('deve mostrar CNPJ correto para cada empresa', async () => {
    render(<ClinicaOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('CNPJ: 12345678000100')).toBeInTheDocument();
      expect(screen.getByText('CNPJ: 98765432000199')).toBeInTheDocument();
      expect(screen.getByText('CNPJ: 55555555000155')).toBeInTheDocument();
    });
  });

  it('deve permitir navegação para dashboard de empresas ativas', async () => {
    render(<ClinicaOverviewPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Empresa Ativa Ltda').length).toBeGreaterThan(
        0
      );
    });

    // Verificar que botão "Ver Dashboard" está presente e habilitado
    const botoesDashboard = screen.getAllByText('Ver Dashboard');
    expect(botoesDashboard).toHaveLength(3); // Uma para cada empresa

    botoesDashboard.forEach((botao) => {
      expect(botao).not.toBeDisabled();
    });
  });

  it('deve mostrar botões de toggle de status apropriados', async () => {
    render(<ClinicaOverviewPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Empresa Ativa Ltda').length).toBeGreaterThan(
        0
      );
    });

    // Deve haver 2 botões de desativar (🔒) para empresas ativas
    const botoesDesativar = screen.getAllByTitle('Desativar empresa');
    expect(botoesDesativar).toHaveLength(2); // Empresas 1 e 3 são ativas

    // Deve haver 1 botão de ativar (✓) para empresa inativa
    const botoesAtivar = screen.getAllByTitle('Ativar empresa');
    expect(botoesAtivar).toHaveLength(1); // Empresa 2 é inativa
  });

  it('deve manter funcionalidade mesmo com empresas de status misto', async () => {
    render(<ClinicaOverviewPage />);

    await waitFor(() => {
      expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
    });

    // Verificar que grid contém todas as empresas (apenas headings das empresas)
    const empresas = screen.getAllByRole('heading', { level: 4 });
    expect(empresas).toHaveLength(3);

    // Verificar que cada empresa tem seu CNPJ
    expect(screen.getByText('CNPJ: 12345678000100')).toBeInTheDocument();
    expect(screen.getByText('CNPJ: 98765432000199')).toBeInTheDocument();
    expect(screen.getByText('CNPJ: 55555555000155')).toBeInTheDocument();

    // Verificar que há botões de ação para todas
    const botoesAcao = screen.getAllByRole('button', { hidden: true });
    const botoesComIcones = botoesAcao.filter(
      (btn) => btn.textContent?.includes('🔒') || btn.textContent?.includes('✓')
    );
    expect(botoesComIcones).toHaveLength(3); // Um para cada empresa
  });
});
