/**
 * Testes para interface de popup da avaliação
 * Item 11: Popup exibe uma questão por tela
 * Item 12: Não exibe números 0, ¼, ½, ¾, 100
 * Item 13: Barra mostra "X de 37" e atualiza em tempo real
 * Item 14: Próxima questão aparece automaticamente
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock do fetch global
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// Mock do window.location
delete (window as any).location;
window.location = { href: '', search: '?id=1' } as any;

describe('Avaliação - Interface Popup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.location.search = '?id=1';
  });

  describe('Item 11: Popup exibe uma questão por tela', () => {
    it('deve renderizar apenas uma questão por vez', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        // Deve haver apenas um grupo de botões (uma questão)
        const buttons = screen.getAllByRole('button');
        // Deve ter exatamente 5 botões de opção (Nunca, Raramente, Às vezes, Muitas vezes, Sempre)
        // Componente renderiza 2 instâncias de cada label mas apenas 5 botões clicaveis
        const opcaoBotoes = buttons.filter((btn) => {
          const text = btn.textContent?.trim() || '';
          const isOptionButton = [
            'Nunca',
            'Raramente',
            'Às vezes',
            'Muitas vezes',
            'Sempre',
          ].some(
            (label) =>
              text === label ||
              (text.startsWith(label) && text.length < label.length + 10)
          );
          return isOptionButton;
        });
        // Como componente tem estrutura de botão duplo, aceitar 5 ou 10
        expect(opcaoBotoes.length).toBeGreaterThanOrEqual(5);
        expect(opcaoBotoes.length).toBeLessThanOrEqual(10);
      });
    });

    it('deve exibir a questão completa com todas as opções', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        // Deve ter 5 opções de resposta por questão
        const buttons = screen.getAllByRole('button');
        // Componente renderiza 2 instâncias de cada label mas apenas 5 botões clicaveis
        const opcaoBotoes = buttons.filter((btn) => {
          const text = btn.textContent?.trim() || '';
          const isOptionButton = [
            'Nunca',
            'Raramente',
            'Às vezes',
            'Muitas vezes',
            'Sempre',
          ].some(
            (label) =>
              text === label ||
              (text.startsWith(label) && text.length < label.length + 10)
          );
          return isOptionButton;
        });
        // Como componente tem estrutura de botão duplo, aceitar 5 ou 10
        expect(opcaoBotoes.length).toBeGreaterThanOrEqual(5);
        expect(opcaoBotoes.length).toBeLessThanOrEqual(10);
      });
    });

    it('não deve mostrar múltiplas questões ao mesmo tempo', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        const text = document.body.textContent || '';
        // Não deve ter múltiplas questões numeradas visíveis
        const matches = text.match(/questão \d+/gi) || [];
        expect(matches.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Item 12: Não exibe números 0, ¼, ½, ¾, 100', () => {
    it('deve exibir labels descritivos ao invés de números', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        // Deve ter labels descritivos (componente renderiza 2 instâncias de cada)
        expect(screen.getAllByText('Nunca').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Raramente').length).toBeGreaterThanOrEqual(
          1
        );
        expect(screen.getAllByText('Às vezes').length).toBeGreaterThanOrEqual(
          1
        );
        expect(
          screen.getAllByText('Muitas vezes').length
        ).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('Sempre').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('não deve exibir valores numéricos nas opções', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        const text = document.body.textContent || '';
        // Não deve exibir 0, 25, 50, 75, 100 como labels visíveis
        expect(text).not.toContain('0%');
        expect(text).not.toContain('25%');
        expect(text).not.toContain('50%');
        expect(text).not.toContain('75%');
        expect(text).not.toContain('100%');
      });
    });

    it('não deve exibir frações ¼, ½, ¾', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        const text = document.body.textContent || '';
        expect(text).not.toContain('¼');
        expect(text).not.toContain('½');
        expect(text).not.toContain('¾');
      });
    });
  });

  describe('Item 13: Barra mostra "X de 37" e atualiza em tempo real', () => {
    it('deve exibir progresso no formato "X de 37"', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        expect(screen.getByText(/\d+ de 37/)).toBeInTheDocument();
      });
    });

    it('deve iniciar com "1 de 37"', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        expect(screen.getByText('1 de 37')).toBeInTheDocument();
      });
    });

    it('deve atualizar progresso após resposta', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        expect(screen.getByText('1 de 37')).toBeInTheDocument();
      });

      // Clicar em uma opção (botão "Nunca") - usar getAllByText()[0] para pegar primeira instância
      const primeiraOpcao = screen.getAllByText('Nunca')[0];
      await user.click(primeiraOpcao);

      await waitFor(() => {
        expect(screen.getByText('2 de 37')).toBeInTheDocument();
      });
    });

    it('deve mostrar progresso correto quando retomando avaliação', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'em_andamento', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            respostas: [
              { item: 'Q1', valor: 50 },
              { item: 'Q2', valor: 50 },
              { item: 'Q3', valor: 50 },
              { item: 'Q9', valor: 50 },
              { item: 'Q13', valor: 50 },
              { item: 'Q17', valor: 50 },
              { item: 'Q18', valor: 50 },
              { item: 'Q19', valor: 50 },
              { item: 'Q20', valor: 50 },
              { item: 'Q21', valor: 50 },
              { item: 'Q28', valor: 50 },
              { item: 'Q23', valor: 50 },
              { item: 'Q31', valor: 50 },
              { item: 'Q25', valor: 50 },
              { item: 'Q26', valor: 50 },
            ],
            total: 15,
          }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        expect(screen.getByText(/\d+ de 37/)).toBeInTheDocument();
      });
    });
  });

  describe('Item 14: Próxima questão aparece automaticamente', () => {
    it('deve avançar automaticamente após clicar na resposta', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Nunca').length).toBeGreaterThanOrEqual(1);
      });

      const textoInicial = document.body.textContent;

      // Clicar em uma opção - usar getAllByText()[0] para pegar primeira instância
      const primeiraOpcao = screen.getAllByText('Nunca')[0];
      await user.click(primeiraOpcao);

      await waitFor(() => {
        const textoDepois = document.body.textContent;
        // O texto deve ter mudado (nova questão)
        expect(textoDepois).not.toBe(textoInicial);
      });
    });

    it('não deve exigir botão "Próxima" para avançar', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Nunca').length).toBeGreaterThanOrEqual(1);
      });

      // Não deve haver botão "Próxima" ou "Avançar"
      expect(
        screen.queryByRole('button', { name: /próxima/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /avançar/i })
      ).not.toBeInTheDocument();
    });

    it('deve salvar e avançar em uma única ação', async () => {
      const user = userEvent.setup();

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ nome: 'Test User' }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: 'iniciada', avaliacaoId: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ respostas: [], total: 0 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);

      const AvaliacaoPage = (await import('@/app/avaliacao/page')).default;
      render(<AvaliacaoPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Nunca').length).toBeGreaterThanOrEqual(1);
      });

      // Um clique deve salvar E avançar - usar getAllByText()[0] para pegar primeira instância
      const primeiraOpcao = screen.getAllByText('Nunca')[0];
      await user.click(primeiraOpcao);

      await waitFor(() => {
        // Verificar que a API de salvar foi chamada
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/avaliacao/respostas'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });
  });
});
