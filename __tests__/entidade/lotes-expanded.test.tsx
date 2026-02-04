import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EntidadeLotesPage from '@/app/entidade/lotes/page';

// Mock Next router
const mockRouter = { push: jest.fn(), query: {} };
jest.mock('next/navigation', () => ({ useRouter: () => mockRouter }));

// Reset global fetch between tests
beforeEach(() => {
  jest.clearAllMocks();
});

describe('Entidade Lotes - cards compactos', () => {
  it('mostra card clicável e navega ao clicar', async () => {
    (global as any).fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/entidade/lotes')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              lotes: [
                {
                  id: 1,
                  titulo: 'Lote Teste Card',
                  tipo: 'avaliacao_psicossocial',
                  status: 'ativo',
                  liberado_em: new Date().toISOString(),
                  liberado_por_nome: 'João Silva',
                  total_avaliacoes: 1,
                  avaliacoes_concluidas: 0,
                  avaliacoes_inativadas: 0,
                  pode_emitir_laudo: false,
                  motivos_bloqueio: [],
                  taxa_conclusao: 0,
                },
              ],
            }),
        });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<EntidadeLotesPage />);

    await waitFor(() =>
      expect(
        screen.getByText('Ciclos de Coletas Avaliativas')
      ).toBeInTheDocument()
    );

    // Card deve ser clicável (LotesGrid usa aria-label)
    const card = screen.getByLabelText('Ver detalhes do lote 1');
    expect(card).toBeInTheDocument();

    // Clicar deve navegar para detalhe
    fireEvent.click(card);
    expect(mockRouter.push).toHaveBeenCalledWith('/entidade/lote/1');
  });

  it('não existe funcionalidade de expansão na lista e não carrega funcionários inline', async () => {
    (global as any).fetch = jest.fn().mockImplementation((url: string) => {
      if (url.includes('/api/entidade/lotes')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              lotes: [
                {
                  id: 2,
                  titulo: 'Lote Sem Expansao',
                  tipo: 'avaliacao_psicossocial',
                  status: 'ativo',
                  liberado_em: new Date().toISOString(),
                  liberado_por_nome: 'João Silva',
                  total_avaliacoes: 1,
                  avaliacoes_concluidas: 0,
                  avaliacoes_inativadas: 0,
                  pode_emitir_laudo: false,
                  motivos_bloqueio: [],
                  taxa_conclusao: 0,
                },
              ],
            }),
        });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<EntidadeLotesPage />);

    await waitFor(() =>
      expect(
        screen.getByText('Ciclos de Coletas Avaliativas')
      ).toBeInTheDocument()
    );

    // Clicar no card não deve revelar seção de funcionários (LotesGrid não tem expansão)
    const card = screen.getByLabelText('Ver detalhes do lote 2');
    fireEvent.click(card);

    // Verifica que não há seção de Funcionários presente na página (deve navegar)
    expect(screen.queryByText(/Funcionários \(/)).not.toBeInTheDocument();
    expect(mockRouter.push).toHaveBeenCalledWith('/entidade/lote/2');
  });
});
