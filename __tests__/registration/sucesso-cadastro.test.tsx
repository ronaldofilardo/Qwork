/**
 * @fileoverview Testes da página de sucesso de cadastro
 * @description Testa fluxos de sucesso após cadastro: conta criada, pagamento confirmado, contrato
 * @test Página de sucesso com múltiplos cenários de conclusão de cadastro
 */

import type { Mock } from 'jest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SucessoCadastroPage from '@/app/sucesso-cadastro/page';

/**
 * Interface para sessão de contratante
 */
interface MockContratante {
  id: number;
  nome: string;
  tipo?: 'empresa' | 'clinica' | 'entidade';
  pagamento_confirmado: boolean;
  contrato_aceito?: boolean;
  plano_id?: number;
  status?: string;
}

/**
 * Interface para contrato
 */
interface MockContrato {
  id: number;
  conteudo: string;
  aceito: boolean;
}

// Mock do Next.js navigation
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

describe('SucessoCadastroPage', () => {
  beforeEach(() => {
    // Arrange: Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.alert = jest.fn() as jest.MockedFunction<typeof alert>;
  });

  /**
   * @test Verifica mensagem de conta criada quando não há sessão
   * @expected Deve exibir "Conta criada com sucesso!" sem sessão ativa
   */
  it('exibe mensagem de "Conta criada com sucesso" quando não há id e sem sessão', async () => {
    // Arrange: Sem ID na URL
    mockGet.mockReturnValue(null);

    // Arrange: Sessão retorna não-autenticada
    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)
    );

    // Act: Renderizar página
    render(<SucessoCadastroPage />);

    // Assert: Verificar mensagem de sucesso
    await waitFor(() => {
      expect(screen.getByText('Conta criada com sucesso!')).toBeInTheDocument();
    });
  });

  /**
   * @test Verifica tela de conclusão quando pagamento foi confirmado
   * @expected Deve exibir "Cadastro Concluído!" com pagamento confirmado na sessão
   */
  it('exibe tela de pagamento concluído quando sessão indica pagamento confirmado', async () => {
    // Arrange: Sem ID na URL
    mockGet.mockReturnValue(null);

    // Arrange: Sessão retorna contratante com pagamento confirmado
    const mockContratante: MockContratante = {
      id: 1,
      nome: 'Empresa Teste',
      pagamento_confirmado: true,
      contrato_aceito: true,
    };

    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ contratante: mockContratante }),
      } as Response)
    );

    // Act: Renderizar página
    render(<SucessoCadastroPage />);

    // Assert: Verificar mensagem de cadastro concluído
    await waitFor(() => {
      expect(screen.getByText('Cadastro Concluído!')).toBeInTheDocument();
    });
  });

  /**
   * @test Verifica conclusão para tipos clinica/entidade sem exigir contrato
   * @expected Clínicas e entidades devem ver conclusão mesmo sem contrato_aceito
   */
  it('exibe tela de pagamento concluído para tipos clinica e entidade mesmo sem contrato_aceito', async () => {
    // Arrange: Sem ID na URL
    mockGet.mockReturnValue(null);

    // Arrange: Sessão retorna clínica com pagamento confirmado, sem contrato
    const mockClinica: MockContratante = {
      id: 77,
      nome: 'Clinica Nova',
      tipo: 'clinica',
      pagamento_confirmado: true,
      contrato_aceito: false,
    };

    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ contratante: mockClinica }),
      } as Response)
    );

    // Act: Renderizar para clínica
    render(<SucessoCadastroPage />);

    // Assert: Verificar mensagem de conclusão
    await waitFor(() => {
      expect(screen.getByText('Cadastro Concluído!')).toBeInTheDocument();
    });

    // Arrange: Agora testar tipo 'entidade'
    const mockEntidade: MockContratante = {
      id: 88,
      nome: 'Entidade Teste',
      tipo: 'entidade',
      pagamento_confirmado: true,
      contrato_aceito: false,
    };

    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ contratante: mockEntidade }),
      } as Response)
    );

    // Act: Renderizar para entidade
    render(<SucessoCadastroPage />);

    // Assert: Verificar mensagem de conclusão também para entidade
    await waitFor(() => {
      expect(screen.getByText('Cadastro Concluído!')).toBeInTheDocument();
    });
  });

  /**
   * @test Verifica mensagem quando tipo personalizado e API falha
   * @expected Deve exibir "Dados enviados com sucesso!" mesmo com erro da API
   */
  it('exibe mensagem de dados enviados para administrador quando tipo=personalizado e API falha', async () => {
    // Arrange: Simular query params id=50, tipo=personalizado
    mockGet.mockImplementation((key: string) =>
      key === 'id' ? '50' : key === 'tipo' ? 'personalizado' : null
    );

    // Arrange: Sessão retorna não autenticada
    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)
    );

    // Arrange: API /api/public/contratante retorna erro
    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Erro ao buscar dados' }),
      } as Response)
    );

    // Act: Renderizar página
    render(<SucessoCadastroPage />);

    // Assert: Verificar mensagem de dados enviados
    await waitFor(() => {
      expect(
        screen.getByText('Dados enviados com sucesso!')
      ).toBeInTheDocument();
    });
  });

  /**
   * @test Verifica abertura automática do modal de contrato via querystring
   * @expected Modal de contrato deve abrir quando contrato_id está na URL
   */
  it('abre ModalContrato automaticamente quando contrato_id está na querystring', async () => {
    // Arrange: Simular query params id=123 e contrato_id=999
    mockGet.mockImplementation((key: string) =>
      key === 'id' ? '123' : key === 'contrato_id' ? '999' : null
    );

    // Arrange: Sessão retorna não autenticada
    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)
    );

    // Arrange: API /api/public/contratante retorna dados básicos
    const mockContratanteBasico: MockContratante = {
      id: 123,
      nome: 'Empresa Teste',
      pagamento_confirmado: false,
      status: 'aguardando_pagamento',
    };

    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ contratante: mockContratanteBasico }),
      } as Response)
    );

    // Arrange: API /api/contratos/999 retorna o contrato
    const mockContrato: MockContrato = {
      id: 999,
      conteudo: 'Conteúdo do contrato de teste',
      aceito: false,
    };

    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ contrato: mockContrato }),
      } as Response)
    );

    // Act: Renderizar página
    render(<SucessoCadastroPage />);

    // Assert: Verificar que modal do contrato abriu
    await waitFor(() => {
      expect(screen.getByText('Contrato de Serviço')).toBeInTheDocument();
      expect(
        screen.getByText(/CONTRATO DE PRESTAÇÃO DE SERVIÇOS DIGITAIS/i)
      ).toBeInTheDocument();
    });
  });

  /**
   * @test Verifica popup de sucesso após simulação de pagamento
   * @expected Alert deve ser chamado e modal de conclusão deve aparecer
   */
  it('mostra o popup de sucesso (alert) igual ao simulador quando pagamento é confirmado no fluxo personalizado', async () => {
    // Arrange: Sem ID na URL
    mockGet.mockReturnValue(null);

    // Arrange: 1) /api/auth/session retorna contratante com plano
    const mockContratanteComPlano: MockContratante = {
      id: 55,
      nome: 'Empresa Teste',
      pagamento_confirmado: false,
      contrato_aceito: true,
      plano_id: 2,
    };

    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ contratante: mockContratanteComPlano }),
      } as Response)
    );

    // Arrange: 2) /api/planos retorna o plano
    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            planos: [{ id: 2, nome: 'Plano Teste', preco: 499 }],
          }),
      } as Response)
    );

    // Arrange: 3) POST /api/pagamento (iniciar) retorna pagamento.id
    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ pagamento: { id: 42 } }),
      } as Response)
    );

    // Arrange: 4) POST /api/pagamento/simular retorna success
    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, contratante_id: 55 }),
      } as Response)
    );

    // Act: Renderizar página
    render(<SucessoCadastroPage />);

    // Act: Esperar botão Realizar Pagamento aparecer
    const pagarBtn = await screen.findByRole('button', {
      name: /Realizar Pagamento/i,
    });
    expect(pagarBtn).toBeInTheDocument();

    // Act: Abrir modal de pagamento
    pagarBtn.click();

    // Act: Selecionar método PIX
    const pixLabel = await screen.findByText('PIX');
    expect(pixLabel).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(pixLabel);

    // Act: Clicar em Simular Pagamento
    const simBtn = await screen.findByRole('button', {
      name: /Simular Pagamento/i,
    });
    expect(simBtn).toBeInTheDocument();
    simBtn.click();

    // Assert: Esperar texto de sucesso dentro do modal
    await waitFor(
      () =>
        expect(screen.getByText(/Pagamento Confirmado!/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );

    // Assert: Verificar que alert foi chamado
    await waitFor(() => expect(global.alert).toHaveBeenCalled(), {
      timeout: 2500,
    });

    expect(global.alert).toHaveBeenCalledWith(
      'Pagamento confirmado!\n\n' +
        'Seu acesso foi liberado.\n' +
        'O comprovante de pagamento está disponível em:\n' +
        'Informações da Conta > Plano > Baixar Comprovante'
    );

    // Assert: Modal de cadastro concluído deve ser exibido
    const dialog = await screen.findByRole('dialog', {
      name: /Cadastro Concluído!/i,
      timeout: 2500,
    });

    const { getByText: getByTextWithin } = within(dialog);
    expect(
      getByTextWithin(/Seu cadastro foi realizado com sucesso/i)
    ).toBeInTheDocument();
  });
});
