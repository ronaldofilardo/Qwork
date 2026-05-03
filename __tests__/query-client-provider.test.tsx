import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@/components/QueryClientProvider';
import { queryClient } from '@/lib/query-client';

describe('QueryClientProvider', () => {
  it('deve renderizar children corretamente', () => {
    const TestComponent = () => <div>Test Content</div>;

    render(
      <QueryClientProvider>
        <TestComponent />
      </QueryClientProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('deve configurar QueryClient com opções padrão', () => {
    // Verificar se o queryClient foi criado com as configurações esperadas
    expect(queryClient).toBeDefined();
    expect(queryClient.getDefaultOptions()).toEqual(
      expect.objectContaining({
        queries: expect.objectContaining({
          staleTime: 1000 * 60 * 5, // 5 minutes
          gcTime: 1000 * 60 * 10, // 10 minutes
        }),
        mutations: expect.objectContaining({
          retry: false,
        }),
      })
    );
  });
});
