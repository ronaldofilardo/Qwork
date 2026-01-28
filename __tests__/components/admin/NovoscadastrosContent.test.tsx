/**
 * Testes para componente NovoscadastrosContent
 * - Botão "Regenerar Link" para contratantes aguardando pagamento
 * - Modal de confirmação e feedback
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

// Mock do alert
const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

describe('NovoscadastrosContent', () => {
  const mockContratantes = [
    {
      id: 1,
      nome: 'Clínica Pendente',
      tipo: 'clinica' as const,
      status: 'pendente' as const,
      email: 'clinica@teste.com',
      telefone: '11999999999',
      endereco: 'Rua Teste, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234567',
      responsavel_nome: 'João Silva',
      responsavel_cpf: '12345678901',
      responsavel_cargo: 'Diretor',
      responsavel_email: 'joao@teste.com',
      responsavel_celular: '11999999999',
      cartao_cnpj_path: '/uploads/teste1.pdf',
      contrato_social_path: '/uploads/teste2.pdf',
      doc_identificacao_path: '/uploads/teste3.pdf',
      pagamento_confirmado: false,
      numero_funcionarios_estimado: 10,
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
      responsavel_nome: 'Maria Silva',
      responsavel_cpf: '98765432100',
      responsavel_cargo: 'Gerente',
      responsavel_email: 'maria@teste.com',
      responsavel_celular: '11888888888',
      cartao_cnpj_path: '/uploads/teste4.pdf',
      contrato_social_path: '/uploads/teste5.pdf',
      doc_identificacao_path: '/uploads/teste6.pdf',
      pagamento_confirmado: false,
      numero_funcionarios_estimado: 5,
      criado_em: '2025-01-02T10:00:00Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock da sessão
    jest.mock('@/lib/session', () => ({
      getSession: jest.fn(() => ({
        cpf: '12345678901',
        perfil: 'admin',
        nome: 'Admin Teste',
      })),
    }));

    // Mock do fetch para buscar contratantes
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        contratantes: mockContratantes,
        total: 2,
      }),
    });
  });

  describe('Renderização inicial', () => {
    it('deve renderizar lista de contratantes', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        expect(screen.getByText('Clínica Pendente')).toBeInTheDocument();
        expect(screen.getByText('Empresa Aguardando')).toBeInTheDocument();
      });
    });

    it('deve mostrar filtros de tipo e status', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        expect(screen.getByText('Todos')).toBeInTheDocument();
        expect(screen.getByText('Clínicas')).toBeInTheDocument();
        expect(screen.getByText('Entidades')).toBeInTheDocument();
        expect(screen.getByText('Todos Status')).toBeInTheDocument();
        // Verificar que pelo menos um elemento "Pendente" existe (botão de filtro ou badge)
        expect(screen.getAllByText('Pendente').length).toBeGreaterThan(0);
        expect(
          screen.getAllByText('Aguardando Pagamento').length
        ).toBeGreaterThan(0);
      });
    });
  });

  describe('Contratantes aguardando pagamento', () => {
    it('deve mostrar badge "Aguardando Pagamento" para contratante com status adequado', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        // Procurar especificamente pelo badge (span), não pelo botão de filtro
        const badges = screen
          .getAllByText('Aguardando Pagamento')
          .filter((element) => element.tagName.toLowerCase() === 'span');
        expect(badges).toHaveLength(1);
      });
    });

    it('deve mostrar botão "Regenerar Link" para contratante aguardando pagamento', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const regenerarButtons = screen.getAllByText('Regenerar Link');
        expect(regenerarButtons).toHaveLength(1);
      });
    });

    it('deve mostrar botão "Forçar Aprovação" para contratante aguardando pagamento', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const forcarButtons = screen.getAllByText('Forçar Aprovação');
        expect(forcarButtons).toHaveLength(1);
      });
    });

    it('não deve mostrar botão "Regenerar Link" para contratante pendente', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const regenerarButtons = screen.queryAllByText('Regenerar Link');
        expect(regenerarButtons).toHaveLength(1); // Apenas para o aguardando_pagamento
      });
    });
  });

  describe('Ação Regenerar Link', () => {
    it('deve abrir modal de confirmação ao clicar em "Regenerar Link"', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const regenerarButton = screen.getByText('Regenerar Link');
        fireEvent.click(regenerarButton);
      });

      expect(
        screen.getByText('Confirmar Regeneração de Link')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Tem certeza que deseja regenerar o link/)
      ).toBeInTheDocument();
    });

    it('deve chamar API correta ao confirmar regeneração', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          contratante: {
            id: 2,
            link_pagamento:
              'http://localhost:3000/pagamento/simulador?contratante_id=2&retry=true',
            link_expiracao: '2025-01-03T10:00:00.000Z',
          },
          message: 'Link de pagamento regenerado com sucesso',
        }),
      });

      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const regenerarButton = screen.getByText('Regenerar Link');
        fireEvent.click(regenerarButton);
      });

      const confirmarButton = screen.getByText('Confirmar');
      fireEvent.click(confirmarButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/novos-cadastros', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contratante_id: 2,
            acao: 'regenerar_link',
          }),
        });
      });
    });

    it.skip('deve mostrar alerta com link gerado após sucesso', async () => {
      const alertMock = jest
        .spyOn(window, 'alert')
        .mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          contratante: {
            id: 2,
            link_pagamento:
              'http://localhost:3000/pagamento/simulador?contratante_id=2&retry=true',
            link_expiracao: '2025-01-03T10:00:00.000Z',
          },
          message: 'Link de pagamento regenerado com sucesso',
        }),
      });

      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const regenerarButton = screen.getByText('Regenerar Link');
        fireEvent.click(regenerarButton);
      });

      // Verificar se o modal apareceu
      await waitFor(() => {
        expect(screen.getByText('Confirmar')).toBeInTheDocument();
      });

      const confirmarButton = screen.getByText('Confirmar');
      fireEvent.click(confirmarButton);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining('Link regenerado com sucesso!')
        );
        expect(alertMock).toHaveBeenCalledWith(
          expect.stringContaining(
            'http://localhost:3000/pagamento/simulador?contratante_id=2&retry=true'
          )
        );
      });

      alertMock.mockRestore();
    });

    it('deve mostrar erro se API falhar', async () => {
      const alertMock = jest
        .spyOn(window, 'alert')
        .mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Erro interno ao regenerar link de pagamento',
        }),
      });

      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const regenerarButton = screen.getByText('Regenerar Link');
        fireEvent.click(regenerarButton);
      });

      const confirmarButton = screen.getByText('Confirmar');
      fireEvent.click(confirmarButton);

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith(
          'Erro interno ao regenerar link de pagamento'
        );
      });

      alertMock.mockRestore();
    });
  });

  describe('Filtros', () => {
    it('deve filtrar por status "Aguardando Pagamento"', async () => {
      // Mock para filtro específico
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          contratantes: [mockContratantes[1]], // Apenas o aguardando_pagamento
          total: 1,
        }),
      });

      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const aguardandoButtons = screen.getAllByText('Aguardando Pagamento');
        // Clicar no botão de filtro (não no badge)
        const filterButton = aguardandoButtons.find(
          (btn) => btn.tagName.toLowerCase() === 'button'
        );
        fireEvent.click(filterButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Empresa Aguardando')).toBeInTheDocument();
        expect(screen.queryByText('Clínica Pendente')).not.toBeInTheDocument();
      });
    });

    it('deve atualizar lista ao mudar filtro', async () => {
      render(<NovoscadastrosContent />);

      await waitFor(() => {
        expect(screen.getByText('Clínica Pendente')).toBeInTheDocument();
      });

      // Simular mudança de filtro
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          contratantes: [],
          total: 0,
        }),
      });

      const clinicasButton = screen.getByText('Clínicas');
      fireEvent.click(clinicasButton);

      await waitFor(() => {
        const fetchCalls = mockFetch.mock.calls;
        const hasClinicaFilter = fetchCalls.some(
          (call) => call[0] && call[0].includes('tipo=clinica')
        );
        expect(hasClinicaFilter).toBe(true);
      });
    });
  });

  describe('Estados de loading', () => {
    it('deve mostrar loading inicial', () => {
      render(<NovoscadastrosContent />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('deve mostrar loading durante ação', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          contratante: { id: 2 },
          message: 'Sucesso',
        }),
      });

      render(<NovoscadastrosContent />);

      await waitFor(() => {
        const regenerarButton = screen.getByText('Regenerar Link');
        fireEvent.click(regenerarButton);
      });

      const confirmarButton = screen.getByText('Confirmar');
      fireEvent.click(confirmarButton);

      expect(screen.getByText('Processando...')).toBeInTheDocument();
    });
  });
});
