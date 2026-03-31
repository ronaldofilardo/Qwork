/**
 * @fileoverview Testes do ModalTermosRepresentante — fluxo de primeiro acesso
 *
 * Cobre:
 *   - Renderização do modal principal (2 documentos, botão desabilitado)
 *   - SubModal com zIndex 9999 (correção do bug z-60 inválido no Tailwind)
 *   - Abertura e fechamento do SubModal por documento
 *   - Chamada à API POST /api/representante/aceitar-termos com tipo correto
 *   - aceite de termos_unificados chama a API para politica_privacidade E termos_uso
 *   - Exibição de erro quando API falha
 *   - Marcação do documento como aceito após sucesso
 */

jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});

jest.mock('@/components/terms/ContratoRepresentante', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="conteudo-contrato">Contrato de Representação</div>
  ),
}));
jest.mock('@/components/terms/TermosUnificados', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="conteudo-termos-unificados">
      Termos de Uso e Política de Privacidade
    </div>
  ),
}));

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import ModalTermosRepresentante from '@/components/modals/ModalTermosRepresentante';

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

describe('ModalTermosRepresentante — Primeiro Acesso', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('Renderização do Modal Principal', () => {
    it('deve exibir os 2 documentos para aceite', () => {
      render(<ModalTermosRepresentante onConcluir={() => {}} />);

      expect(
        screen.getByText(/Contrato de Representação Comercial/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Termos de Uso e Política de Privacidade/i)
      ).toBeInTheDocument();
    });

    it('deve exibir o botão final desabilitado antes de todos os aceites', () => {
      render(<ModalTermosRepresentante onConcluir={() => {}} />);
      expect(
        screen.getByRole('button', { name: /aceite todos os documentos/i })
      ).toBeDisabled();
    });

    it('deve exibir título de boas-vindas', () => {
      render(<ModalTermosRepresentante onConcluir={() => {}} />);
      expect(
        screen.getByText(/Bem-vindo\(a\) ao Portal QWork/i)
      ).toBeInTheDocument();
    });

    it('deve ter role="dialog" e aria-modal="true"', () => {
      render(<ModalTermosRepresentante onConcluir={() => {}} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('deve exibir 2 botões de leitura (um por documento)', () => {
      render(<ModalTermosRepresentante onConcluir={() => {}} />);
      expect(screen.getAllByLabelText(/Ler e aceitar:/i)).toHaveLength(2);
    });
  });

  describe('SubModal — zIndex 9999 (fix: z-60 era inválido no Tailwind)', () => {
    it('deve abrir SubModal ao clicar em Termos de Uso e Política de Privacidade', async () => {
      render(<ModalTermosRepresentante onConcluir={() => {}} />);
      fireEvent.click(
        screen.getByLabelText(
          /Ler e aceitar: Termos de Uso e Política de Privacidade/i
        )
      );
      await waitFor(() => {
        expect(
          screen.getByTestId('conteudo-termos-unificados')
        ).toBeInTheDocument();
      });
    });

    it('deve abrir SubModal ao clicar em Contrato de Representação Comercial', async () => {
      render(<ModalTermosRepresentante onConcluir={() => {}} />);
      fireEvent.click(
        screen.getByLabelText(
          /Ler e aceitar: Contrato de Representação Comercial/i
        )
      );
      await waitFor(() => {
        expect(screen.getByTestId('conteudo-contrato')).toBeInTheDocument();
      });
    });

    it('SubModal deve ter zIndex 9999 (maior que z-50 do modal principal)', async () => {
      render(<ModalTermosRepresentante onConcluir={() => {}} />);
      fireEvent.click(
        screen.getByLabelText(
          /Ler e aceitar: Termos de Uso e Política de Privacidade/i
        )
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('conteudo-termos-unificados')
        ).toBeInTheDocument();
      });

      const styleContainers = document.querySelectorAll('[style*="z-index"]');
      const submodal = Array.from(styleContainers).find(
        (el) => (el as HTMLElement).style.zIndex === '9999'
      );
      expect(submodal).toBeTruthy();
      expect(Number((submodal as HTMLElement).style.zIndex)).toBeGreaterThan(
        50
      );
    });

    it('deve fechar SubModal ao clicar em Voltar', async () => {
      render(<ModalTermosRepresentante onConcluir={() => {}} />);
      fireEvent.click(
        screen.getByLabelText(
          /Ler e aceitar: Termos de Uso e Política de Privacidade/i
        )
      );
      await waitFor(() =>
        expect(
          screen.getByTestId('conteudo-termos-unificados')
        ).toBeInTheDocument()
      );

      fireEvent.click(screen.getByRole('button', { name: /voltar/i }));
      await waitFor(() => {
        expect(
          screen.queryByTestId('conteudo-termos-unificados')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Fluxo de Aceite', () => {
    it('deve chamar API duas vezes ao aceitar Termos de Uso e Política de Privacidade (unificado)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response);

      render(<ModalTermosRepresentante onConcluir={() => {}} />);
      fireEvent.click(
        screen.getByLabelText(
          /Ler e aceitar: Termos de Uso e Política de Privacidade/i
        )
      );
      await waitFor(() =>
        expect(
          screen.getByTestId('conteudo-termos-unificados')
        ).toBeInTheDocument()
      );

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: /aceitar Termos de Uso e Política de Privacidade/i,
          })
        );
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/representante/aceitar-termos',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ tipo: 'politica_privacidade' }),
          })
        );
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/representante/aceitar-termos',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ tipo: 'termos_uso' }),
          })
        );
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('deve marcar documento como aceito e fechar SubModal após API sucesso', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as Response);

      render(<ModalTermosRepresentante onConcluir={() => {}} />);
      fireEvent.click(
        screen.getByLabelText(
          /Ler e aceitar: Termos de Uso e Política de Privacidade/i
        )
      );
      await waitFor(() =>
        expect(
          screen.getByTestId('conteudo-termos-unificados')
        ).toBeInTheDocument()
      );

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: /aceitar Termos de Uso e Política de Privacidade/i,
          })
        );
      });

      await waitFor(() => {
        expect(
          screen.queryByTestId('conteudo-termos-unificados')
        ).not.toBeInTheDocument();
        expect(screen.getByText(/aceito ✓/i)).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem de erro se API retornar falha', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Sessão expirada' }),
      } as Response);

      render(<ModalTermosRepresentante onConcluir={() => {}} />);
      fireEvent.click(
        screen.getByLabelText(
          /Ler e aceitar: Termos de Uso e Política de Privacidade/i
        )
      );
      await waitFor(() =>
        expect(
          screen.getByTestId('conteudo-termos-unificados')
        ).toBeInTheDocument()
      );

      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', {
            name: /aceitar Termos de Uso e Política de Privacidade/i,
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/sessão expirada/i)).toBeInTheDocument();
      });
    });
  });
});
