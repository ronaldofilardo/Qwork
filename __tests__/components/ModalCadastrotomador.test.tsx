import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalCadastrotomador from '@/components/modals/ModalCadastrotomador';

describe('ModalCadastrotomador - validações de planos', () => {
  beforeEach(() => {
    // Mockar fetch de planos
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
                  nome: 'Plano Básico',
                  descricao: 'Plano fixo anual por funcionário',
                  preco: 100,
                  tipo: 'fixo',
                  caracteristicas: {
                    limite_funcionarios: 100,
                    parcelas_max: 4,
                  },
                },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as jest.Mock;
  });

  it('exibe aviso inline e impede avanço quando número de funcionários excede limite', async () => {
    const onClose = jest.fn();
    render(<ModalCadastrotomador isOpen={true} onClose={onClose} />);

    // Avançar da etapa 'Tipo' para a etapa 'Plano'
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Esperar pelo nome do plano
    expect(await screen.findByText('Plano Básico')).toBeInTheDocument();

    // Selecionar o plano
    userEvent.click(screen.getByText('Plano Básico'));

    // Encontrar o campo númerico (spinbutton)
    const spin = await screen.findByRole('spinbutton');
    expect(spin).toBeInTheDocument();

    // Mudar para 101, excedendo o limite de 100
    fireEvent.change(spin, { target: { value: '101' } });

    // Aviso inline abaixo do campo
    expect(
      await screen.findByText(
        /O número de funcionários excede o limite do plano \(máx: 100\)\./
      )
    ).toBeInTheDocument();

    // Clicar em Próximo deve mostrar o erro global (topo)
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    expect(
      await screen.findByText(
        /O número de funcionários excede o limite do plano \(máx: 100\)\./
      )
    ).toBeInTheDocument();
  });
});
