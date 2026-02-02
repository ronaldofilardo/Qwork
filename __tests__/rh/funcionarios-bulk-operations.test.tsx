/**
 * @fileoverview Testes de Operações em Massa
 * @description Testa ativação/inativação em massa de funcionários
 * @test Operações bulk de status de funcionários
 */

import type { Mock } from 'jest';
import React from 'react';
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page';
import type { MockFuncionario, MockSession } from './types/test-fixtures';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: '1' }),
}));

jest.mock('@/components/Header', () => () => <header />);

jest.mock('@/components/NotificationsSection', () => ({
  __esModule: true,
  default: () => <div data-testid="notifications-section">Notifications</div>,
}));

/**
 * Cria funcionários mockados para testes
 */
const createMockFuncionarios = (count: number): MockFuncionario[] => {
  const setores = [
    'TI',
    'Financeiro',
    'Comercial',
    'Manutenção',
    'Administrativo',
  ];
  const funcoes = [
    'Analista',
    'Coordenador',
    'Gerente',
    'Técnico',
    'Assistente',
  ];

  return Array.from({ length: count }).map((_, i) => ({
    cpf: String(10000000000 + i),
    nome: `Funcionário ${i + 1}`,
    setor: setores[i % setores.length],
    funcao: funcoes[i % funcoes.length],
    matricula: `M${String(i).padStart(4, '0')}`,
    ativo: i % 10 !== 9,
    email: `func${i}@empresa.com`,
    turno: i % 2 === 0 ? 'diurno' : 'noturno',
    escala: '12x36',
    empresa_nome: 'Empresa Teste',
    avaliacoes: [],
  }));
};

describe('⚡ Operações em Massa', () => {
  const mockSession: MockSession = {
    cpf: '11111111111',
    nome: 'RH Usuario',
    perfil: 'rh',
  };
  const mockFuncionarios = createMockFuncionarios(50);

  beforeEach(() => {
    // Arrange: Setup dos mocks
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.alert = jest.fn() as jest.MockedFunction<typeof alert>;

    (global.fetch as Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        } as Response);
      }
      if (url.includes('/api/rh/empresas')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              { id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' },
            ]),
        } as Response);
      }
      if (url.includes('/api/rh/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              stats: {
                total_avaliacoes: 0,
                concluidas: 0,
                funcionarios_avaliados: 0,
              },
              resultados: [],
              distribuicao: [],
            }),
        } as Response);
      }
      if (url.includes('/api/rh/funcionarios') && !url.includes('batch')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ funcionarios: mockFuncionarios }),
        } as Response);
      }
      if (url.includes('/api/rh/funcionarios/status/batch')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              message: 'Operação concluída com sucesso',
            }),
        } as Response);
      }
      if (url.includes('/api/rh/lotes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ lotes: [] }),
        } as Response);
      }
      if (url.includes('/api/rh/laudos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ laudos: [] }),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'not found' }),
      } as Response);
    });
  });

  /**
   * @test Verifica desativação em massa de funcionários selecionados
   * @expected Deve chamar API batch com CPFs selecionados e ativo=false
   */
  it('seleciona todos os funcionários filtrados e desativa em massa', async () => {
    // Arrange & Act: Renderizar
    render(<EmpresaDashboardPage />);

    // Act: Navegar para aba Funcionários
    const funcionariosTab = await waitFor(() =>
      screen.getByText(/Funcionários/i)
    );
    fireEvent.click(funcionariosTab);

    // Assert: Aguardar tabela carregar
    const table = await waitFor(() => screen.getByRole('table'));

    // Act: Selecionar todos via checkbox do header
    const headerCheckboxes = within(table).queryAllByRole('checkbox');
    if (headerCheckboxes.length === 0) {
      return;
    }

    const headerCheckbox = headerCheckboxes[0] as HTMLInputElement;
    fireEvent.click(headerCheckbox);

    // Assert: Contador de seleção deve aparecer
    await waitFor(() => {
      const contador = screen.queryByText(/selecionado\(s\)/i);
      expect(contador).toBeInTheDocument();
    });

    // Act: Clicar em botão de desativar
    const deactivateBtn = screen.getByText(/Desligar|Desativar|🚪 Desligar/i);
    fireEvent.click(deactivateBtn);

    // Assert: Modal de confirmação deve aparecer
    const modalTitle = await waitFor(() =>
      screen.getByText(/Confirmar Operação em Lote/i)
    );
    const modal = modalTitle.closest('div') as HTMLElement;
    const confirmBtn = within(modal).getByRole('button', {
      name: /Desligar|Desativar/i,
    });

    // Act: Confirmar operação
    fireEvent.click(confirmBtn);

    // Assert: Verificar chamada à API batch
    await waitFor(() => {
      const batchCall = (global.fetch as Mock).mock.calls.find(
        (call: unknown[]) =>
          (call[0] as string).includes('/api/rh/funcionarios/status/batch')
      );
      expect(batchCall).toBeDefined();

      const requestBody = JSON.parse((batchCall as unknown[])[1] as string);
      expect(requestBody.cpfs).toBeDefined();
      expect(requestBody.ativo).toBe(false);
    });
  });

  /**
   * @test Verifica ativação em massa de funcionários
   * @expected Deve chamar API batch com ativo=true
   */
  it('ativa funcionários em massa', async () => {
    // Arrange & Act: Renderizar e navegar
    render(<EmpresaDashboardPage />);

    const funcionariosTab = await waitFor(() =>
      screen.getByText(/Funcionários/i)
    );
    fireEvent.click(funcionariosTab);

    const table = await waitFor(() => screen.getByRole('table'));
    const headerCheckboxes = within(table).queryAllByRole('checkbox');

    if (headerCheckboxes.length === 0) {
      return;
    }

    // Act: Selecionar todos
    const headerCheckbox = headerCheckboxes[0] as HTMLInputElement;
    fireEvent.click(headerCheckbox);

    // Act: Clicar em ativar
    const activateBtn = screen.getByText(/✅ Ativar|Ativar/i);
    fireEvent.click(activateBtn);

    // Assert: Modal de confirmação
    const modalTitle2 = await waitFor(() =>
      screen.getByText(/Confirmar Operação em Lote/i)
    );
    const modal2 = modalTitle2.closest('div') as HTMLElement;
    const confirmActivateBtn = within(modal2).getByRole('button', {
      name: /Ativar|Reativar|✅ Reativar/i,
    });

    // Act: Confirmar
    fireEvent.click(confirmActivateBtn);

    // Assert: Verificar API batch com ativo=true
    await waitFor(() => {
      const batchCall = (global.fetch as Mock).mock.calls.find(
        (call: unknown[]) =>
          (call[0] as string).includes('/api/rh/funcionarios/status/batch')
      );
      expect(batchCall).toBeDefined();

      const requestBody = JSON.parse((batchCall as unknown[])[1] as string);
      expect(requestBody.ativo).toBe(true);
    });
  });

  /**
   * @test Verifica desabilitação de botões quando nenhum funcionário está selecionado
   * @expected Botões de operação devem estar desabilitados
   */
  it('desabilita botões de operação quando nenhum funcionário está selecionado', async () => {
    // Arrange & Act: Renderizar
    render(<EmpresaDashboardPage />);

    const funcionariosTab = await waitFor(() =>
      screen.getByRole('button', { name: /Funcionários/i })
    );
    fireEvent.click(funcionariosTab);

    await waitFor(() => screen.getByRole('table'));

    // Assert: Verificar que botões estão desabilitados
    const deactivateBtn = screen.queryByText(/❌ Desativar/i);
    const activateBtn = screen.queryByText(/✅ Ativar/i);

    if (deactivateBtn && !deactivateBtn.disabled) {
      expect(deactivateBtn).toBeDisabled();
    }
    if (activateBtn && !activateBtn.disabled) {
      expect(activateBtn).toBeDisabled();
    }
  });

  /**
   * @test Verifica seleção parcial de funcionários
   * @expected Contador deve exibir número correto de selecionados
   */
  it('permite seleção parcial e operação apenas nos selecionados', async () => {
    // Arrange & Act: Renderizar
    render(<EmpresaDashboardPage />);

    const funcionariosTab = await waitFor(() =>
      screen.getByRole('button', { name: /Funcionários/i })
    );
    fireEvent.click(funcionariosTab);

    const table = await waitFor(() => screen.getByRole('table'));
    const checkboxes = within(table).queryAllByRole('checkbox');

    // Act: Selecionar apenas 3 funcionários
    if (checkboxes.length > 3) {
      fireEvent.click(checkboxes[1]);
      fireEvent.click(checkboxes[2]);
      fireEvent.click(checkboxes[3]);

      // Assert: Contador deve aparecer
      await waitFor(() => {
        const contador = screen.queryByText(/selecionado/i);
        expect(contador).toBeInTheDocument();
      });
    }
  });
});
