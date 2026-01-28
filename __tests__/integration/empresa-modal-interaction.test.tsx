import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RhPage from '@/app/rh/page';

describe('Integração: Modal Nova Empresa (interação real)', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn((url) => {
      if (url === '/api/rh/empresas') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url === '/api/rh/dashboard') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              total_empresas: 0,
              total_funcionarios: 0,
              total_avaliacoes: 0,
              avaliacoes_concluidas: 0,
            }),
        });
      }

      return Promise.reject(new Error('URL não mockada: ' + url));
    }) as jest.Mock;
  });

  it('abre modal a partir da página e permite digitar dados do representante', async () => {
    render(<RhPage />);

    // Aguarda carregamento inicial
    await waitFor(() =>
      expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument()
    );

    // Abrir modal
    const botaoNovaEmpresa = screen.getByRole('button', {
      name: /nova empresa/i,
    });
    fireEvent.click(botaoNovaEmpresa);

    // Campos do representante devem estar visíveis e editáveis
    const representanteNome = await screen.findByPlaceholderText(
      'Ex: João Silva Santos'
    );
    fireEvent.change(representanteNome, { target: { value: 'Lucia Pereira' } });
    expect(representanteNome).toHaveValue('Lucia Pereira');

    const representanteFone =
      screen.getAllByPlaceholderText('(00) 00000-0000')[1];
    fireEvent.change(representanteFone, { target: { value: '11988887777' } });
    expect(representanteFone).toHaveValue('(11) 98888-7777');
  });
});
