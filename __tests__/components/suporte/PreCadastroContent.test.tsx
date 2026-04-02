/**
 * @file __tests__/components/suporte/PreCadastroContent.test.tsx
 * @description Testes do componente PreCadastroContent
 *
 * Cobre:
 *   - Renderização com dados
 *   - Estado vazio
 *   - Estado de loading
 *   - Estado de erro
 *   - Filtros de tipo (todos / clínica / entidade)
 *   - Botão de copiar link (geração de URL correta)
 *   - Botão de refresh
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { PreCadastroContent } from '@/components/suporte/PreCadastroContent';

// ──────────────────────────────────────────────
// Mocks globais
// ──────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock clipboard
const mockWriteText = jest.fn();
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const fakeItems = [
  {
    id: 1,
    nome: 'Clínica Sunrise',
    cnpj: '12345678000190',
    email: 'contato@sunrise.com',
    telefone: '11999990000',
    status: 'aguardando_aceite_contrato',
    criado_em: '2026-01-15T10:00:00.000Z',
    tipo: 'clinica',
    contrato_id: 42,
    contrato_criado_em: '2026-01-15T10:05:00.000Z',
    responsavel_nome: 'Dr. Paulo',
    responsavel_cargo: 'Diretor',
    responsavel_celular: '11988880000',
  },
  {
    id: 2,
    nome: 'Empresa Gamma',
    cnpj: '98765432000199',
    email: 'rh@gamma.com',
    telefone: null,
    status: 'pendente',
    criado_em: '2026-01-16T09:00:00.000Z',
    tipo: 'entidade',
    contrato_id: 43,
    contrato_criado_em: '2026-01-16T09:05:00.000Z',
    responsavel_nome: 'Ana Costa',
    responsavel_cargo: 'RH',
    responsavel_celular: null,
  },
];

function mockFetchSuccess(items = fakeItems) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () =>
      Promise.resolve({
        success: true,
        total: items.length,
        pre_cadastros: items,
      }),
  } as Response);
}

function mockFetchEmpty() {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () =>
      Promise.resolve({ success: true, total: 0, pre_cadastros: [] }),
  } as Response);
}

function mockFetchError(status = 500, message = 'Erro interno') {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ error: message }),
  } as Response);
}

// ──────────────────────────────────────────────
// Testes
// ──────────────────────────────────────────────
describe('PreCadastroContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);
  });

  // ────────────────────────────────────────────
  // Renderização com dados
  // ────────────────────────────────────────────
  describe('renderização com dados', () => {
    it('deve exibir nomes e CNPJ dos pré-cadastros', async () => {
      // Arrange
      mockFetchSuccess();

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Clínica Sunrise')).toBeInTheDocument();
        expect(screen.getByText('Empresa Gamma')).toBeInTheDocument();
      });
    });

    it('deve exibir o contador de resultados', async () => {
      // Arrange
      mockFetchSuccess();

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/2 pré-cadastros encontrados/i)).toBeInTheDocument();
      });
    });

    it('deve mostrar badge de status correto para aguardando_aceite_contrato', async () => {
      // Arrange
      mockFetchSuccess([fakeItems[0]]);

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });

      // Assert
      await waitFor(() => {
        const badges = screen.getAllByText('Aguardando aceite');
        expect(badges.length).toBeGreaterThan(0);
      });
    });

    it('deve exibir single result com texto no singular', async () => {
      // Arrange
      mockFetchSuccess([fakeItems[0]]);

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText(/1 pré-cadastro encontrado$/i)).toBeInTheDocument();
      });
    });
  });

  // ────────────────────────────────────────────
  // Estado vazio
  // ────────────────────────────────────────────
  describe('estado vazio', () => {
    it('deve exibir mensagem quando não há pendentes', async () => {
      // Arrange
      mockFetchEmpty();

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });

      // Assert
      await waitFor(() => {
        expect(
          screen.getByTestId('empty-state')
        ).toBeInTheDocument();
        expect(
          screen.getByText('Nenhum pré-cadastro pendente de aceite')
        ).toBeInTheDocument();
      });
    });
  });

  // ────────────────────────────────────────────
  // Estado de loading
  // ────────────────────────────────────────────
  describe('estado de loading', () => {
    it('deve exibir indicador de carregamento durante fetch', async () => {
      // Arrange — fetch que nunca resolve
      mockFetch.mockReturnValueOnce(new Promise(() => {}));

      // Act
      render(<PreCadastroContent />);

      // Assert
      expect(screen.getByText(/Carregando pré-cadastros/i)).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────────
  // Estado de erro
  // ────────────────────────────────────────────
  describe('estado de erro', () => {
    it('deve exibir mensagem de erro quando fetch retorna não-ok', async () => {
      // Arrange
      mockFetchError(500, 'Erro interno ao listar pré-cadastros');

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });

      // Assert
      await waitFor(() => {
        expect(
          screen.getByText('Erro interno ao listar pré-cadastros')
        ).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem de erro quando fetch lança exceção', async () => {
      // Arrange
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  // ────────────────────────────────────────────
  // Filtros
  // ────────────────────────────────────────────
  describe('filtros de tipo', () => {
    it('deve chamar API sem filtro por padrão', async () => {
      // Arrange
      mockFetchSuccess();

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/suporte/pre-cadastro');
      });
    });

    it('deve chamar API com tipo=clinica quando filtro Clínicas selecionado', async () => {
      // Arrange — primeiro fetch (inicial) + segundo fetch (ao clicar filtro)
      mockFetchSuccess();
      mockFetchSuccess([fakeItems[0]]);

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });
      await waitFor(() =>
        expect(screen.getByText('Clínica Sunrise')).toBeInTheDocument()
      );

      // Clicar filtro Clínicas
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Clínicas/i }));
      });

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/suporte/pre-cadastro?tipo=clinica'
        );
      });
    });

    it('deve chamar API com tipo=entidade quando filtro Entidades selecionado', async () => {
      // Arrange
      mockFetchSuccess();
      mockFetchSuccess([fakeItems[1]]);

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });
      await waitFor(() =>
        expect(screen.getByText('Clínica Sunrise')).toBeInTheDocument()
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Entidades/i }));
      });

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/suporte/pre-cadastro?tipo=entidade'
        );
      });
    });
  });

  // ────────────────────────────────────────────
  // Botão copiar link
  // ────────────────────────────────────────────
  describe('botão Gerar Link', () => {
    it('deve copiar a URL correta para o clipboard ao clicar em Gerar Link', async () => {
      // Arrange
      mockFetchSuccess([fakeItems[0]]);

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });
      await waitFor(() =>
        expect(screen.getByText('Clínica Sunrise')).toBeInTheDocument()
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Copiar link de aceite/i }));
      });

      // Assert — URL deve conter tomador id e contrato_id
      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(
          expect.stringContaining('/sucesso-cadastro?id=1&contrato_id=42')
        );
      });
    });

    it('deve mostrar "Copiado!" e depois voltar a "Gerar Link"', async () => {
      // Arrange
      mockFetchSuccess([fakeItems[0]]);
      jest.useFakeTimers();

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });
      await waitFor(() =>
        expect(screen.getByText('Clínica Sunrise')).toBeInTheDocument()
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Copiar link de aceite/i }));
      });

      // Assert — feedback imediato
      await waitFor(() => {
        expect(screen.getByText('Copiado!')).toBeInTheDocument();
      });

      // Avançar timer (2500ms)
      await act(async () => {
        jest.advanceTimersByTime(2600);
      });

      await waitFor(() => {
        expect(screen.queryByText('Copiado!')).not.toBeInTheDocument();
        expect(screen.getByText('Gerar Link')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  // ────────────────────────────────────────────
  // Botão refresh
  // ────────────────────────────────────────────
  describe('botão refresh', () => {
    it('deve recarregar a lista ao clicar no botão de atualizar', async () => {
      // Arrange
      mockFetchSuccess();
      mockFetchEmpty();

      // Act
      await act(async () => {
        render(<PreCadastroContent />);
      });
      await waitFor(() =>
        expect(screen.getByText('Clínica Sunrise')).toBeInTheDocument()
      );

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Atualizar lista/i }));
      });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
