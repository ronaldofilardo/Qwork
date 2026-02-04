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
  it('mostra botão Ver Detalhes e navega ao clicar', async () => {
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
                  total_funcionarios: 1,
                  funcionarios_concluidos: 0,
                  data_criacao: new Date().toISOString(),
                },
              ],
            }),
        });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<EntidadeLotesPage />);

    await waitFor(() =>
      expect(screen.getByText('Ciclos de Coletas Avaliativas')).toBeInTheDocument()
    );

    // Botão Ver Detalhes deve existir
    const verBtn = screen.getByRole('button', { name: /Ver Detalhes/i });
    expect(verBtn).toBeInTheDocument();

    // Clicar deve navegar para detalhe
    fireEvent.click(verBtn);
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
                  total_funcionarios: 1,
                  funcionarios_concluidos: 0,
                  data_criacao: new Date().toISOString(),
                },
              ],
            }),
        });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<EntidadeLotesPage />);

    await waitFor(() =>
      expect(screen.getByText('Ciclos de Coletas Avaliativas')).toBeInTheDocument()
    );

    // Clicar no título não deve revelar seção de funcionários
    fireEvent.click(screen.getByText('Lote Sem Expansao'));

    // Verifica que não há seção de Funcionários presente na página
    expect(screen.queryByText(/Funcionários \(/)).not.toBeInTheDocument();
  });
});

