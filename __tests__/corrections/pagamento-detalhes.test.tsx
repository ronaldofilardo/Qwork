import React from 'react';
import { render, screen } from '@testing-library/react';
import PagamentoPage from '@/app/pagamento/[contratoId]/page';

// Mock do useRouter
const mockPush = jest.fn();
const mockParams = { contratoId: '123' };

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => mockParams,
}));

// Mock do QworkLogo
jest.mock('@/components/QworkLogo', () => {
  return function MockQworkLogo() {
    return <div data-testid="qwork-logo">QWork Logo</div>;
  };
});

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('PagamentoPage - Detalhes sem texto redundante', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockPush.mockClear();

    // Mock da API de contrato
    mockFetch.mockImplementation((url) => {
      if (url === '/api/contratos/123') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              contrato: {
                contratante_id: 456,
                plano_id: 1,
                numero_funcionarios_estimado: 50,
              },
            }),
        });
      }

      // Mock da API de iniciar pagamento
      if (url === '/api/pagamento/iniciar') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              pagamento_id: 789,
              valor: 5000,
              valor_plano: 100,
              numero_funcionarios: 50,
              plano_nome: 'Plano Básico',
              contratante_nome: 'Empresa Teste',
              status: 'pendente',
            }),
        });
      }

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  it('deve mostrar detalhes do plano corretamente', async () => {
    render(<PagamentoPage />);

    // Aguardar carregamento
    await screen.findByText('Finalizar Pagamento');

    // Verificar informações principais
    expect(screen.getByText('Contratante:')).toBeInTheDocument();
    expect(screen.getByText('Empresa Teste')).toBeInTheDocument();

    expect(screen.getByText('Plano:')).toBeInTheDocument();
    expect(screen.getByText('Plano Básico')).toBeInTheDocument();

    expect(screen.getByText('Valor do Plano:')).toBeInTheDocument();
    expect(screen.getByText('R$ 100,00')).toBeInTheDocument();

    expect(screen.getByText('Número de Funcionários:')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument();
  });

  it('deve mostrar opções de parcela sem texto redundante', async () => {
    render(<PagamentoPage />);

    // Aguardar carregamento
    await screen.findByText('Finalizar Pagamento');

    // Selecionar cartão para ver opções de parcela
    const cartaoOption = screen.getByLabelText('Cartão de Crédito');
    cartaoOption.click();

    // Verificar se mostra seletor de parcelas
    await screen.findByText('Número de Parcelas');

    // Verificar formato das opções (sem "total:" redundante)
    const parcela2x = screen.getByDisplayValue('2');
    expect(parcela2x).toBeInTheDocument();

    // Verificar que não contém texto redundante
    expect(screen.queryByText(/total:/i)).not.toBeInTheDocument();

    // Verificar formato correto: "2x de R$ 2.500,00"
    expect(screen.getByText('2x de R$ 2.500,00')).toBeInTheDocument();
  });

  it('deve calcular parcelas corretamente', async () => {
    render(<PagamentoPage />);

    // Aguardar carregamento
    await screen.findByText('Finalizar Pagamento');

    // Selecionar cartão
    const cartaoOption = screen.getByLabelText('Cartão de Crédito');
    cartaoOption.click();

    await screen.findByText('Número de Parcelas');

    // Verificar cálculos
    expect(screen.getByText('À vista - R$ 5.000,00')).toBeInTheDocument();
    expect(screen.getByText('2x de R$ 2.500,00')).toBeInTheDocument();
    expect(screen.getByText('3x de R$ 1.666,67')).toBeInTheDocument();
    expect(screen.getByText('4x de R$ 1.250,00')).toBeInTheDocument();
  });
});
