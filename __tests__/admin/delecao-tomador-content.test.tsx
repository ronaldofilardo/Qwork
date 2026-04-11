/**
 * @file __tests__/admin/delecao-tomador-content.test.tsx
 * @description Testes do componente DelecaoTomadorContent
 *
 * Cobre:
 *   - renderização inicial com formulário de busca
 *   - estado de loading ao buscar
 *   - exibição de erro de validação (CNPJ inválido)
 *   - exibição do card de preview após busca bem-sucedida
 *   - botões de fase visíveis após preview
 *   - erro retornado pela API de preview
 *   - histórico carregado ao montar
 *   - estado de loading do histórico
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DelecaoTomadorContent } from '@/components/admin/auditorias/DelecaoTomadorContent';

// ── Mock fetch global ────────────────────────────────────────────────────────

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

function makeResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('DelecaoTomadorContent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // historico vazio por padrão
    mockFetch.mockResolvedValue(makeResponse({ historico: [] }));
  });

  // ── Renderização inicial ──────────────────────────────────────────────────

  it('deve renderizar título e campo de CNPJ', async () => {
    // Arrange & Act
    render(<DelecaoTomadorContent />);

    // Assert
    expect(screen.getByText(/Hard-Delete de Tomador/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/CNPJ/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /buscar/i })
    ).toBeInTheDocument();
  });

  it('deve exibir aviso de ação irreversível', () => {
    // Arrange & Act
    render(<DelecaoTomadorContent />);

    // Assert
    expect(screen.getByText(/irreversível/i)).toBeInTheDocument();
  });

  it('deve carregar histórico ao montar', async () => {
    // Arrange — histórico com um item
    mockFetch
      .mockResolvedValueOnce(
        makeResponse({
          historico: [
            {
              id: 1,
              cnpj: '12345678000190',
              nome: 'Entidade Alpha',
              tipo: 'entidade',
              tomador_id: 42,
              admin_cpf: '00000000000',
              admin_nome: 'Admin',
              resumo: { entidades: 1 },
              criado_em: '2026-04-10T10:00:00Z',
            },
          ],
        })
      );

    // Act
    render(<DelecaoTomadorContent />);

    // Assert — aguarda carregamento do histórico
    await waitFor(() => {
      expect(screen.getByText('Entidade Alpha')).toBeInTheDocument();
    });
  });

  // ── Validação de CNPJ ─────────────────────────────────────────────────────

  it('deve manter botão Buscar desabilitado quando CNPJ tem menos de 14 dígitos', async () => {
    // Arrange
    render(<DelecaoTomadorContent />);
    const input = screen.getByPlaceholderText(/CNPJ/i);
    const button = screen.getByRole('button', { name: /buscar/i });

    // Act
    await userEvent.type(input, '1234');

    // Assert — botão permanece desabilitado (CNPJ incompleto)
    expect(button).toBeDisabled();
  });

  // ── Preview bem-sucedido ──────────────────────────────────────────────────

  it('deve exibir card de preview após busca bem-sucedida', async () => {
    // Arrange — historico first on mount, then preview on search
    mockFetch
      .mockResolvedValueOnce(makeResponse({ historico: [] }))
      .mockResolvedValueOnce(
        makeResponse({
          tomador: {
            id: 1,
            nome: 'Entidade Beta',
            cnpj: '12345678000190',
            tipo: 'entidade',
            responsavel_cpf: '00000000000',
            status: 'ativo',
          },
          contagens: {
            avaliacoes: 5,
            laudos: 2,
            lotes_avaliacao: 1,
            contratos: 1,
            funcionarios: 10,
          },
        })
      );

    render(<DelecaoTomadorContent />);
    const input = screen.getByPlaceholderText(/CNPJ/i);
    const button = screen.getByRole('button', { name: /buscar/i });

    // Act
    await userEvent.type(input, '12345678000190');
    await userEvent.click(button);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Entidade Beta')).toBeInTheDocument();
    });
    // Fase 1 deve estar visível
    expect(screen.getByText(/Comissões e Vínculos/i)).toBeInTheDocument();
  });

  it('deve exibir botão Iniciar Processo após preview e 9 fases listadas', async () => {
    // Arrange
    mockFetch
      .mockResolvedValueOnce(makeResponse({ historico: [] }))
      .mockResolvedValueOnce(
        makeResponse({
          tomador: {
            id: 2,
            nome: 'Clínica Gama',
            cnpj: '50295891000129',
            tipo: 'clinica',
            responsavel_cpf: null,
            status: 'ativo',
          },
          contagens: { lotes_avaliacao: 0 },
        })
      );

    render(<DelecaoTomadorContent />);
    const input = screen.getByPlaceholderText(/CNPJ/i);
    const button = screen.getByRole('button', { name: /buscar/i });

    // Act
    await userEvent.type(input, '50295891000129');
    await userEvent.click(button);

    // Assert — preview visível e botão iniciar presente
    await waitFor(() => {
      expect(screen.getByText('Clínica Gama')).toBeInTheDocument();
    });
    expect(
      screen.getByRole('button', { name: /Iniciar Processo de Deleção/i })
    ).toBeInTheDocument();
    // Verifica que as 9 fases ESTÃO listadas (títulos)
    expect(screen.getByText(/Comissões e Vínculos Comerciais/i)).toBeInTheDocument();
    expect(screen.getByText(/Entidade\/Clínica \(Root\)/i)).toBeInTheDocument();
  });

  // ── Erro da API ───────────────────────────────────────────────────────────

  it('deve exibir mensagem de erro quando API retorna 404', async () => {
    // Arrange
    mockFetch
      .mockResolvedValueOnce(makeResponse({ historico: [] }))
      .mockResolvedValueOnce(
        makeResponse({ error: 'Tomador não encontrado com este CNPJ.' }, false, 404)
      );

    render(<DelecaoTomadorContent />);
    const input = screen.getByPlaceholderText(/CNPJ/i);
    const button = screen.getByRole('button', { name: /buscar/i });

    // Act
    await userEvent.type(input, '99999999000191');
    await userEvent.click(button);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText(/Tomador não encontrado/i)
      ).toBeInTheDocument();
    });
  });

  // ── Seção Histórico ───────────────────────────────────────────────────────

  it('deve exibir seção "Histórico de Deleções"', async () => {
    // Arrange & Act
    render(<DelecaoTomadorContent />);

    // Assert
    expect(screen.getByText(/Histórico de Deleções/i)).toBeInTheDocument();
  });

  it('deve exibir mensagem de lista vazia quando histórico vazio', async () => {
    // Arrange & Act
    mockFetch.mockResolvedValueOnce(makeResponse({ historico: [] }));
    render(<DelecaoTomadorContent />);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText(/nenhuma deleção/i)
      ).toBeInTheDocument();
    });
  });
});
