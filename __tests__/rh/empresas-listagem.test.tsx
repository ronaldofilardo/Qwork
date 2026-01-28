/**
 * Testes para a página de listagem de empresas (/rh/empresas)
 * Validação do fluxo correto: listagem → seleção explícita → dashboard
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmpresasPage from '@/app/rh/empresas/page';

// Mock do Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: jest.fn((param) => {
      if (param === 'tab') return 'overview';
      return null;
    }),
  }),
}));

describe('Empresas Listagem Page', () => {
  const mockEmpresas = [
    {
      id: 1,
      nome: 'Empresa Alpha',
      cnpj: '12.345.678/0001-00',
      email: 'contato@alpha.com',
      telefone: '(11) 99999-9999',
      cidade: 'São Paulo',
      estado: 'SP',
      ativa: true,
    },
    {
      id: 2,
      nome: 'Empresa Beta',
      cnpj: '98.765.432/0001-99',
      email: 'contato@beta.com',
      telefone: '(21) 88888-8888',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      ativa: true,
    },
    {
      id: 3,
      nome: 'Empresa Gamma',
      cnpj: '11.122.233/0001-44',
      email: 'contato@gamma.com',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      ativa: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn((url) => {
      if (url === '/api/rh/empresas') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmpresas),
        });
      }

      return Promise.reject(new Error('URL não mockada'));
    }) as jest.Mock;
  });

  describe('Renderização da listagem', () => {
    it('deve exibir o título da página', async () => {
      render(<EmpresasPage />);

      await waitFor(() => {
        expect(screen.getByText('Gerenciar Empresas')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Cadastre e gerencie as empresas da sua clínica')
      ).toBeInTheDocument();
    });

    it('deve exibir loading inicial', () => {
      render(<EmpresasPage />);

      expect(screen.getByText('Carregando empresas...')).toBeInTheDocument();
    });

    it('deve exibir todas as empresas cadastradas', async () => {
      render(<EmpresasPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresas Cadastradas')).toBeInTheDocument();
      });

      expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
      expect(screen.getByText('Empresa Beta')).toBeInTheDocument();
      expect(screen.getByText('Empresa Gamma')).toBeInTheDocument();
    });

    it('deve exibir botão "Nova Empresa"', async () => {
      render(<EmpresasPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresas Cadastradas')).toBeInTheDocument();
      });

      const novaEmpresaButton = screen.getByRole('button', {
        name: /nova empresa/i,
      });
      expect(novaEmpresaButton).toBeInTheDocument();
    });

    it('deve exibir informações da empresa no card', async () => {
      render(<EmpresasPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
      });

      // Verifica CNPJ
      expect(screen.getByText(/12\.345\.678\/0001-00/)).toBeInTheDocument();

      // Verifica email
      expect(screen.getByText(/contato@alpha\.com/)).toBeInTheDocument();

      // Verifica telefone
      expect(screen.getByText(/\(11\) 99999-9999/)).toBeInTheDocument();

      // Verifica localização
      expect(screen.getByText(/São Paulo, SP/)).toBeInTheDocument();

      // Verifica status ativa
      expect(screen.getAllByText('Ativa')[0]).toBeInTheDocument();
    });
  });

  describe('Navegação para dashboard da empresa', () => {
    it('NÃO deve redirecionar automaticamente ao carregar empresas', async () => {
      render(<EmpresasPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresas Cadastradas')).toBeInTheDocument();
      });

      // Aguarda um pouco mais para garantir que não houve redirecionamento
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verifica que não houve chamada ao router.push
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('deve redirecionar para dashboard apenas após clique no card', async () => {
      render(<EmpresasPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
      });

      // Clica no card da Empresa Alpha
      const empresaCard = screen.getByText('Empresa Alpha').closest('div');
      fireEvent.click(empresaCard);

      // Verifica redirecionamento para o dashboard da empresa
      expect(mockPush).toHaveBeenCalledWith('/rh/empresa/1?tab=overview');
    });

    it('deve permitir seleção explícita de diferentes empresas', async () => {
      render(<EmpresasPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
      });

      // Clica na Empresa Beta
      const betaCard = screen.getByText('Empresa Beta').closest('div');
      fireEvent.click(betaCard);

      expect(mockPush).toHaveBeenCalledWith('/rh/empresa/2?tab=overview');

      // Limpa mocks e clica na Empresa Gamma
      mockPush.mockClear();

      const gammaCard = screen.getByText('Empresa Gamma').closest('div');
      fireEvent.click(gammaCard);

      expect(mockPush).toHaveBeenCalledWith('/rh/empresa/3?tab=overview');
    });
  });

  describe('Estado vazio', () => {
    it('deve exibir mensagem quando não há empresas cadastradas', async () => {
      global.fetch = jest.fn((url) => {
        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return Promise.reject(new Error('URL não mockada'));
      }) as jest.Mock;

      render(<EmpresasPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Nenhuma empresa cadastrada')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Para começar a gerenciar avaliações psicossociais/)
      ).toBeInTheDocument();

      expect(
        screen.getByRole('button', { name: /cadastrar primeira empresa/i })
      ).toBeInTheDocument();
    });

    it('NÃO deve redirecionar automaticamente quando não há empresas', async () => {
      global.fetch = jest.fn((url) => {
        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return Promise.reject(new Error('URL não mockada'));
      }) as jest.Mock;

      render(<EmpresasPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Nenhuma empresa cadastrada')
        ).toBeInTheDocument();
      });

      // Aguarda para garantir que não houve redirecionamento
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Cadastro de nova empresa', () => {
    it('deve abrir modal ao clicar em "Nova Empresa"', async () => {
      render(<EmpresasPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresas Cadastradas')).toBeInTheDocument();
      });

      const novaEmpresaButton = screen.getByRole('button', {
        name: /nova empresa/i,
      });
      fireEvent.click(novaEmpresaButton);

      await waitFor(() =>
        expect(screen.getByText('Nova Empresa Cliente')).toBeInTheDocument()
      );
      expect(
        screen.getByPlaceholderText('00.000.000/0000-00')
      ).toBeInTheDocument();
    });

    it('deve atualizar a lista após cadastrar nova empresa sem redirecionar', async () => {
      const novaEmpresa = {
        id: 4,
        nome: 'Empresa Delta',
        cnpj: '44.444.444/0001-44',
        email: 'contato@delta.com',
        ativa: true,
      };

      global.fetch = jest.fn((url, options) => {
        if (url === '/api/rh/empresas' && options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(novaEmpresa),
          });
        }

        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEmpresas),
          });
        }

        return Promise.reject(new Error('URL não mockada'));
      }) as jest.Mock;

      render(<EmpresasPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresas Cadastradas')).toBeInTheDocument();
      });

      // Abre formulário
      const novaEmpresaButton = screen.getByRole('button', {
        name: /nova empresa/i,
      });
      fireEvent.click(novaEmpresaButton);

      // Aguarda modal abrir
      await waitFor(() =>
        expect(screen.getByText('Nova Empresa Cliente')).toBeInTheDocument()
      );

      // Preenche formulário usando data-testid e placeholder
      const nomeInput = screen.getByTestId('empresa-nome');
      const cnpjInput = screen.getByPlaceholderText('00.000.000/0000-00');

      fireEvent.change(nomeInput, { target: { value: 'Empresa Delta' } });
      fireEvent.change(cnpjInput, { target: { value: '11.222.333/0001-81' } });

      // Preencher dados do representante (obrigatórios no modal)
      fireEvent.change(screen.getByTestId('representante-nome'), {
        target: { value: 'João Secretario' },
      });
      fireEvent.change(screen.getByTestId('representante-fone'), {
        target: { value: '(11) 99999-0000' },
      });
      fireEvent.change(screen.getByTestId('representante-email'), {
        target: { value: 'joao@delta.com' },
      });

      // Submete formulário (modal)
      const submitButton = screen.getByRole('button', {
        name: /salvar empresa/i,
      });
      fireEvent.click(submitButton);

      // Garantir que a API POST foi chamada
      await waitFor(() =>
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/rh/empresas',
          expect.objectContaining({ method: 'POST' })
        )
      );

      // A lista deve mostrar a empresa adicionada localmente
      await waitFor(() => {
        expect(screen.getByText('Empresa Delta')).toBeInTheDocument();
      });

      // Verifica que NÃO houve redirecionamento automático
      expect(mockPush).not.toHaveBeenCalled();

      // Verifica que a nova empresa aparece na lista
      expect(screen.getByText('Empresa Delta')).toBeInTheDocument();
    });
  });

  describe('Botão Voltar', () => {
    it('deve redirecionar para /rh ao clicar em Voltar', async () => {
      render(<EmpresasPage />);

      await waitFor(() => {
        expect(screen.getByText('Gerenciar Empresas')).toBeInTheDocument();
      });

      const voltarButton = screen.getByRole('button', { name: /voltar/i });
      fireEvent.click(voltarButton);

      expect(mockPush).toHaveBeenCalledWith('/rh');
    });
  });
});
