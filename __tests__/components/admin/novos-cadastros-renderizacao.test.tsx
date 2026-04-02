/**
 * NovoscadastrosContent — Renderização inicial
 * Cobre: listagem, filtros de tipo, CNPJ, tipo de tomador, checkboxes
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('NovoscadastrosContent — Renderização inicial', () => {
  it('deve renderizar lista de tomadores', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Exemplo')).toBeInTheDocument();
      expect(screen.getByText('Empresa Em Reanálise')).toBeInTheDocument();
      expect(screen.getByText('Clínica Aprovada')).toBeInTheDocument();
    });
  });

  it('deve mostrar apenas 3 filtros de tipo (sem filtros de status)', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
      expect(screen.getByText('Todos')).toBeInTheDocument();
      expect(screen.getByText('Clínicas')).toBeInTheDocument();
      expect(screen.getByText('Entidades')).toBeInTheDocument();

      const semTodosStatus = [...document.querySelectorAll('button')].find(
        (btn) => btn.textContent === 'Todos Status'
      );
      expect(semTodosStatus).toBeUndefined();
    });
  });

  it('deve exibir CNPJ de cada tomador', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(
        screen.getByText(/CNPJ: 12\.345\.678\/0001-99/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/CNPJ: 98\.765\.432\/0001-00/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/CNPJ: 11\.111\.111\/0001-11/)
      ).toBeInTheDocument();
    });
  });

  it('deve exibir rótulo de tipo (Clínica / Entidade)', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getAllByText('Clínica').length).toBeGreaterThan(0);
      expect(screen.getByText('Entidade')).toBeInTheDocument();
    });
  });

  it('deve renderizar checkbox desmarcado para cada tomador', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
      checkboxes.forEach((cb) => expect(cb).not.toBeChecked());
    });
  });
});
