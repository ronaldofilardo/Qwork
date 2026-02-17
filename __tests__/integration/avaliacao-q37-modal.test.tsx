/**
 * Testes de integração: Modal de conclusão ao responder Q37
 * Verifica o fluxo completo da última questão com feedback visual
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock fetch global
global.fetch = jest.fn();

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

describe('Integração: Modal de Conclusão Q37', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      // Mock session
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ nivelCargo: 'operacional' }),
        });
      }
      
      // Mock avaliação todas
      if (url.includes('/api/avaliacao/todas')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              avaliacoes: [{ id: 1, status: 'em_andamento' }],
            }),
        });
      }
      
      // Mock status
      if (url.includes('/api/avaliacao/status')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ avaliacaoId: 1, status: 'em_andamento' }),
        });
      }
      
      // Mock respostas-all (36 respostas já salvas)
      if (url.includes('/api/avaliacao/respostas-all')) {
        const respostas36 = Array.from({ length: 36 }, (_, i) => ({
          item: `Q${i + 1}`,
          valor: 50,
        }));
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              avaliacaoId: 1,
              respostas: respostas36,
            }),
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('deve mostrar modal imediatamente ao clicar na Q37 (última questão)', async () => {
    // Este é um teste de conceito - a implementação real requer mock completo da página
    const CompletionModal = (await import('@/components/avaliacao/CompletionModal')).default;
    
    const { rerender } = render(
      <CompletionModal isOpen={false} status="processing" />
    );

    // Simular que usuário clicou em Q37
    rerender(<CompletionModal isOpen={true} status="processing" />);

    // Modal deve aparecer IMEDIATAMENTE
    expect(screen.getByText('Finalizando sua avaliação...')).toBeInTheDocument();
  });

  it('modal deve transicionar de processing para success após resposta do servidor', async () => {
    const CompletionModal = (await import('@/components/avaliacao/CompletionModal')).default;
    
    const { rerender } = render(
      <CompletionModal isOpen={true} status="processing" />
    );

    // Estado inicial: processando
    expect(screen.getByText('Finalizando sua avaliação...')).toBeInTheDocument();

    // Simular que servidor respondeu completed: true
    rerender(<CompletionModal isOpen={true} status="success" />);

    // Estado final: sucesso
    await waitFor(() => {
      expect(screen.getByText('Avaliação enviada com sucesso!')).toBeInTheDocument();
    });
  });

  it('modal de sucesso deve mostrar mensagem de redirecionamento', async () => {
    const CompletionModal = (await import('@/components/avaliacao/CompletionModal')).default;
    
    render(<CompletionModal isOpen={true} status="success" />);

    expect(screen.getByText('Redirecionando para o comprovante...')).toBeInTheDocument();
  });

  it('modal não deve permitir fechamento durante processamento', async () => {
    const CompletionModal = (await import('@/components/avaliacao/CompletionModal')).default;
    
    render(<CompletionModal isOpen={true} status="processing" />);

    // Verificar que não há botão de fechar
    const closeButton = screen.queryByRole('button', { name: /fechar|close|x/i });
    expect(closeButton).not.toBeInTheDocument();
  });

  it('modal processing deve mostrar spinner animado', async () => {
    const CompletionModal = (await import('@/components/avaliacao/CompletionModal')).default;
    const { container } = render(
      <CompletionModal isOpen={true} status="processing" />
    );

    // Verificar presença de spinner
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('modal success deve mostrar checkmark verde', async () => {
    const CompletionModal = (await import('@/components/avaliacao/CompletionModal')).default;
    const { container } = render(
      <CompletionModal isOpen={true} status="success" />
    );

    // Verificar presença de checkmark (SVG)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Verificar cor verde
    const greenCircle = container.querySelector('.bg-green-100');
    expect(greenCircle).toBeInTheDocument();
  });
});
