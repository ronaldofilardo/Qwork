import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalCadastroContratante from '@/components/modals/ModalCadastroContratante';

// Mock do fetch para planos
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ModalCadastroContratante - Campo Funcionários em Plano Personalizado', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockImplementation((url) => {
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
                {
                  id: 2,
                  nome: 'Plano Personalizado',
                  descricao: 'Valor sob consulta',
                  preco: null,
                  tipo: 'personalizado',
                  caracteristicas: {},
                },
              ],
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it.skip('deve mostrar campo de funcionários para plano personalizado', async () => {
    render(<ModalCadastroContratante isOpen={true} onClose={() => {}} />);

    // Avançar para etapa de plano
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Aguardar carregamento dos planos
    await waitFor(() => {
      expect(screen.getByText('Plano Básico')).toBeInTheDocument();
    });

    // Selecionar plano personalizado
    const planoPersonalizado = screen.getByText('Plano Personalizado');
    userEvent.click(planoPersonalizado);

    // Avançar para etapa de dados
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Verificar se campo de funcionários está presente
    const campoFuncionarios = screen.getByRole('spinbutton');
    expect(campoFuncionarios).toBeInTheDocument();

    // Verificar se o rótulo correto está presente
    expect(
      screen.getByText('Quantidade estimada de funcionários')
    ).toBeInTheDocument();

    // Verificar se pode inserir valor
    fireEvent.change(campoFuncionarios, { target: { value: '50' } });
    expect(campoFuncionarios).toHaveValue(50);
  });

  it.skip('deve permitir avanço com plano personalizado e funcionários informados', async () => {
    render(<ModalCadastroContratante isOpen={true} onClose={() => {}} />);

    // Avançar para etapa de plano
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    await waitFor(() => {
      expect(screen.getByText('Plano Personalizado')).toBeInTheDocument();
    });

    // Selecionar plano personalizado
    userEvent.click(screen.getByText('Plano Personalizado'));

    // Avançar para dados
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Preencher campo de funcionários
    const campoFuncionarios = screen.getByRole('spinbutton');
    fireEvent.change(campoFuncionarios, { target: { value: '25' } });

    // Avançar para responsável
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Verificar se avançou (não deve mostrar erro)
    await waitFor(() => {
      expect(screen.getByText(/Dados do/)).toBeInTheDocument();
    });
  });

  it.skip('deve impedir avanço com plano personalizado sem funcionários', async () => {
    render(<ModalCadastroContratante isOpen={true} onClose={() => {}} />);

    // Avançar para etapa de plano
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    await waitFor(() => {
      expect(screen.getByText('Plano Personalizado')).toBeInTheDocument();
    });

    // Selecionar plano personalizado
    userEvent.click(screen.getByText('Plano Personalizado'));

    // Avançar para dados
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Deixar campo de funcionários vazio (valor 0)
    const campoFuncionarios = screen.getByRole('spinbutton');
    fireEvent.change(campoFuncionarios, { target: { value: '0' } });

    // Tentar avançar para responsável
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Verificar se mostra erro
    await waitFor(() => {
      expect(
        screen.getByText(
          'Informe o número estimado de funcionários (mínimo: 1)'
        )
      ).toBeInTheDocument();
    });
  });
});
