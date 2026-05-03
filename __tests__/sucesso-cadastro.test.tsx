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
});
