/**
 * Testes para componente NovoscadastrosContent (versão simplificada)
 * - Filtros de tipo (Todos, Clínicas, Entidades)
 * - Checkbox para marcar como visualizado
 * - Badges de status
 * - Exibição minimalista
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NovoscadastrosContent } from '@/components/admin/NovoscadastrosContent';

// Mocks
jest.mock('@/lib/session');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('NovoscadastrosContent - Design Simplificado', () => {
  const mocktomadores = [
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
      pagamento_confirmado: false,
      criado_em: '2025-01-01T10:00:00Z',
    },
    {
      id: 2,
      nome: 'Empresa Aguardando',
      tipo: 'entidade' as const,
      status: 'aguardando_pagamento' as const,
      email: 'empresa@teste.com',
      telefone: '11888888888',
      endereco: 'Av Teste, 456',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      cep: '02345678',
      cnpj: '98.765.432/0001-00',
      pagamento_confirmado: false,
      criado_em: '2025-01-02T10:00:00Z',
    },
    {
      id: 3,
      nome: 'Clínica Paga',
      tipo: 'clinica' as const,
      status: 'pago' as const,
      email: 'clinica.paga@teste.com',
      telefone: '11777777777',
      endereco: 'Av Paga, 789',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      cep: '03345678',
      cnpj: '11.111.111/0001-11',
      pagamento_confirmado: true,
      data_liberacao_login: '2025-01-03T10:00:00Z',
      criado_em: '2025-01-03T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock do fetch para buscar tomadores
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tomadores: mocktomadores,
        total: 3,
      }),
    });
  });

  describe('Renderização inicial', () => {
    it('deve renderizar lista de tomadores com design simplificado', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        expect(screen.getByText('Clínica Exemplo')).toBeInTheDocument();
        expect(screen.getByText('Empresa Aguardando')).toBeInTheDocument();
        expect(screen.getByText('Clínica Paga')).toBeInTheDocument();
      });
    });

    it('deve mostrar apenas filtros de tipo (sem filtros de status)', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        // Deve existir 3 botões de filtro (Todos, Clínicas, Entidades)
        const buttons = screen.getAllByRole('button');
        expect(buttons).toHaveLength(3);

        // Verificar conteúdo dos botões
        expect(screen.getByText('Todos')).toBeInTheDocument();
        expect(screen.getByText('Clínicas')).toBeInTheDocument();
        expect(screen.getByText('Entidades')).toBeInTheDocument();

        // NÃO deve existir "Todos Status" como botão de filtro
        const allButtons = [...document.querySelectorAll('button')];
        const todosStatusButton = allButtons.find(
          (btn) => btn.textContent === 'Todos Status'
        );
        expect(todosStatusButton).toBeUndefined();
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

    it('deve exibir tipo de cada tomador', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const tipoElements = screen.getAllByText('Clínica');
        expect(tipoElements.length).toBeGreaterThan(0);
        expect(screen.getByText('Entidade')).toBeInTheDocument();
      });
    });

    it('deve renderizar checkboxes para cada tomador', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(3);
        checkboxes.forEach((checkbox) => {
          expect(checkbox).not.toBeChecked();
        });
      });
    });
  });

  describe('Checkbox e visualização', () => {
    it('deve marcar tomador como visualizado ao clicar no checkbox', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);
        expect(checkboxes[0]).toBeChecked();
      });
    });

    it('deve desmarcar tomador ao clicar novamente no checkbox', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);
        expect(checkboxes[0]).toBeChecked();
        fireEvent.click(checkboxes[0]);
        expect(checkboxes[0]).not.toBeChecked();
      });
    });

    it('deve aplicar estilo diferente para card visualizado', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        const cardAntes = document.querySelectorAll('div')[10]?.className;

        fireEvent.click(checkboxes[0]);

        const cardDepois = document.querySelectorAll('div')[10]?.className;
        // O card deve ter classe de opacity reduzida após marcar como visualizado
        expect(cardDepois).toMatch(/opacity-60|difference/);
      });
    });

    it('deve permitir marcar múltiplos tomadores como visualizados', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');

        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);
        fireEvent.click(checkboxes[2]);

        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).toBeChecked();
        expect(checkboxes[2]).toBeChecked();
      });
    });
  });

  describe('Badges de Status', () => {
    it('deve exibir badge "Pago" para tomador com pagamento confirmado', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const pagoBadges = screen.getByText('✓ Pago');
        expect(pagoBadges).toBeInTheDocument();
      });
    });

    it('deve exibir badge "Aguardando Pagamento" quando status é aguardando_pagamento', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        // Deve conter o texto "Aguardando Pagamento" em um badge (span)
        const badges = screen.queryAllByText('Aguardando Pagamento');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('deve exibir badge "Pendente" para tomador com status pendente', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const pendenteBadges = screen.getByText('Pendente');
        expect(pendenteBadges).toBeInTheDocument();
      });
    });

    it('deve exibir badge "Em Reanálise" para tomador nesse status', async () => {
      const reanalisadoTomador = {
        id: 4,
        nome: 'Clínica Reanálise',
        tipo: 'clinica' as const,
        status: 'em_reanalise' as const,
        email: 'test@teste.com',
        telefone: '11666666666',
        endereco: 'Rua Reanalise, 999',
        cidade: 'Brasília',
        estado: 'DF',
        cep: '04345678',
        cnpj: '44.444.444/0001-44',
        pagamento_confirmado: false,
        criado_em: '2025-01-04T10:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tomadores: [reanalisadoTomador],
          total: 1,
        }),
      });

      render(<NovoscadastrosContent />);

      await waitFor(() => {
        expect(screen.getByText('Em Reanálise')).toBeInTheDocument();
      });
    });
  });

  describe('Filtros de Tipo', () => {
    it('deve exibir todos os tomadores com filtro "Todos"', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        expect(screen.getByText('Clínica Exemplo')).toBeInTheDocument();
        expect(screen.getByText('Empresa Aguardando')).toBeInTheDocument();
        expect(screen.getByText('Clínica Paga')).toBeInTheDocument();
      });
    });

    it('deve filtrar apenas clínicas ao clicar em "Clínicas"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tomadores: [mocktomadores[0], mocktomadores[2]],
          total: 2,
        }),
      });

      render(<NovoscadastrosContent />);

      const clinicasButton = screen.getByText('Clínicas');
      fireEvent.click(clinicasButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('tipo=clinica'),
          expect.any(Object)
        );
      });
    });

    it('deve filtrar apenas entidades ao clicar em "Entidades"', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tomadores: [mocktomadores[1]],
          total: 1,
        }),
      });

      render(<NovoscadastrosContent />);

      const entidadesButton = screen.getByText('Entidades');
      fireEvent.click(entidadesButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('tipo=entidade'),
          expect.any(Object)
        );
      });
    });

    it('deve ativar botão de filtro selecionado', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const todosButton = screen.getByText('Todos');
        expect(todosButton).toHaveClass('bg-orange-500');
      });

      const clinicasButton = screen.getByText('Clínicas');
      fireEvent.click(clinicasButton);

      expect(clinicasButton).toHaveClass('bg-orange-500');
      expect(screen.getByText('Todos')).not.toHaveClass('bg-orange-500');
    });
  });

  describe('Estados de loading e vazia', () => {
    it('deve mostrar spinner durante carregamento inicial', () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            // Nunca resolve para manter o estado de loading
            setTimeout(() => {}, 5000);
          })
      );

      render(<NovoscadastrosContent />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('deve mostrar mensagem quando lista está vazia', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tomadores: [],
          total: 0,
        }),
      });

      render(<NovoscadastrosContent />);

      await waitFor(() => {
        expect(
          screen.getByText('Nenhum cadastro pendente')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Sem botões de ação', () => {
    it('NÃO deve exibir botões de ação como Aprovar, Rejeitar, etc', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        expect(screen.queryByText('Aprovar')).not.toBeInTheDocument();
        expect(screen.queryByText('Rejeitar')).not.toBeInTheDocument();
        expect(screen.queryByText('Reanálise')).not.toBeInTheDocument();
        expect(screen.queryByText('Deletar')).not.toBeInTheDocument();
        expect(screen.queryByText('Regenerar Link')).not.toBeInTheDocument();
      });
    });

    it('NÃO deve exibir informações detalhadas como responsável ou documentos', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        // Responsável info
        expect(screen.queryByText(/Responsável/)).not.toBeInTheDocument();
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
        expect(screen.queryByText('Maria Silva')).not.toBeInTheDocument();

        // Document downloads
        expect(screen.queryByText('Cartão CNPJ')).not.toBeInTheDocument();
        expect(screen.queryByText('Contrato Social')).not.toBeInTheDocument();
        expect(
          screen.queryByText('Doc. Identificação')
        ).not.toBeInTheDocument();
      });
    });
  });
});
