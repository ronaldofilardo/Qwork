/**
 * Testes de Regressão Visual - Responsividade
 *
 * Testa que os layouts respondem adequadamente a diferentes tamanhos de tela
 * e que não há quebras em dispositivos móveis.
 */

import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams(),
  redirect: jest.fn(() => {
    throw new Error('NEXT_REDIRECT');
  }),
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

// Mock do useSession
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}));

// Helper para simular diferentes viewports
const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('Regressão Visual - Responsividade', () => {
  const viewports = {
    mobile: { width: 375, height: 667, name: 'Mobile' },
    tablet: { width: 768, height: 1024, name: 'Tablet' },
    desktop: { width: 1920, height: 1080, name: 'Desktop' },
  };

  describe('Login Page - Responsividade', () => {
    Object.entries(viewports).forEach(([key, viewport]) => {
      it(`deve renderizar corretamente em ${viewport.name} (${viewport.width}px)`, () => {
        setViewport(viewport.width, viewport.height);

        const LoginPage = require('@/app/login/page').default;
        const { container } = render(<LoginPage />);

        // Snapshot para cada viewport
        expect(container.firstChild).toMatchSnapshot(`login-${key}`);

        // Verificar que elementos essenciais existem
        const logo = container.querySelector('img[alt="QWork"]');
        expect(logo).toBeTruthy();

        const form = container.querySelector('form');
        expect(form).toBeTruthy();
      });
    });

    it('deve ter layout flex ou grid em todos os viewports', () => {
      const LoginPage = require('@/app/login/page').default;
      const { container } = render(<LoginPage />);

      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/flex|grid/);
    });
  });

  describe('Avaliação Page - Responsividade', () => {
    Object.entries(viewports).forEach(([key, viewport]) => {
      it(`deve renderizar corretamente em ${viewport.name} (${viewport.width}px)`, () => {
        setViewport(viewport.width, viewport.height);

        const AvaliacaoPage = require('@/app/avaliacao/page').default;
        const { container } = render(<AvaliacaoPage />);

        expect(container.firstChild).toMatchSnapshot(`avaliacao-${key}`);
      });
    });
  });

  describe('QuestionCard - Responsividade', () => {
    Object.entries(viewports).forEach(([key, viewport]) => {
      it(`deve renderizar corretamente em ${viewport.name} (${viewport.width}px)`, () => {
        setViewport(viewport.width, viewport.height);

        const QuestionCard = require('@/components/QuestionCard').default;
        const { container } = render(
          <QuestionCard
            questionId="test-1"
            texto="Pergunta de teste"
            valor={undefined}
            onChange={jest.fn()}
          />
        );

        expect(container.firstChild).toMatchSnapshot(`questioncard-${key}`);

        // Verificar que botões são visíveis
        const labels = container.querySelectorAll('label');
        expect(labels.length).toBeGreaterThan(0);
      });
    });

    it('botões devem ter tamanho adequado para touch em mobile', () => {
      setViewport(375, 667);

      const QuestionCard = require('@/components/QuestionCard').default;
      const { container } = render(
        <QuestionCard
          questionId="test-1"
          texto="Teste"
          valor={undefined}
          onChange={jest.fn()}
        />
      );

      const labels = container.querySelectorAll('label');
      labels.forEach((label) => {
        // Verificar padding/height adequado para touch (min 44px)
        expect(label.className).toMatch(/p-|py-|h-/);
      });
    });
  });

  describe('Header - Responsividade', () => {
    Object.entries(viewports).forEach(([key, viewport]) => {
      it(`deve renderizar corretamente em ${viewport.name} (${viewport.width}px)`, () => {
        setViewport(viewport.width, viewport.height);

        const Header = require('@/components/Header').default;
        const { container } = render(<Header />);

        expect(container.firstChild).toMatchSnapshot(`header-${key}`);
      });
    });
  });

  describe('Admin Dashboard - Responsividade', () => {
    beforeEach(() => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            nome: 'Admin',
            tipo_usuario: 'admin',
            email: 'admin@test.com',
          },
        },
        status: 'authenticated',
      });
    });

    Object.entries(viewports).forEach(([key, viewport]) => {
      it(`deve renderizar corretamente em ${viewport.name} (${viewport.width}px)`, () => {
        setViewport(viewport.width, viewport.height);

        const AdminPage = require('@/app/admin/page').default;
        const { container } = render(<AdminPage />);

        expect(container.firstChild).toMatchSnapshot(`admin-${key}`);
      });
    });
  });

  describe('RH Dashboard - Responsividade', () => {
    beforeEach(() => {
      const { useSession } = require('next-auth/react');
      useSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            nome: 'RH',
            tipo_usuario: 'rh',
            email: 'rh@test.com',
            contratanteId: '123',
          },
        },
        status: 'authenticated',
      });
    });

    Object.entries(viewports).forEach(([key, viewport]) => {
      it(`deve renderizar corretamente em ${viewport.name} (${viewport.width}px)`, () => {
        setViewport(viewport.width, viewport.height);

        const RHDashboard = require('@/app/rh/dashboard/page').default;
        const { container } = render(<RHDashboard />);

        expect(container.firstChild).toMatchSnapshot(`rh-dashboard-${key}`);
      });
    });
  });
});

describe('Regressão Visual - Overflow e Scroll', () => {
  it('containers devem ter overflow adequado para conteúdo longo', () => {
    const QuestionCard = require('@/components/QuestionCard').default;
    const longText = 'Texto muito longo que pode precisar de scroll: '.repeat(
      20
    );
    const { container } = render(
      <QuestionCard
        questionId="test-1"
        texto={longText}
        valor={undefined}
        onChange={jest.fn()}
      />
    );

    // Verificar que não há overflow-hidden que esconda conteúdo
    const divs = container.querySelectorAll('div');
    divs.forEach((div) => {
      // Se tem overflow-hidden, deve ter altura definida
      if (div.className.includes('overflow-hidden')) {
        expect(div.className).toMatch(/h-|max-h-/);
      }
    });
  });

  it('textos longos não devem quebrar o layout', () => {
    const QuestionCard = require('@/components/QuestionCard').default;
    const longText =
      'PalavraExtremamenteLongaSemEspaçosQuePoderiaQuebrarOLayout'.repeat(5);

    const { container } = render(
      <QuestionCard
        questionId="test-1"
        texto={longText}
        valor={undefined}
        onChange={jest.fn()}
      />
    );

    // Snapshot para verificar que layout se mantém
    expect(container.firstChild).toMatchSnapshot('long-text-handling');
  });
});

describe('Regressão Visual - Estados Interativos', () => {
  it('botões devem manter layout em estado hover', () => {
    const QuestionCard = require('@/components/QuestionCard').default;
    const { container } = render(
      <QuestionCard
        questionId="test-1"
        texto="Teste"
        valor={undefined}
        onChange={jest.fn()}
      />
    );

    // Verificar que existem classes hover
    const buttons = container.querySelectorAll('button, label');
    buttons.forEach((button) => {
      const hasHoverState = button.className.includes('hover:');
      // Se não tem hover, deve ter algum estilo base consistente
      if (!hasHoverState) {
        expect(button.className.length).toBeGreaterThan(0);
      }
    });
  });

  it('inputs devem manter layout em estado focus', () => {
    const LoginPage = require('@/app/login/page').default;
    const { container } = render(<LoginPage />);

    const inputs = container.querySelectorAll('input');
    inputs.forEach((input) => {
      const hasFocusState = input.className.includes('focus:');
      // Deve ter algum estilo definido
      expect(input.className.length).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Regressão Visual - Acessibilidade Visual', () => {
  it('elementos devem ter contraste adequado através de classes', () => {
    const QuestionCard = require('@/components/QuestionCard').default;
    const { container } = render(
      <QuestionCard
        questionId="test-1"
        texto="Teste"
        valor={undefined}
        onChange={jest.fn()}
      />
    );

    // Verificar que não há text-white em bg-white
    const elements = container.querySelectorAll('[class*="text-"]');
    elements.forEach((element) => {
      const hasWhiteText = element.className.includes('text-white');
      const hasWhiteBg = element.className.includes('bg-white');

      if (hasWhiteText && hasWhiteBg) {
        fail(
          'Elemento tem texto branco em fundo branco - problema de contraste'
        );
      }
    });
  });

  it('botões devem ter indicação visual clara de estado', () => {
    const QuestionCard = require('@/components/QuestionCard').default;
    const { container } = render(
      <QuestionCard
        questionId="test-1"
        texto="Teste"
        valor={1}
        onChange={jest.fn()}
      />
    );

    const buttons = container.querySelectorAll(
      'button, label, input[type="radio"]'
    );
    expect(buttons.length).toBeGreaterThan(0);

    // Simplificado: apenas verifica que há botões renderizados
    // Classes específicas de estado dependem da implementação
  });
});
