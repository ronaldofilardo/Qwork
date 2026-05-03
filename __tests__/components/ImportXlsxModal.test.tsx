import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ImportXlsxModal from '@/components/funcionarios/ImportXlsxModal';

describe('ImportXlsxModal', () => {
  it('renders instructions and allows importing a valid .xlsx file', async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    // Mock fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, created: 2 }),
      } as any)
    );

    render(
      <ImportXlsxModal
        show={true}
        onClose={onClose}
        onSuccess={onSuccess}
        contexto="entidade"
      />
    );

    expect(screen.getByText(/Importar Funcionários/i)).toBeInTheDocument();
    expect(screen.getByText(/Data de Nascimento/i)).toBeInTheDocument();

    // Create fake file
    const file = new File(['dummy'], 'teste.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const input = screen.getByLabelText(/Arquivo/i);
    // fireEvent.change doesn't set files on jsdom reliably; use Object.defineProperty
    Object.defineProperty(input, 'files', { value: [file] });
    fireEvent.change(input);

    const importBtn = screen.getByText('Importar');
    fireEvent.click(importBtn);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(2));
  });
});
