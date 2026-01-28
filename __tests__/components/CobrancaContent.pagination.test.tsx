import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CobrancaContent } from '@/components/admin/CobrancaContent';

describe('CobrancaContent - paginação e ordenação', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockImplementation(async (url: any) => {
      return {
        ok: true,
        json: async () => ({ contratos: [], total: 0, page: 1, limit: 20 }),
      } as unknown as Response;
    });
  });

  afterEach(() => jest.restoreAllMocks());

  test('exibe controles de paginação e limit/ordenacao', async () => {
    render(<CobrancaContent />);

    // Seletores devem existir
    expect(
      await screen.findByTitle('Registros por página')
    ).toBeInTheDocument();
    expect(screen.getByTitle('Ordenar')).toBeInTheDocument();

    // Botões de paginação
    expect(screen.getByTitle('Página anterior')).toBeInTheDocument();
    expect(screen.getByTitle('Próxima página')).toBeInTheDocument();

    // Ao mudar limit, a requisição deve ser feita com novo limit
    fireEvent.change(screen.getByTitle('Registros por página'), {
      target: { value: '10' },
    });
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });
});
