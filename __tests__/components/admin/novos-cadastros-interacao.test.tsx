/**
 * NovoscadastrosContent — Interação: checkbox e filtros de tipo
 * Cobre: marcar/desmarcar visualização, filtros Todos/Clínicas/Entidades
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('NovoscadastrosContent — Checkbox e visualização', () => {
  it('deve marcar tomador como visualizado ao clicar no checkbox', async () => {
    render(<NovoscadastrosContent />);

    const checkboxes = await screen.findAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
  });

  it('deve desmarcar tomador ao clicar novamente no checkbox', async () => {
    render(<NovoscadastrosContent />);

    const checkboxes = await screen.findAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).toBeChecked();
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0]).not.toBeChecked();
  });

  it('deve aplicar opacity-60 ao card marcado como visualizado', async () => {
    const { container } = render(<NovoscadastrosContent />);

    const checkboxes = await screen.findAllByRole('checkbox');
    const cards = container.querySelectorAll('.border.border-gray-200');

    fireEvent.click(checkboxes[0]);

    await waitFor(() => {
      expect(cards[0].className).toMatch(/opacity-60/);
    });
  });

  it('deve permitir marcar múltiplos tomadores como visualizados', async () => {
    render(<NovoscadastrosContent />);

    const checkboxes = await screen.findAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).toBeChecked();
    expect(checkboxes[2]).toBeChecked();
  });
});

describe('NovoscadastrosContent — Filtros de Tipo', () => {
  it('deve exibir todos os tomadores com filtro "Todos"', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getByText('Clínica Exemplo')).toBeInTheDocument();
      expect(screen.getByText('Empresa Em Reanálise')).toBeInTheDocument();
      expect(screen.getByText('Clínica Aprovada')).toBeInTheDocument();
    });
  });

  it('deve buscar com tipo=clinica ao clicar em "Clínicas"', async () => {
    // Segunda chamada (refetch após filtro)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tomadores: [mockTomadores[0], mockTomadores[2]],
        total: 2,
      }),
    });

    render(<NovoscadastrosContent />);

    const clinicasButton = await screen.findByText('Clínicas');
    fireEvent.click(clinicasButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('tipo=clinica')
      );
    });
  });

  it('deve buscar com tipo=entidade ao clicar em "Entidades"', async () => {
    // Segunda chamada (refetch após filtro)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tomadores: [mockTomadores[1]], total: 1 }),
    });

    render(<NovoscadastrosContent />);

    const entidadesButton = await screen.findByText('Entidades');
    fireEvent.click(entidadesButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('tipo=entidade')
      );
    });
  });

  it('deve destacar botão do filtro selecionado com bg-orange-500', async () => {
    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getByText('Todos')).toHaveClass('bg-orange-500');
    });

    fireEvent.click(screen.getByText('Clínicas'));

    await waitFor(() => {
      expect(screen.getByText('Clínicas')).toHaveClass('bg-orange-500');
      expect(screen.getByText('Todos')).not.toHaveClass('bg-orange-500');
    });
  });
});
