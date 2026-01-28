// @ts-nocheck
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SucessoCadastroPage from '@/app/sucesso-cadastro/page';
import { useRouter, useSearchParams } from 'next/navigation';

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

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('SucessoCadastroPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe mensagem de "Conta criada com sucesso" quando não há id e sem sessão', async () => {
    mockGet.mockReturnValue(null); // sem id na URL

    // Sessão retorna não-autenticada
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    );

    render(<SucessoCadastroPage />);

    await waitFor(() => {
      expect(screen.getByText('Conta criada com sucesso!')).toBeInTheDocument();
    });
  });

  it('exibe tela de pagamento concluído quando sessão indica pagamento confirmado', async () => {
    mockGet.mockReturnValue(null); // sem id na URL

    // Sessão retorna contratante com pagamento confirmado
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            contratante: {
              id: 1,
              nome: 'Empresa Teste',
              pagamento_confirmado: true,
              contrato_aceito: true,
            },
          }),
      })
    );

    render(<SucessoCadastroPage />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro Concluído!')).toBeInTheDocument();
    });
  });

  it('exibe tela de pagamento concluído para tipos clinica e entidade mesmo sem contrato_aceito', async () => {
    mockGet.mockReturnValue(null); // sem id na URL

    // Sessão retorna contratante do tipo 'clinica' sem contrato_aceito mas com pagamento confirmado
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            contratante: {
              id: 77,
              nome: 'Clinica Nova',
              tipo: 'clinica',
              pagamento_confirmado: true,
              contrato_aceito: false,
            },
          }),
      })
    );

    render(<SucessoCadastroPage />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro Concluído!')).toBeInTheDocument();
    });

    // Agora testar tipo 'entidade'
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            contratante: {
              id: 88,
              nome: 'Entidade Teste',
              tipo: 'entidade',
              pagamento_confirmado: true,
              contrato_aceito: false,
            },
          }),
      })
    );

    render(<SucessoCadastroPage />);

    await waitFor(() => {
      expect(screen.getByText('Cadastro Concluído!')).toBeInTheDocument();
    });
  });

  it('exibe mensagem de dados enviados para administrador quando tipo=personalizado e API falha', async () => {
    // Simular query params: id=50, tipo=personalizado
    mockGet.mockImplementation((key) =>
      key === 'id' ? '50' : key === 'tipo' ? 'personalizado' : null
    );

    // Sessão retorna não autenticada
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    );

    // A rota /api/public/contratante retorna erro (500)
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Erro ao buscar dados' }),
      })
    );

    render(<SucessoCadastroPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Dados enviados com sucesso!')
      ).toBeInTheDocument();
    });
  });

  it('abre ModalContrato automaticamente quando contrato_id está na querystring', async () => {
    // Simular query params: id=123 e contrato_id=999
    mockGet.mockImplementation((key) =>
      key === 'id' ? '123' : key === 'contrato_id' ? '999' : null
    );

    // Sessão retorna não autenticada
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    );

    // /api/public/contratante?id=123 retorna contratante básico
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            contratante: {
              id: 123,
              nome: 'Empresa Teste',
              pagamento_confirmado: false,
              status: 'aguardando_pagamento',
            },
          }),
      })
    );

    // /api/contratos/999 deve retornar o contrato
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            contrato: {
              id: 999,
              conteudo: 'Conteúdo do contrato de teste',
              aceito: false,
            },
          }),
      })
    );

    render(<SucessoCadastroPage />);

    await waitFor(() => {
      expect(screen.getByText('Contrato de Serviço')).toBeInTheDocument();
      // Modal exibe o contrato padrão unificado
      expect(
        screen.getByText(/CONTRATO DE PRESTAÇÃO DE SERVIÇOS DIGITAIS/i)
      ).toBeInTheDocument();
    });
  });

  it('mostra o popup de sucesso (alert) igual ao simulador quando pagamento é confirmado no fluxo personalizado', async () => {
    mockGet.mockReturnValue(null); // sem id na URL

    // 1) /api/auth/session retorna contratante com plano definido
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            contratante: {
              id: 55,
              nome: 'Empresa Teste',
              pagamento_confirmado: false,
              contrato_aceito: true,
              plano_id: 2,
            },
          }),
      })
    );

    // 2) /api/planos retorna o plano
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            planos: [{ id: 2, nome: 'Plano Teste', preco: 499 }],
          }),
      })
    );

    // 3) POST /api/pagamento (iniciar) -> retorna pagamento.id
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ pagamento: { id: 42 } }),
      })
    );

    // 4) POST /api/pagamento/simular -> retorna success
    mockFetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, contratante_id: 55 }),
      })
    );

    // Mock do alert
    const mockAlert = jest.fn();
    (global as any).alert = mockAlert;

    render(<SucessoCadastroPage />);

    // Esperar botão Realizar Pagamento aparecer
    const pagarBtn = await screen.findByRole('button', {
      name: /Realizar Pagamento/i,
    });
    expect(pagarBtn).toBeInTheDocument();

    // Abrir modal
    pagarBtn.click();

    // Selecionar método PIX (clicar no texto 'PIX' que está visível no card)
    const pixLabel = await screen.findByText('PIX');
    expect(pixLabel).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(pixLabel);

    // Clicar em Simular Pagamento
    const simBtn = await screen.findByRole('button', {
      name: /Simular Pagamento/i,
    });
    expect(simBtn).toBeInTheDocument();
    simBtn.click();

    // Esperar pelo texto de sucesso dentro do modal
    await waitFor(
      () =>
        expect(screen.getByText(/Pagamento Confirmado!/i)).toBeInTheDocument(),
      { timeout: 3000 }
    );

    // Esperar que o alert da página SucessoCadastro tenha sido chamado
    await waitFor(() => expect(mockAlert).toHaveBeenCalled(), {
      timeout: 2500,
    });

    expect(mockAlert).toHaveBeenCalledWith(
      'Pagamento confirmado!\n\n' +
        'Seu acesso foi liberado.\n' +
        'O comprovante de pagamento está disponível em:\n' +
        'Informações da Conta > Plano > Baixar Comprovante'
    );

    // E também esperar que o modal de sucesso da página seja exibido imediatamente
    const dialog = await screen.findByRole('dialog', {
      name: /Cadastro Concluído!/i,
      timeout: 2500,
    });

    // Modal deve exibir a mensagem de confirmação dentro do próprio diálogo
    const { getByText: getByTextWithin } = within(dialog);
    expect(
      getByTextWithin(/Seu cadastro foi realizado com sucesso/i)
    ).toBeInTheDocument();
  });
});
