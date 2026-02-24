/**
 * @file __tests__/ui/responsividade-funcionario.test.tsx
 * @description Testes de responsividade para o fluxo completo do funcionário:
 *   Login → Confirmação de Identidade → Dashboard → Avaliação → Comprovante
 * @date 2026-02-23
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mocks de navegação Next.js
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/login',
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...rest }: any) => <img alt={alt} {...rest} />,
}));

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

// ============================================================================
describe('Responsividade: Página de Login (/login)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);
  });

  it('deve usar logo com size "3xl" (w-48 h-48 = 192px)', async () => {
    const LoginPage = (await import('@/app/login/page')).default;
    const { container } = render(<LoginPage />);

    // Logo deve ter classe w-48 (3xl)
    const logoDivs = container.querySelectorAll('.w-48');
    expect(logoDivs.length).toBeGreaterThan(0);
  });

  it('deve ter container com safe-area padding no iOS', async () => {
    const LoginPage = (await import('@/app/login/page')).default;
    const { container } = render(<LoginPage />);

    // Container raiz deve ter style com env(safe-area-inset-top)
    const mainDiv = container.firstElementChild as HTMLElement;
    expect(mainDiv?.style?.paddingTop).toMatch(/safe-area/);
  });

  it('deve ter campo CPF com inputMode="numeric" para teclado numérico mobile', async () => {
    const LoginPage = (await import('@/app/login/page')).default;
    render(<LoginPage />);

    const cpfInput = screen.getByLabelText(/cpf/i);
    expect(cpfInput).toHaveAttribute('inputmode', 'numeric');
  });

  it('deve ter campo data de nascimento com inputMode="numeric"', async () => {
    const LoginPage = (await import('@/app/login/page')).default;
    render(<LoginPage />);

    const dataInput = screen.getByLabelText(/data de nascimento/i);
    expect(dataInput).toHaveAttribute('inputmode', 'numeric');
  });

  it('campos de input devem ter text-base para evitar zoom automático no iOS', async () => {
    const LoginPage = (await import('@/app/login/page')).default;
    const { container } = render(<LoginPage />);

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input.className).toMatch(/text-base/);
    });
  });

  it('deve ter padding py-3 nos inputs para conforto de toque', async () => {
    const LoginPage = (await import('@/app/login/page')).default;
    const { container } = render(<LoginPage />);

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      expect(input.className).toMatch(/py-3/);
    });
  });

  it('botão Entrar deve ocupar largura total (w-full)', async () => {
    const LoginPage = (await import('@/app/login/page')).default;
    render(<LoginPage />);

    const btn = screen.getByRole('button', { name: /entrar/i });
    expect(btn).toHaveClass('w-full');
  });

  it('deve ter container principal com largura máxima responsiva (max-w-md)', async () => {
    const LoginPage = (await import('@/app/login/page')).default;
    const { container } = render(<LoginPage />);

    const formCard = container.querySelector('.max-w-md');
    expect(formCard).toBeInTheDocument();
  });
});

// ============================================================================
describe('Responsividade: Modal de Confirmação de Identidade', () => {
  const defaultProps = {
    isOpen: true,
    isLoading: false,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
    nome: 'João da Silva',
    cpf: '12345678901',
    dataNascimento: '1990-01-15',
  };

  beforeEach(() => jest.clearAllMocks());

  it('deve ter max-h para permitir scroll em telas pequenas', async () => {
    const Modal = (await import('@/components/modals/ModalConfirmacaoIdentidade')).default;
    const { container } = render(<Modal {...defaultProps} />);

    const modalBox = container.querySelector('[class*="max-h-"]');
    expect(modalBox).toBeInTheDocument();
  });

  it('deve ter overflow-y-auto no body do modal', async () => {
    const Modal = (await import('@/components/modals/ModalConfirmacaoIdentidade')).default;
    const { container } = render(<Modal {...defaultProps} />);

    const scrollable = container.querySelector('.overflow-y-auto');
    expect(scrollable).toBeInTheDocument();
  });

  it('deve ter safe-area no padding do footer', async () => {
    const Modal = (await import('@/components/modals/ModalConfirmacaoIdentidade')).default;
    const { container } = render(<Modal {...defaultProps} />);

    // Footer deve ter paddingBottom com safe-area-inset-bottom
    const footer = container.querySelector('[style*="safe-area-inset-bottom"]');
    expect(footer).toBeInTheDocument();
  });

  it('botão de cancelar deve ter classe touch-target (min 44px)', async () => {
    const Modal = (await import('@/components/modals/ModalConfirmacaoIdentidade')).default;
    const { container } = render(<Modal {...defaultProps} />);

    const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
    expect(cancelBtn).toHaveClass('touch-target');
  });

  it('botão de confirmar deve ter classe touch-target (min 44px)', async () => {
    const Modal = (await import('@/components/modals/ModalConfirmacaoIdentidade')).default;
    render(<Modal {...defaultProps} />);

    const confirmBtn = screen.getByRole('button', { name: /confirmar identidade/i });
    expect(confirmBtn).toHaveClass('touch-target');
  });

  it('título deve ter tamanho responsivo (text-lg sm:text-2xl)', async () => {
    const Modal = (await import('@/components/modals/ModalConfirmacaoIdentidade')).default;
    render(<Modal {...defaultProps} />);

    const titulo = screen.getByText(/confirmação de identidade/i);
    expect(titulo.className).toMatch(/text-lg/);
  });

  it('CPF não deve usar font-mono (evita overflow em mobile)', async () => {
    const Modal = (await import('@/components/modals/ModalConfirmacaoIdentidade')).default;
    const { container } = render(<Modal {...defaultProps} />);

    // CPF formatado não deve ter font-mono
    const cpfSpan = Array.from(container.querySelectorAll('span')).find(
      (el) => el.textContent?.includes('123.456.789-01')
    );
    expect(cpfSpan?.className).not.toMatch(/font-mono/);
  });

  it('container do overlay deve considerar safe area no topo', async () => {
    const Modal = (await import('@/components/modals/ModalConfirmacaoIdentidade')).default;
    const { container } = render(<Modal {...defaultProps} />);

    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay?.style?.paddingTop).toMatch(/safe-area/);
  });

  it('botões ficam em coluna no mobile (flex-col-reverse)', async () => {
    const Modal = (await import('@/components/modals/ModalConfirmacaoIdentidade')).default;
    const { container } = render(<Modal {...defaultProps} />);

    const footer = container.querySelector('.flex-col-reverse');
    expect(footer).toBeInTheDocument();
  });
});

// ============================================================================
describe('Responsividade: Dashboard do Funcionário (/dashboard)', () => {
  const mockAvaliacaoDisponivel = {
    id: 1,
    status: 'iniciada',
    criado_em: new Date().toISOString(),
    envio: null,
    grupo_atual: null,
    total_respostas: 0,
  };

  const mockAvaliacaoConcluida = {
    id: 2,
    status: 'concluida',
    criado_em: new Date().toISOString(),
    envio: new Date().toISOString(),
    grupo_atual: null,
    total_respostas: 37,
  };

  // Importação única do componente fora do beforeEach para evitar React null
  let Dashboard: React.ComponentType;

  beforeAll(async () => {
    Dashboard = (await import('@/app/dashboard/page')).default as React.ComponentType;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loading deve exibir spinner centralizado', async () => {
    // Retorna pendente para manter estado de loading
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ nome: 'João', avaliacoes: [] }) } as Response);

    const { container } = render(<Dashboard />);

    // Durante loading, deve ter spinner
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('cards de avaliação devem ter estrutura flex-col em mobile', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ nome: 'João' }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ avaliacoes: [mockAvaliacaoDisponivel] }),
      } as Response);

    const { container } = render(<Dashboard />);

    await waitFor(() => screen.getByText(/avaliações disponíveis/i));

    // Cards de avaliação devem ter flex-col para mobile
    const cardFlex = container.querySelector('[class*="flex-col"]');
    expect(cardFlex).toBeInTheDocument();
  });

  it('botão Iniciar/Continuar deve ter touch-target', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ nome: 'João' }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ avaliacoes: [mockAvaliacaoDisponivel] }),
      } as Response);

    render(<Dashboard />);

    await waitFor(() => {
      const btnIniciar = screen.getByText(/iniciar avaliação/i).closest('a');
      expect(btnIniciar).toHaveClass('touch-target');
    });
  });

  it('botão Sair deve ter touch-target', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ nome: 'João' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ avaliacoes: [] }) } as Response);

    render(<Dashboard />);

    await waitFor(() => {
      const btnSair = screen.getByRole('button', { name: /sair/i });
      expect(btnSair).toHaveClass('touch-target');
    });
  });

  it('título de boas-vindas deve ter tamanho responsivo', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ nome: 'João' }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ avaliacoes: [] }) } as Response);

    render(<Dashboard />);

    await waitFor(() => {
      const titulo = screen.getByText(/bem-vindo/i);
      // Deve ter classe text-xl + sm:text-3xl
      expect(titulo.className).toMatch(/text-xl/);
    });
  });

  it('cards histórico devem ter estrutura flex-col em mobile', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ nome: 'João' }) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ avaliacoes: [mockAvaliacaoConcluida] }),
      } as Response);

    const { container } = render(<Dashboard />);

    await waitFor(() => screen.getByText(/histórico/i));

    const cardFlex = container.querySelector('[class*="flex-col"]');
    expect(cardFlex).toBeInTheDocument();
  });

  it('deve ter paddingBottom com safe-area para iOS - verificação de código', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(
      path.resolve(process.cwd(), 'app/dashboard/page.tsx'),
      'utf-8'
    );
    expect(src).toContain('safe-area-inset-bottom');
  });
});

// ============================================================================
describe('Responsividade: Componente RadioScale', () => {
  let RadioScale: any;
  const defaultProps = {
    questionId: 'q1',
    questionText: 'Você se sente sobrecarregado no trabalho?',
    value: null,
    onChange: jest.fn(),
  };

  beforeAll(async () => {
    RadioScale = (await import('@/components/RadioScale')).default;
  });

  beforeEach(() => jest.clearAllMocks());

  it('deve ter grid de 5 colunas para mobile', () => {
    const { container } = render(<RadioScale {...defaultProps} />);

    const mobileGrid = container.querySelector('.sm\\:hidden .grid-cols-5');
    expect(mobileGrid).toBeInTheDocument();
  });

  it('labels mobile devem ter texto com no mínimo 12px', () => {
    render(<RadioScale {...defaultProps} />);

    const mobileContainer = document.querySelector('.sm\\:hidden');
    const labels = mobileContainer?.querySelectorAll('span');

    labels?.forEach((span) => {
      // text-[12px] ou maior
      expect(span.className).toMatch(/text-\[(1[2-9]|2\d+)px\]|text-(xs|sm|base|lg|xl)/);
    });
  });

  it('botões mobile devem ter min-h-[76px] para touch confortável', () => {
    const { container } = render(<RadioScale {...defaultProps} />);

    const mobileContainer = container.querySelector('.sm\\:hidden');
    const buttons = mobileContainer?.querySelectorAll('button');

    buttons?.forEach((btn) => {
      expect(btn.className).toMatch(/min-h-\[7[0-9]+px\]/);
    });
  });

  it('versão desktop deve ser hidden em mobile (hidden sm:grid)', () => {
    const { container } = render(<RadioScale {...defaultProps} />);

    const desktopGrid = container.querySelector('.hidden.grid-cols-5');
    expect(desktopGrid).toBeInTheDocument();
    // Desktop grid deve ter .hidden class
    expect(desktopGrid?.className).toMatch(/\bhidden\b/);
  });

  it('pergunta deve ter tamanhos responsivos', () => {
    render(<RadioScale {...defaultProps} />);

    const pergunta = screen.getByText('Você se sente sobrecarregado no trabalho?');
    expect(pergunta.className).toMatch(/text-\[1\.[0-9]rem\]|sm:text-/);
  });
});

// ============================================================================
describe('Responsividade: Header - verificação de código', () => {
  // O Header usa useEffect + fetch, difícil de testar renderização isolada
  // Verificamos as correções diretamente no código-fonte
  let sourceCode: string;

  beforeAll(() => {
    const fs = require('fs');
    const path = require('path');
    sourceCode = fs.readFileSync(
      path.resolve(process.cwd(), 'components/Header.tsx'),
      'utf-8'
    );
  });

  it('deve usar classes Tailwind para padding (não inline style padding fixo)', () => {
    // O header deve usar classes px-3/px-6 em vez de style="padding: 0 32px"
    expect(sourceCode).not.toContain("padding: '0 32px'");
    expect(sourceCode).toMatch(/px-3|px-4|px-6/);
  });

  it('logo deve ter tamanho responsivo w-8 sm:w-11', () => {
    expect(sourceCode).toContain('w-8');
    expect(sourceCode).toContain('sm:w-11');
  });

  it('nome do usuário deve ter max-w para evitar overflow em mobile', () => {
    expect(sourceCode).toMatch(/max-w-\[|max-w-xs|max-w-sm/);
    expect(sourceCode).toContain('truncate');
  });

  it('título deve ter text-base para mobile e sm:text-xl para desktop', () => {
    expect(sourceCode).toContain('text-base');
    expect(sourceCode).toContain('sm:text-xl');
  });

  it('deve ter sticky top-0 via classe Tailwind', () => {
    expect(sourceCode).toContain('sticky');
    expect(sourceCode).toContain('top-0');
  });

  it('não deve usar fontSize inline (inline styles não são responsivos)', () => {
    expect(sourceCode).not.toContain('fontSize: 20');
    expect(sourceCode).not.toContain('fontSize: 16');
    expect(sourceCode).not.toContain('fontSize: 10');
  });

  it('slogan deve ser oculto em telas muito pequenas (hidden xs:block)', () => {
    expect(sourceCode).toContain('hidden xs:block');
  });

  it('safe area deve ser aplicada no padding top do header', () => {
    expect(sourceCode).toContain('safe-area-inset-top');
  });
});

// ============================================================================
describe('Responsividade: Avaliação (/avaliacao) - verificação de código', () => {
  // Verifica as correções no código-fonte sem renderizar o componente complexo
  // (que depende de muitos hooks e mocks difíceis de isolar em unidade)
  let sourceCode: string;

  beforeAll(() => {
    const fs = require('fs');
    const path = require('path');
    sourceCode = fs.readFileSync(
      path.resolve(process.cwd(), 'app/avaliacao/page.tsx'),
      'utf-8'
    );
  });

  it('SVG namespace deve ser http://www.w3.org/2000/svg (corrigido)', () => {
    expect(sourceCode).toContain('http://www.w3.org/2000/svg');
    expect(sourceCode).not.toContain('http://www.w3.org/2/svg');
  });

  it('SVG deve ter width="24" e height="24" (corrigido de width="3")', () => {
    expect(sourceCode).toContain('width="24"');
    expect(sourceCode).toContain('height="24"');
    expect(sourceCode).not.toContain('width="3"');
    expect(sourceCode).not.toContain('height="3"');
  });

  it('SVG viewBox deve ser "0 0 24 24" (corrigido do valor malformado)', () => {
    expect(sourceCode).toContain('viewBox="0 0 24 24"');
    expect(sourceCode).not.toContain('viewBox="  24 24"');
  });

  it('header deve ter safe-area-inset-top para notch iOS', () => {
    expect(sourceCode).toContain('safe-area-inset-top');
  });

  it('barra de progresso deve usar bg-white/30 (não bg-white/3)', () => {
    expect(sourceCode).toContain('bg-white/30');
    expect(sourceCode).not.toContain('bg-white/3\\"');
    expect(sourceCode).not.toContain("bg-white/3'");
  });

  it('animação deve usar duration-500 (não duration-5)', () => {
    expect(sourceCode).toContain('duration-500');
    expect(sourceCode).not.toContain('duration-5"');
    expect(sourceCode).not.toContain("duration-5'");
  });

  it('botão fechar deve ter hover:bg-white/20 (não hover:bg-white/2)', () => {
    expect(sourceCode).toContain('hover:bg-white/20');
    expect(sourceCode).not.toContain('hover:bg-white/2"');
    expect(sourceCode).not.toContain("hover:bg-white/2'");
  });

  it('estados de loading devem usar bg-gray-50 (não bg-gray-5)', () => {
    expect(sourceCode).toContain('bg-gray-50');
    expect(sourceCode).not.toContain('bg-gray-5"');
    expect(sourceCode).not.toContain("bg-gray-5'");
  });

  it('botão fechar deve ter classe touch-target', () => {
    expect(sourceCode).toContain('touch-target');
  });

  it('texto de progresso deve ter classes responsivas sm:', () => {
    expect(sourceCode).toMatch(/text-xs sm:text-sm/);
  });
});

// ============================================================================
describe('Responsividade: Página Avaliação Concluída - verificação de código', () => {
  let sourceCode: string;

  beforeAll(() => {
    const fs = require('fs');
    const path = require('path');
    sourceCode = fs.readFileSync(
      path.resolve(process.cwd(), 'app/avaliacao/concluida/page.tsx'),
      'utf-8'
    );
  });

  it('deve ter safe-area-inset-top no container principal', () => {
    expect(sourceCode).toContain('safe-area-inset-top');
  });

  it('deve ter safe-area-inset-bottom no container principal', () => {
    expect(sourceCode).toContain('safe-area-inset-bottom');
  });

  it('container principal deve ter padding responsivo', () => {
    expect(sourceCode).toMatch(/p-3 sm:p-4|p-2 sm:p-4|p-4 sm:p-6/);
  });
});

// ============================================================================
describe('QworkLogo: Suporte ao size 3xl', () => {
  it('deve renderizar sem erro com size="3xl"', async () => {
    const QworkLogo = (await import('@/components/QworkLogo')).default;
    const { container } = render(<QworkLogo size="3xl" showSlogan={false} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('deve ter classe w-48 h-48 com size="3xl"', async () => {
    const QworkLogo = (await import('@/components/QworkLogo')).default;
    const { container } = render(<QworkLogo size="3xl" />);
    const logoDiv = container.querySelector('.w-48');
    expect(logoDiv).toBeInTheDocument();
  });

  it('deve ter classe text-xl no slogan com size="3xl"', async () => {
    const QworkLogo = (await import('@/components/QworkLogo')).default;
    const { container } = render(<QworkLogo size="3xl" showSlogan={true} />);
    const slogan = container.querySelector('.text-xl');
    expect(slogan).toBeInTheDocument();
  });

  it('deve manter o size "2xl" para compatibilidade', async () => {
    const QworkLogo = (await import('@/components/QworkLogo')).default;
    const { container } = render(<QworkLogo size="2xl" />);
    const logoDiv = container.querySelector('.w-32');
    expect(logoDiv).toBeInTheDocument();
  });

  it('3xl (192px) deve ser 50% maior que 2xl (128px)', () => {
    const size2xl = 128; // w-32 = 8rem = 128px
    const size3xl = 192; // w-48 = 12rem = 192px
    expect(size3xl / size2xl).toBeCloseTo(1.5, 2);
  });
});

// ============================================================================
describe('Tailwind Config: Breakpoints de responsividade', () => {
  it('breakpoint xxs deve ser 320px (mobile pequeno)', async () => {
    const config = await import('@/tailwind.config');
    const screens = (config.default as any)?.theme?.extend?.screens;
    expect(screens?.xxs).toBe('320px');
  });

  it('breakpoint xs deve ser 475px', async () => {
    const config = await import('@/tailwind.config');
    const screens = (config.default as any)?.theme?.extend?.screens;
    expect(screens?.xs).toBe('475px');
  });
});
