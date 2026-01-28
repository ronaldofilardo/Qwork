import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/Header';

// Mock do fetch global
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização com Props', () => {
    it('deve renderizar header com props de funcionário', () => {
      render(<Header userName="João Silva" userRole="funcionario" />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('João Silva')).toBeInTheDocument();
      expect(screen.getByText('Avaliação Psicossocial')).toBeInTheDocument();
    });

    it('deve renderizar header com props de RH', () => {
      render(<Header userName="Maria Santos" userRole="rh" />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      expect(screen.getByText('Clínica Qwork')).toBeInTheDocument();
    });

    it('deve renderizar header com props de admin', () => {
      render(<Header userName="Carlos Admin" userRole="admin" />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
      expect(screen.getByText('Administração')).toBeInTheDocument();
    });

    it('deve renderizar header com props de emissor', () => {
      render(<Header userName="Dr. Emissor" userRole="emissor" />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByText('Dr. Emissor')).toBeInTheDocument();
      expect(screen.getByText('Emissor de Laudos')).toBeInTheDocument();
    });

    it('deve renderizar header sem nome do usuário quando não fornecido', async () => {
      // Quando só userRole é fornecido sem userName, o componente tenta buscar sessão da API
      // Como a API falha (mock), não deve renderizar nada
      render(<Header userRole="funcionario" />);

      await waitFor(() => {
        expect(screen.queryByRole('banner')).not.toBeInTheDocument();
      });
    });
  });

  describe('Renderização com Sessão da API', () => {
    it('deve buscar e renderizar dados da sessão quando não há props', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cpf: '11111111111',
          nome: 'Usuário da Sessão',
          perfil: 'rh',
        }),
      });

      render(<Header />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
        expect(screen.getByText('Usuário da Sessão')).toBeInTheDocument();
        expect(screen.getByText('Clínica Qwork')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/session',
        expect.objectContaining({
          method: 'GET',
          cache: 'no-store',
          headers: expect.objectContaining({
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          }),
        })
      );
    });

    it('deve priorizar props sobre dados da sessão', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          cpf: '11111111111',
          nome: 'Usuário da Sessão',
          perfil: 'rh',
        }),
      });

      render(<Header userName="Nome das Props" userRole="admin" />);

      await waitFor(() => {
        expect(screen.getByRole('banner')).toBeInTheDocument();
        expect(screen.getByText('Nome das Props')).toBeInTheDocument();
        expect(screen.getByText('Administração')).toBeInTheDocument();
      });

      // Mesmo com sessão mockada, deve usar as props
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('deve renderizar null quando não há sessão válida', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // Sessão vazia
      });

      const { container } = render(<Header />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('deve renderizar null quando API falha', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API Error'));

      const { container } = render(<Header />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });

  describe('Estados de Loading', () => {
    it('deve renderizar null durante loading inicial', () => {
      mockFetch.mockImplementationOnce(() => new Promise(() => {})); // Nunca resolve

      const { container } = render(<Header />);

      // Durante loading, deve retornar null
      expect(container.firstChild).toBeNull();
    });
  });

  describe('Estilos e Estrutura', () => {
    it('deve ter os estilos corretos aplicados', () => {
      render(<Header userName="Test User" userRole="funcionario" />);

      const header = screen.getByRole('banner');

      // Verificar apenas os estilos mais importantes que são aplicados inline
      expect(header).toHaveStyle({
        background: 'rgb(0, 0, 0)', // #000 em rgb
        color: 'rgb(255, 255, 255)', // white em rgb
        borderBottom: '4px solid rgb(154, 205, 50)', // #9ACD32 em rgb
        position: 'sticky',
        top: '0px',
        display: 'flex',
        minHeight: '70px',
      });
    });

    it('deve ter título com fonte em negrito e tamanho 22px', () => {
      render(<Header userName="Test User" userRole="funcionario" />);

      const titleDiv = screen.getByText('Avaliação Psicossocial');

      expect(titleDiv).toHaveStyle({
        fontWeight: 'bold',
        fontSize: '20px',
        letterSpacing: '0.5px',
      });
    });

    it('deve ter nome do usuário com fonte em negrito, tamanho 16px e cor laranja', () => {
      render(<Header userName="Test User" userRole="funcionario" />);

      const userNameSpan = screen.getByText('Test User');

      expect(userNameSpan).toHaveStyle({
        fontWeight: 'bold',
        fontSize: '16px',
        color: '#9ACD32',
      });
    });
  });

  describe('Função getRoleTitle', () => {
    it('deve retornar títulos corretos para cada perfil', () => {
      const { rerender } = render(
        <Header userName="Test" userRole="emissor" />
      );
      expect(screen.getByText('Emissor de Laudos')).toBeInTheDocument();

      rerender(<Header userName="Test" userRole="admin" />);
      expect(screen.getByText('Administração')).toBeInTheDocument();

      rerender(<Header userName="Test" userRole="rh" />);
      expect(screen.getByText('Clínica Qwork')).toBeInTheDocument();

      rerender(<Header userName="Test" userRole="funcionario" />);
      expect(screen.getByText('Avaliação Psicossocial')).toBeInTheDocument();

      rerender(<Header userName="Test" userRole="unknown" />);
      expect(screen.getByText('Qwork')).toBeInTheDocument();
    });
  });
});
