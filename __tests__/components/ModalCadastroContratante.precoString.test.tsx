import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalCadastroContratante from '@/components/modals/ModalCadastroContratante';

describe('ModalCadastroContratante - preços como string', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url === '/api/planos') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              planos: [
                {
                  id: 1,
                  nome: 'Plano Fixo Teste',
                  descricao: 'Plano fixo',
                  preco: '24.00', // string coming from DB numeric
                  tipo: 'fixo',
                  caracteristicas: { limite_funcionarios: 50, parcelas_max: 4 },
                },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as jest.Mock;
  });

  it('mostra preço formatado e permite inserir número de funcionários e calcula total anual', async () => {
    render(<ModalCadastroContratante isOpen={true} onClose={() => {}} />);

    // Avançar para seleção de plano
    userEvent.click(await screen.findByRole('button', { name: /Próximo/i }));

    // Selecionar plano
    expect(
      await screen.findByText('Plano Fixo Teste', {}, { timeout: 15000 })
    ).toBeInTheDocument();
    userEvent.click(screen.getByText('Plano Fixo Teste'));

    // Expect preço formatado
    const priceElements = screen.getAllByText(/R\$/i);
    expect(priceElements.length).toBeGreaterThan(0);
    expect(screen.queryByText(/Sob consulta/i)).not.toBeInTheDocument();

    // Campo númerico aparece
    const spin = await screen.findByRole('spinbutton');
    expect(spin).toBeInTheDocument();

    // Alterar para 2 (usar fireEvent change em input number)
    fireEvent.change(spin, { target: { value: '2' } });

    // Total anual atualizado
    expect(await screen.findByText(/Total anual:/i)).toBeInTheDocument();
    // procurar apenas a parte do valor para evitar problemas de NBSP
    expect(screen.getByText(/48,00/)).toBeInTheDocument();
  });
});
