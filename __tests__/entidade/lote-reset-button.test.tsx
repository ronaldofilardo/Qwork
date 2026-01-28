// @ts-nocheck
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DetalhesLotePage from '@/app/entidade/lote/[id]/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: () => ({ id: '1' }),
}));

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('DetalhesLote - botão Reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe botão Reset para avaliação concluída quando lote ativo', async () => {
    mockFetch.mockImplementation((url: any) => {
      if (url === '/api/entidade/lote/1') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            lote: { id: 1, codigo: 'LOT', status: 'ativo' },
            estatisticas: {
              total_funcionarios: 1,
              funcionarios_concluidos: 1,
              funcionarios_pendentes: 0,
            },
            funcionarios: [
              {
                cpf: '123',
                nome: 'João',
                nivel_cargo: 'gestao',
                avaliacao: {
                  id: 10,
                  status: 'concluida',
                  data_inicio: '2026-01-01',
                },
                grupos: {},
              },
            ],
          }),
        });
      }

      return Promise.resolve({
        ok: false,
        json: async () => ({ error: 'not found' }),
      });
    });

    render(<DetalhesLotePage />);

    // Aguarda os dados carregarem e o botão aparecer
    expect(await screen.findByText('↻ Reset')).toBeInTheDocument();

    fireEvent.click(screen.getByText('↻ Reset'));

    // Modal deve abrir
    expect(await screen.findByText(/Motivo do reset/)).toBeInTheDocument();
  });
});
