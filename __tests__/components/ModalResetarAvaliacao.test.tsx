import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModalResetarAvaliacao from '@/components/ModalResetarAvaliacao';

describe('ModalResetarAvaliacao', () => {
  beforeEach(() => jest.clearAllMocks());

  it('abertura e submissão com motivo obrigatório', async () => {
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    // @ts-expect-error Mocking fetch for testing purposes
    global.fetch = mockFetch;

    const onClose = jest.fn();
    const onSuccess = jest.fn();

    render(
      <ModalResetarAvaliacao
        avaliacaoId={1}
        loteId={'1'}
        funcionarioNome={'João'}
        funcionarioCpf={'12345678901'}
        basePath={'/api/entidade'}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    // Deve mostrar aviso
    expect(screen.getByText(/Atenção:/)).toBeInTheDocument();

    const motivoTextarea = screen.getByLabelText(/Motivo do reset/);

    fireEvent.change(motivoTextarea, { target: { value: 'Motivo válido' } });

    const submitButton = screen.getByRole('button', {
      name: /Resetar Avaliação/,
    });

    fireEvent.click(submitButton);

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });
});
