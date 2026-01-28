import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PlanosContent } from '@/components/admin/PlanosContent';

describe('PlanosContent — exclusão com senha e motivo', () => {
  afterEach(() => jest.restoreAllMocks());

  it('abre modal, envia admin_password+motivo e recarrega lista após sucesso', async () => {
    const initial = {
      planos: [
        {
          id: 3,
          nome: 'Plano Z',
          tipo: 'personalizado',
          preco: 0,
          caracteristicas: [],
          ativo: true,
        },
      ],
    };
    const after = { planos: [] };

    const fetchMock = jest
      .spyOn(global, 'fetch')
      // primeiro GET (loadPlanos)
      .mockImplementationOnce(
        async () =>
          ({ ok: true, json: async () => initial }) as unknown as Response
      )
      // DELETE (confirmação) -> assert método + body
      .mockImplementationOnce(async (url: any, init: any) => {
        expect(String(url)).toContain('/api/admin/planos/3');
        expect(init?.method).toBe('DELETE');
        const body = JSON.parse(init.body);
        expect(body).toMatchObject({
          admin_password: 'right-pass',
          motivo: 'limpeza',
        });
        return {
          ok: true,
          json: async () => ({ success: true }),
        } as unknown as Response;
      })
      // GET após reload
      .mockImplementationOnce(
        async () =>
          ({ ok: true, json: async () => after }) as unknown as Response
      );

    render(<PlanosContent />);

    // espera lista carregada
    expect(await screen.findByText('Plano Z')).toBeInTheDocument();

    // clicar Excluir
    const btn = screen.getByRole('button', { name: /Excluir/i });
    fireEvent.click(btn);

    // modal aparece (procurar o heading para evitar colisão com o botão)
    expect(
      await screen.findByRole('heading', { name: /Confirmar exclusão/i })
    ).toBeInTheDocument();

    // preencher senha e motivo
    fireEvent.change(screen.getByLabelText('senha-admin'), {
      target: { value: 'right-pass' },
    });
    fireEvent.change(screen.getByLabelText('motivo-delete'), {
      target: { value: 'limpeza' },
    });

    // confirmar
    const confirmBtn = screen.getByRole('button', {
      name: /Confirmar exclusão/i,
    });
    fireEvent.click(confirmBtn);

    // aguardar recarregamento e ausência do plano
    await waitFor(() =>
      expect(screen.queryByText('Plano Z')).not.toBeInTheDocument()
    );

    expect(fetchMock).toHaveBeenCalled();
  });
});
