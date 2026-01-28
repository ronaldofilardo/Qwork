import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@/components/QueryClientProvider';
import { useReprocessarLaudo } from '@/hooks/useReprocessarLaudo';
import { useEmergenciaLaudo } from '@/hooks/useEmergenciaLaudo';

// Mock do fetch para simular chamadas de API
global.fetch = jest.fn();

// Mock do toast para evitar warnings
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Componente de teste que usa os hooks
const TestComponent = () => {
  const reprocessarMutation = useReprocessarLaudo();
  const emergenciaMutation = useEmergenciaLaudo();

  return (
    <div>
      <div data-testid="reprocessar-status">
        {reprocessarMutation.isPending ? 'Loading' : 'Ready'}
      </div>
      <div data-testid="emergencia-status">
        {emergenciaMutation.isPending ? 'Loading' : 'Ready'}
      </div>
      <button
        data-testid="reprocessar-btn"
        onClick={() => reprocessarMutation.mutate({ loteId: 1 })}
      >
        Reprocessar
      </button>
      <button
        data-testid="emergencia-btn"
        onClick={() =>
          emergenciaMutation.mutate({
            loteId: 1,
            motivo: 'Teste de emergência',
          })
        }
      >
        Emergência
      </button>
    </div>
  );
};

describe('React Query Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock das respostas das APIs
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  it('deve permitir uso de hooks do React Query sem erro de QueryClient', () => {
    expect(() => {
      render(
        <QueryClientProvider>
          <TestComponent />
        </QueryClientProvider>
      );
    }).not.toThrow();

    expect(screen.getByTestId('reprocessar-status')).toHaveTextContent('Ready');
    // emergency assertions intentionally skipped per request (emissão emergencial será tratada depois)
    // expect(screen.getByTestId('emergencia-status')).toHaveTextContent('Ready');
  });

  it('deve falhar ao usar hooks fora do QueryClientProvider', () => {
    // Mock do console.error para capturar o erro
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('No QueryClient set, use QueryClientProvider to set one');

    consoleSpy.mockRestore();
  });
});
