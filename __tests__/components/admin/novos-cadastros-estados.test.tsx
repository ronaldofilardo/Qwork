/**
 * NovoscadastrosContent — Badges, estados de loading/vazia e ausência de ações
 * Cobre: badges de status, spinner, lista vazia, sem botões de ação/detalhe
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { NovoscadastrosContent } from '@/components/admin/NovoscadastrosContent';

jest.mock('@/lib/session');
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockTomadores = [
  {
    id: 1,
    nome: 'Clínica Exemplo',
    tipo: 'clinica' as const,
    status: 'pendente' as const,
    email: 'clinica@teste.com',
    telefone: '11999999999',
    endereco: 'Rua Teste, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234567',
    cnpj: '12.345.678/0001-99',
    criado_em: '2025-01-01T10:00:00Z',
  },
  {
    id: 2,
    nome: 'Empresa Em Reanálise',
    tipo: 'entidade' as const,
    status: 'em_reanalise' as const,
    email: 'empresa@teste.com',
    telefone: '11888888888',
    endereco: 'Av Teste, 456',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '02345678',
    cnpj: '98.765.432/0001-00',
    criado_em: '2025-01-02T10:00:00Z',
  },
  {
    id: 3,
    nome: 'Clínica Aprovada',
    tipo: 'clinica' as const,
    status: 'aprovado' as const,
    email: 'clinica.aprovada@teste.com',
    telefone: '11777777777',
    endereco: 'Av Aprovada, 789',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    cep: '03345678',
    cnpj: '11.111.111/0001-11',
    criado_em: '2025-01-03T10:00:00Z',
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ tomadores: mockTomadores, total: 3 }),
  });
});

describe('NovoscadastrosContent — Badges de Status', () => {
  it('deve exibir badge "✓ Aprovado" para status aprovado', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getByText('✓ Aprovado')).toBeInTheDocument();
    });
  });

  it('deve exibir badge "Pendente" para status pendente', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });
  });

  it('deve exibir badge "Em Reanálise" para status em_reanalise', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getByText('Em Reanálise')).toBeInTheDocument();
    });
  });
});

describe('NovoscadastrosContent — Estados de loading e lista vazia', () => {
  it('deve mostrar spinner enquanto carrega', async () => {
    let resolveLoad!: (v: Response) => void;
    mockFetch.mockReset();
    mockFetch.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveLoad = resolve;
        })
    );

    render(<NovoscadastrosContent />);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    // Resolver a promise pendente para não vazar handles abertos
    await act(async () => {
      resolveLoad({
        ok: true,
        json: async () => ({ tomadores: mockTomadores, total: 3 }),
      } as Response);
    });
  });

  it('deve mostrar mensagem quando não há cadastros', async () => {
    mockFetch.mockReset();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tomadores: [], total: 0 }),
    });

    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getByText('Nenhum cadastro pendente')).toBeInTheDocument();
    });
  });
});

describe('NovoscadastrosContent — Sem botões de ação', () => {
  it('não deve exibir botões de ação (Aprovar, Rejeitar, Deletar…)', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.queryByText('Aprovar')).not.toBeInTheDocument();
      expect(screen.queryByText('Rejeitar')).not.toBeInTheDocument();
      expect(screen.queryByText('Reanálise')).not.toBeInTheDocument();
      expect(screen.queryByText('Deletar')).not.toBeInTheDocument();
      expect(screen.queryByText('Regenerar Link')).not.toBeInTheDocument();
    });
  });

  it('não deve exibir informações detalhadas (responsável, documentos)', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.queryByText(/Responsável/)).not.toBeInTheDocument();
      expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
      expect(screen.queryByText('Cartão CNPJ')).not.toBeInTheDocument();
      expect(screen.queryByText('Contrato Social')).not.toBeInTheDocument();
      expect(screen.queryByText('Doc. Identificação')).not.toBeInTheDocument();
    });
  });
});
