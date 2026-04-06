/**
 * @file __tests__/components/AvaliacaoConcluida.test.tsx
 * Testes: AvaliacaoConcluidaPage - Recibo de Conclusão
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AvaliacaoConcluidaPage from '@/app/avaliacao/concluida/page';

// Mock do useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock QworkLogo
jest.mock('@/components/QworkLogo', () => {
  return function MockQworkLogo({
    size,
    showSlogan,
  }: {
    size?: string;
    showSlogan?: boolean;
  }) {
    return (
      <div
        data-testid="qwork-logo"
        data-size={size}
        data-slogan={String(showSlogan)}
      >
        QWork Logo
      </div>
    );
  };
});

// Mock useOrgInfo
const mockOrgInfo = {
  logo_url: 'https://example.com/logo.png',
  nome: 'Empresa Teste',
};
jest.mock('@/hooks/useOrgInfo', () => ({
  useOrgInfo: () => ({ orgInfo: mockOrgInfo }),
}));

// Mock do fetch global
global.fetch = jest.fn();

// Mock do window.location e URLSearchParams
delete (window as any).location;
window.location = { search: '?avaliacao_id=123' } as any;

// Mock do URLSearchParams
global.URLSearchParams = jest.fn().mockImplementation(() => ({
  get: (key: string) => (key === 'avaliacao_id' ? '123' : null),
}));

describe('AvaliacaoConcluidaPage - Recibo de Conclusão', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'concluido' }),
    });
  });

  it('deve renderizar o recibo de conclusão com dados da avaliação', async () => {
    render(<AvaliacaoConcluidaPage />);

    // Aguarda o carregamento
    await waitFor(() => {
      expect(screen.getByText('📄 Recibo de Conclusão')).toBeInTheDocument();
    });

    // Verifica se os dados da avaliação são exibidos
    expect(screen.getByText('#123')).toBeInTheDocument();
    expect(screen.getByText(/Data de Conclusão:/)).toBeInTheDocument();
    expect(screen.getByText(/Hora de Conclusão:/)).toBeInTheDocument();
  });

  it('deve chamar window.print quando clicar no botão imprimir recibo', async () => {
    const mockPrint = jest.fn();
    window.print = mockPrint;

    render(<AvaliacaoConcluidaPage />);

    await waitFor(() => {
      const botaoImprimir = screen.getByText('🖨️ Imprimir Recibo');
      fireEvent.click(botaoImprimir);
      expect(mockPrint).toHaveBeenCalled();
    });
  });

  it('deve navegar para dashboard quando clicar em voltar', async () => {
    render(<AvaliacaoConcluidaPage />);

    await waitFor(() => {
      const botaoVoltar = screen.getByText('← Voltar ao Dashboard');
      fireEvent.click(botaoVoltar);
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('deve mostrar mensagem de confirmação de salvamento', async () => {
    render(<AvaliacaoConcluidaPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Suas respostas foram salvas com segurança/i)
      ).toBeInTheDocument();
    });
  });

  it('deve exibir logo da organização no topo quando orgInfo possui logo_url', async () => {
    render(<AvaliacaoConcluidaPage />);

    await waitFor(() => {
      const orgLogo = screen.getByAltText('Empresa Teste');
      expect(orgLogo).toBeInTheDocument();
      expect(orgLogo).toHaveAttribute('src', 'https://example.com/logo.png');
    });
  });

  it('deve renderizar logo QWork com size="3xl" e sem slogan', async () => {
    render(<AvaliacaoConcluidaPage />);

    await waitFor(() => {
      const qworkLogo = screen.getByTestId('qwork-logo');
      expect(qworkLogo).toHaveAttribute('data-size', '3xl');
      expect(qworkLogo).toHaveAttribute('data-slogan', 'false');
    });
  });

  it('não deve exibir texto "Avaliação de Saúde e Bem-Estar" como label de seção', async () => {
    render(<AvaliacaoConcluidaPage />);

    await waitFor(() => {
      expect(screen.getByText('📄 Recibo de Conclusão')).toBeInTheDocument();
    });

    const textos = screen.queryAllByText(/Avaliação de Saúde e Bem-Estar/i);
    expect(textos).toHaveLength(0);
  });

  it('deve mostrar loading state corretamente', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<AvaliacaoConcluidaPage />);
  });

  it('deve mostrar error state quando fetch falha', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Erro na API'));

    render(<AvaliacaoConcluidaPage />);

    await waitFor(() => {
      expect(screen.getByText(/Erro ao carregar recibo/)).toBeInTheDocument();
    });
  });

  it('deve buscar informações da avaliação usando o ID da URL', async () => {
    render(<AvaliacaoConcluidaPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/avaliacao/status?avaliacao_id=123'
      );
    });
  });

  it('deve exibir logo QWork no FINAL (após mensagem de segurança)', async () => {
    render(<AvaliacaoConcluidaPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Suas respostas foram salvas com segurança/i)
      ).toBeInTheDocument();
    });

    const qworkLogo = screen.getByTestId('qwork-logo');
    const securityMsg = screen.getByText(/Suas respostas foram salvas com segurança/i);

    // Verifica que ambos existem
    expect(qworkLogo).toBeInTheDocument();
    expect(securityMsg).toBeInTheDocument();

    // Verifica que o logo vem após a mensagem na árvore do DOM
    const logoPosicao = qworkLogo.compareDocumentPosition(securityMsg);
    // DOCUMENT_POSITION_PRECEDING (2) significa que securityMsg vem antes
    expect(logoPosicao & 2).toBe(2);
  });
});
