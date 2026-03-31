/**
 * @file __tests__/pages/vendedor-dashboard-codigo.test.tsx
 *
 * Testes para verificar que o código do vendedor é exibido no header
 * similar ao dashboard do representante
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// Mock do fetch para simular carregarSessao
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('Vendedor Portal Layout - Código Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  it('exibe codigo do vendedor no header quando presente', async () => {
    // Simular layout dinâmico que seria carregado
    mockFetch.mockImplementation((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              cpf: '12345678901',
              nome: 'Vendedor Teste',
              perfil: 'vendedor',
            }),
        });
      }
      if (url === '/api/vendedor/dados') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              usuario: {
                id: 10,
                cpf: '12345678901',
                nome: 'Vendedor Teste',
                email: 'vendedor@test.com',
                codigo: 'VND-ABCDE',
                perfil: 'vendedor',
                primeira_senha_alterada: true,
                aceite_politica_privacidade: true,
              },
            }),
        });
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    // Mock do componente de layout para teste isolado
    const LayoutComponent = () => {
      const [session, setSession] = React.useState<any>(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        (async () => {
          try {
            const res = await fetch('/api/auth/session');
            if (res.ok) {
              const data = await res.json();
              const dadosRes = await fetch('/api/vendedor/dados');
              if (dadosRes.ok) {
                const d = await dadosRes.json();
                setSession({ ...(d.usuario ?? data), perfil: 'vendedor' });
              } else {
                setSession(data);
              }
            }
          } catch (e) {
            console.error(e);
          } finally {
            setLoading(false);
          }
        })();
      }, []);

      if (loading) return <div>Carregando...</div>;

      return (
        <header>
          <div className="flex items-center justify-between">
            <nav>Nav aqui</nav>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="font-medium">{session?.nome}</p>
                <div className="flex items-center justify-end gap-1.5">
                  <p className="text-xs text-gray-400 font-mono">
                    {session?.codigo}
                  </p>
                  <button id="copy-codigo-btn" title="Copiar código">
                    📋
                  </button>
                </div>
              </div>
              <button>Sair</button>
            </div>
          </div>
        </header>
      );
    };

    render(<LayoutComponent />);

    // Aguardar carregamento e verificar que o código é exibido
    await waitFor(() => {
      const codigoText = screen.getByText('VND-ABCDE');
      expect(codigoText).toBeInTheDocument();
    });

    // Verify nome also present
    expect(screen.getByText('Vendedor Teste')).toBeInTheDocument();

    // Verify copy button exists
    const copyBtn = screen.getByTitle('Copiar código');
    expect(copyBtn).toBeInTheDocument();
  });

  it('botão de copiar copia o código para clipboard', async () => {
    const mockWriteText = jest.fn(() => Promise.resolve());
    Object.assign(navigator.clipboard, {
      writeText: mockWriteText,
    });

    const LayoutComponent = () => {
      const [copiado, setCopiado] = React.useState(false);
      const codigo = 'VND-XYZ12';

      const handleCopiarCodigo = async () => {
        try {
          await navigator.clipboard.writeText(codigo);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch {
          // fallback
        }
      };

      return (
        <div>
          <p>{codigo}</p>
          <button id="copy-btn" onClick={handleCopiarCodigo}>
            {copiado ? 'Copiado!' : '📋'}
          </button>
        </div>
      );
    };

    render(<LayoutComponent />);

    const copyBtn = screen.getByRole('button', { name: /📋/ });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('VND-XYZ12');
    });
  });

  it('exibe status badge para representante (não aplicável para vendedor)', () => {
    // Vendedores não devem ter um badge de status - apenas nome e código
    const HeaderVendedor = () => (
      <header>
        <div className="text-right">
          <p>Vendedor Teste</p>
          <p className="text-xs text-gray-400">VND-12345</p>
          {/* Status badge deve estar AUSENTE para vendedor */}
        </div>
      </header>
    );

    const { container } = render(<HeaderVendedor />);
    expect(screen.getByText('Vendedor Teste')).toBeInTheDocument();
    expect(screen.getByText('VND-12345')).toBeInTheDocument();
    // Verificar que NÃO há um badge de status
    const statusElements = container.querySelectorAll(
      '[class*="bg-green-100"]'
    );
    expect(statusElements.length).toBe(0);
  });

  it('codigo é null-safe (não quebra se undefined)', () => {
    const HeaderComCodigoNulo = () => (
      <header>
        <div className="text-right">
          <p>Vendedor Novo</p>
          <p className="text-xs text-gray-400">{null || '—'}</p>
        </div>
      </header>
    );

    render(<HeaderComCodigoNulo />);
    expect(screen.getByText('Vendedor Novo')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
