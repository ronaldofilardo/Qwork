/**
 * @fileoverview Testes da página de sucesso de cadastro (simplificada)
 * @description Testa fluxo de aceite de contrato após cadastro
 */

import type { Mock } from 'jest';
import { render, screen, waitFor } from '@testing-library/react';
import SucessoCadastroPage from '@/app/sucesso-cadastro/page';

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
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  it('exibe mensagem de link inválido quando não há contrato_id na URL', async () => {
    mockGet.mockReturnValue(null);

    render(<SucessoCadastroPage />);

    await waitFor(() => {
      expect(screen.getByText(/link inv.lido/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Solicite um novo link ao suporte/i)
      ).toBeInTheDocument();
    });
  });

  it('exibe título Cadastro Realizado quando contrato_id está presente', async () => {
    mockGet.mockImplementation((key: string) =>
      key === 'contrato_id' ? '999' : null
    );

    const mockContrato = {
      id: 999,
      tomador_nome: 'Empresa Teste',
      tomador_cnpj: '12.345.678/0001-90',
      conteudo: 'Conteúdo do contrato',
      aceito: false,
      criado_em: '2024-01-01',
      atualizado_em: '2024-01-01',
    };

    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ contrato: mockContrato }),
      } as Response)
    );

    render(<SucessoCadastroPage />);

    expect(screen.getByText('Cadastro Realizado!')).toBeInTheDocument();
  });

  it('abre ModalContrato automaticamente quando contrato_id está na URL', async () => {
    mockGet.mockImplementation((key: string) =>
      key === 'contrato_id' ? '999' : null
    );

    const mockContrato = {
      id: 999,
      tomador_nome: 'Empresa Teste',
      tomador_cnpj: '12.345.678/0001-90',
      conteudo: 'Conteúdo do contrato',
      aceito: false,
      criado_em: '2024-01-01',
      atualizado_em: '2024-01-01',
    };

    (global.fetch as Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ contrato: mockContrato }),
      } as Response)
    );

    render(<SucessoCadastroPage />);

    await waitFor(() => {
      expect(screen.getByText('Contrato de Serviço')).toBeInTheDocument();
    });
  });
});
