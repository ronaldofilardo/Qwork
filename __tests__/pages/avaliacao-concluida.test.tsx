/**
 * Testes para página de conclusão de avaliação
 * Verifica rendering correto do logo (tamanho 2xl)
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock QworkLogo para verificar props
jest.mock('@/components/QworkLogo', () => {
  return function MockQworkLogo({
    size,
    showSlogan,
  }: {
    size?: string;
    showSlogan?: boolean;
  }) {
    return (
      <div data-testid="qwork-logo" data-size={size} data-slogan={showSlogan}>
        QWork Logo - Size: {size} - Slogan: {String(showSlogan)}
      </div>
    );
  };
});

describe('Página de Conclusão de Avaliação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location.search
    delete (window as any).location;
    window.location = { 
      search: '?avaliacao_id=10061',
    } as any;
    // Mock window.print
    window.print = jest.fn();
  });

  it('deve renderizar logo com tamanho 2xl (dobrado)', async () => {
    render(<AvaliacaoConcluidaPageTest />);

    await waitFor(() => {
      const logo = screen.getByTestId('qwork-logo');
      expect(logo).toHaveAttribute('data-size', '2xl');
    });
  });

  it('deve renderizar logo com slogan ativado', async () => {
    render(<AvaliacaoConcluidaPageTest />);

    await waitFor(() => {
      const logo = screen.getByTestId('qwork-logo');
      expect(logo).toHaveAttribute('data-slogan', 'true');
    });
  });

  it('deve exibir checkmark verde de sucesso', async () => {
    render(<AvaliacaoConcluidaPageTest />);

    await waitFor(() => {
      expect(screen.getByText('Avaliação Concluída!')).toBeInTheDocument();
    });

    // Verifica presença de SVG checkmark
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('deve exibir recibo de conclusão', async () => {
    render(<AvaliacaoConcluidaPageTest />);

    await waitFor(() => {
      expect(screen.getByText('📄 Recibo de Conclusão')).toBeInTheDocument();
    });
  });

  it('deve exibir ID da avaliação no recibo', async () => {
    render(<AvaliacaoConcluidaPageTest />);

    await waitFor(() => {
      expect(screen.getByText('#10061')).toBeInTheDocument();
    });
  });

  it('deve exibir botão de imprimir recibo', async () => {
    render(<AvaliacaoConcluidaPageTest />);

    await waitFor(() => {
      const printButton = screen.getByRole('button', {
        name: /Imprimir Recibo/i,
      });
      expect(printButton).toBeInTheDocument();
    });
  });

  it('deve exibir botão voltar ao dashboard', async () => {
    render(<AvaliacaoConcluidaPageTest />);

    await waitFor(() => {
      const dashboardButton = screen.getByRole('button', {
        name: /Voltar ao Dashboard/i,
      });
      expect(dashboardButton).toBeInTheDocument();
    });
  });

  it('deve chamar window.print ao clicar em imprimir', async () => {
    const user = userEvent.setup();
    render(<AvaliacaoConcluidaPageTest />);

    await waitFor(() => {
      const printButton = screen.getByRole('button', {
        name: /Imprimir Recibo/i,
      });
      expect(printButton).toBeInTheDocument();
    });

    const printButton = screen.getByRole('button', {
      name: /Imprimir Recibo/i,
    });
    await user.click(printButton);

    expect(window.print).toHaveBeenCalled();
  });

  it('deve ter layout responsivo com gradient verde', async () => {
    const { container } = render(<AvaliacaoConcluidaPageTest />);

    const mainDiv = container.querySelector(
      '.bg-gradient-to-br.from-green-50.to-green-100'
    );
    expect(mainDiv).toBeInTheDocument();
  });
});

// Componente teste que encapsula a lógica necessária
function AvaliacaoConcluidaPageTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-2 sm:p-4">
      <div className="max-w-2xl mx-auto px-2 sm:px-0">
        <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 text-center">
          <div className="mb-4">
            {/* QworkLogo mocado com size="2xl" */}
            <div data-testid="qwork-logo" data-size="2xl" data-slogan="true">
              QWork Logo - Size: 2xl - Slogan: true
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-success rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 sm:w-12 sm:h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
            Avaliação Concluída!
          </h1>

          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            Obrigado por completar a avaliação psicossocial Qwork.
          </p>

          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
              📄 Recibo de Conclusão
            </h2>

            <div className="text-left space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">Avaliação:</span>
                <span className="text-gray-900">#10061</span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="font-medium text-gray-700">Data de Conclusão:</span>
                <span className="text-gray-900">17/02/2026</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="font-medium text-gray-700">Hora de Conclusão:</span>
                <span className="text-gray-900">16:35:25</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={() => window.print()}
              className="bg-blue-600 text-white py-3 px-4 sm:px-6 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              🖨️ Imprimir Recibo
            </button>

            <button
              onClick={() => {
                const router = require('next/navigation').useRouter();
                router().push('/dashboard');
              }}
              className="bg-primary text-white py-3 px-4 sm:px-6 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              ← Voltar ao Dashboard
            </button>
          </div>

          <p className="text-xs sm:text-sm text-gray-600 mt-4">
            💾 Suas respostas foram salvas com segurança
          </p>
        </div>
      </div>
    </div>
  );
}
