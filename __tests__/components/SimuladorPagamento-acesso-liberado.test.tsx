import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SimuladorPagamentoPage from '@/app/pagamento/simulador/page';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock do Next.js navigation
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe.skip('SimuladorPagamentoPage - Acesso Liberado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockImplementation((key: string) => {
      console.log('mockGet called with key:', key);
      if (key === 'contratante_id') return '1';
      if (key === 'plano_id') return '1';
      if (key === 'numero_funcionarios') return '10';
      return null; // Sem token
    });
    // Mock fetch para interceptar todas as chamadas
    mockFetch.mockImplementation((url: string) => {
      console.log('Mock fetch called with URL:', url);
      if (url.includes('/api/pagamento/simulador')) {
        console.log('Returning simulador data');
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              contratante_id: 1,
              contratante_nome: 'Empresa Teste',
              plano_id: 1,
              plano_nome: 'Plano Básico',
              plano_tipo: 'fixo',
              numero_funcionarios: 10,
              valor_por_funcionario: 20,
              valor_total: 200,
            }),
        } as Response);
      }
      if (url.includes('/api/pagamento/processar')) {
        console.log('Mocking processar call');
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              acesso_liberado: true,
              recibo: null,
            }),
        } as Response);
      }
      // Para outras URLs, retorna uma resposta padrão
      console.log('Returning default response for URL:', url);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });
  });

  it('deve redirecionar para /sucesso-cadastro quando contrato retorna acesso_liberado: true', async () => {
    // Mock da resposta de criação de contrato com acesso liberado
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          contrato_id: null, // Contrato não criado devido à desabilitação
          acesso_liberado: true, // Pagamento confirmado automaticamente
          message:
            'Pagamento confirmado automaticamente e conta criada com sucesso.',
        }),
    } as Response);

    render(<SimuladorPagamentoPage />);

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('Confirmar Pagamento')).toBeInTheDocument();
    });

    // Clicar em confirmar pagamento
    const button = screen.getByText('Confirmar Pagamento');
    fireEvent.click(button);

    // Verificar se redirecionou para /sucesso-cadastro
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/sucesso-cadastro');
    });

    // Verificar que NÃO chamou /api/pagamento/processar
    expect(mockFetch).toHaveBeenCalledTimes(2); // Apenas simulador e contrato/criar
    expect(mockFetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/pagamento/processar'),
      expect.any(Object)
    );
  });

  it('deve chamar /api/pagamento/processar quando acesso_liberado é false', async () => {
    // Mock da resposta de criação de contrato SEM acesso liberado
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          contrato_id: 123,
          acesso_liberado: false, // Ainda precisa processar pagamento
        }),
    } as Response);

    // Mock da resposta de processamento de pagamento
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          recibo_id: 456,
        }),
    } as Response);

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('Confirmar Pagamento')).toBeInTheDocument();
    });

    // Clicar em confirmar pagamento
    const button = screen.getByText('Confirmar Pagamento');
    fireEvent.click(button);

    // Verificar se chamou /api/pagamento/processar
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/pagamento/processar',
        expect.any(Object)
      );
    });
  });
});
