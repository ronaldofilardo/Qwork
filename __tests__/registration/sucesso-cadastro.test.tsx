/**
 * @fileoverview Testes da página /sucesso-cadastro
 * @description Valida abertura automática do ModalContrato e estado de erro
 */

import type { Mock } from 'jest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SucessoCadastroPage from '@/app/sucesso-cadastro/page';

const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGet }),
}));

describe('SucessoCadastroPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  it('exibe "Link inválido" quando não há contrato_id na URL', () => {
    mockGet.mockReturnValue(null);
    render(<SucessoCadastroPage />);
    expect(screen.getByText('Link inválido')).toBeInTheDocument();
    expect(screen.getByText(/Solicite um novo link ao suporte/i)).toBeInTheDocument();
  });

  it('exibe "Cadastro Realizado!" com contrato_id presente', () => {
    mockGet.mockImplementation((key: string) =>
      key === 'contrato_id' ? '59' : null
    );
    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'not found' }),
    } as Response);
    render(<SucessoCadastroPage />);
    expect(screen.getByText('Cadastro Realizado!')).toBeInTheDocument();
  });

  it('abre ModalContrato automaticamente ao carregar com contrato_id', async () => {
    mockGet.mockImplementation((key: string) =>
      key === 'contrato_id' ? '59' : null
    );

    const mockContrato = {
      id: 59,
      tomador_id: 8,
      tomador_nome: 'Empresa Teste',
      tomador_cnpj: '28.081.722/0001-37',
      conteudo: 'Conteúdo do contrato',
      aceito: false,
      criado_em: '2026-01-01T00:00:00.000Z',
      atualizado_em: '2026-01-01T00:00:00.000Z',
    };

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ contrato: mockContrato }),
    } as Response);

    render(<SucessoCadastroPage />);

    await waitFor(() => {
      expect(screen.getByText('Contrato de Serviço')).toBeInTheDocument();
    });
  });

  it('exibe botão "Ver e Aceitar Contrato" quando modal está fechado', async () => {
    mockGet.mockImplementation((key: string) =>
      key === 'contrato_id' ? '59' : null
    );

    const mockContrato = {
      id: 59,
      tomador_id: 8,
      tomador_nome: 'Empresa Teste',
      conteudo: 'Conteúdo',
      aceito: false,
      criado_em: '2026-01-01T00:00:00.000Z',
      atualizado_em: '2026-01-01T00:00:00.000Z',
    };

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ contrato: mockContrato }),
    } as Response);

    render(<SucessoCadastroPage />);

    // Modal abre, então o botão só aparece quando modal é fechado
    await waitFor(() =>
      expect(screen.getByText('Contrato de Serviço')).toBeInTheDocument()
    );

    // Fechar modal
    fireEvent.click(screen.getByRole('button', { name: '' }));

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Ver e Aceitar Contrato/i })
      ).toBeInTheDocument();
    });
  });
});

