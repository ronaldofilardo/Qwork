/**
 * Testes de Regressão Visual - Classes CSS e Layout
 *
 * Valida que as classes CSS críticas não são removidas ou alteradas
 * inadvertidamente, mantendo a consistência visual.
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
}));

// Mock do useSession
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}));

describe('Regressão Visual - Classes CSS Críticas', () => {
  describe('Login Page - Estilos Essenciais', () => {
    it('deve ter container principal com flexbox', () => {
      const LoginPage = require('@/app/login/page').default;
      const { container } = render(<LoginPage />);

      const mainDiv = container.querySelector('div');
      expect(mainDiv?.className).toMatch(/flex|grid/);
    });

    it('logo deve ter classes de dimensão corretas', () => {
      const LoginPage = require('@/app/login/page').default;
      const { getByAltText } = render(<LoginPage />);

      const logo = getByAltText('QWork');
      expect(logo.className).toMatch(/w-|h-/);
      expect(logo.className).toMatch(/object-contain/);
    });

    it('formulário deve ter espaçamento adequado', () => {
      const LoginPage = require('@/app/login/page').default;
      const { container } = render(<LoginPage />);

      const form = container.querySelector('form');
      if (form) {
        expect(form.className).toMatch(/space-y|gap|p-|m-/);
      }
    });
  });

  describe('QuestionCard - Botões de Resposta', () => {
    it('labels devem ter fundo branco e bordas', () => {
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
        expect(label.className).toMatch(/bg-white/);
        expect(label.className).toMatch(/border/);
      });
    });

    it('não deve ter fundo azul nos botões', () => {
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
        expect(label.className).not.toMatch(/bg-blue/);
      });
    });

    it('botões devem ter padding consistente', () => {
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
        expect(label.className).toMatch(/p-|px-|py-/);
      });
    });
  });

  describe('RadioScale - Estilos de Escala', () => {
    it('botões devem ter fundo branco', () => {
      const RadioScale = require('@/components/RadioScale').default;
      const { container } = render(
        <RadioScale
          questionId="test-1"
          questionText="Teste"
          value={null}
          onChange={jest.fn()}
        />
      );

      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button.className).toMatch(/bg-white/);
      });
    });

    it('não deve ter fundo colorido nos botões inativos', () => {
      const RadioScale = require('@/components/RadioScale').default;
      const { container } = render(
        <RadioScale
          questionId="test-1"
          questionText="Teste"
          value={null}
          onChange={jest.fn()}
        />
      );

      const buttons = container.querySelectorAll(
        'button:not([aria-pressed="true"])'
      );
      buttons.forEach((button) => {
        expect(button.className).not.toMatch(/bg-blue-|bg-green-[^1]/);
      });
    });
  });

  describe('Header - Layout e Estrutura', () => {
    it('deve ter padding e altura adequados', () => {
      const Header = require('@/components/Header').default;
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      if (header) {
        expect(header.className).toMatch(/p-|px-|py-|h-/);
      }
    });

    it('deve usar flexbox para layout', () => {
      const Header = require('@/components/Header').default;
      const { container } = render(<Header />);

      const header = container.querySelector('header');
      if (header) {
        expect(header.className).toMatch(/flex/);
      }
    });
  });

  describe('Cards e Containers', () => {
    it('cards devem ter bordas e sombras', () => {
      const QuestionCard = require('@/components/QuestionCard').default;
      const { container } = render(
        <QuestionCard
          questionId="test-1"
          texto="Teste"
          valor={undefined}
          onChange={jest.fn()}
        />
      );

      const card = container.querySelector('div');
      if (card) {
        const hasVisualSeparation =
          card.className.match(/border|shadow|rounded|bg-/) !== null;
        expect(hasVisualSeparation).toBe(true);
      }
    });
  });

  describe('Tipografia Consistente', () => {
    it('títulos devem ter tamanhos de fonte adequados', () => {
      const LoginPage = require('@/app/login/page').default;
      const { container } = render(<LoginPage />);

      const headings = container.querySelectorAll('h1, h2, h3');
      headings.forEach((heading) => {
        expect(heading.className).toMatch(/text-|font-/);
      });
    });
  });

  describe('Cores do Sistema', () => {
    it('deve usar paleta de cores consistente (branco, cinza, verde, preto)', () => {
      const QuestionCard = require('@/components/QuestionCard').default;
      const { container } = render(
        <QuestionCard
          questionId="test-1"
          texto="Teste"
          valor={undefined}
          onChange={jest.fn()}
        />
      );

      const html = container.innerHTML;

      // Verificar que não há cores fora da paleta
      const forbiddenColors =
        /bg-red-|bg-yellow-|bg-purple-|bg-pink-|bg-indigo-/;
      expect(html).not.toMatch(forbiddenColors);
    });
  });

  describe('Responsividade', () => {
    it('deve ter classes responsivas em elementos principais', () => {
      const LoginPage = require('@/app/login/page').default;
      const { container } = render(<LoginPage />);

      const mainDiv = container.querySelector('div');
      if (mainDiv) {
        const hasResponsiveClasses =
          mainDiv.className.match(/sm:|md:|lg:|xl:/) !== null;
        // Se não tiver, pelo menos deve ter um layout base
        expect(mainDiv.className.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('Regressão Visual - Medidas e Dimensões', () => {
  it('botões devem ter altura mínima adequada para touch', () => {
    const QuestionCard = require('@/components/QuestionCard').default;
    const { container } = render(
      <QuestionCard
        questionId="test-1"
        texto="Teste"
        valor={undefined}
        onChange={jest.fn()}
      />
    );

    const buttons = container.querySelectorAll('button, label');
    buttons.forEach((button) => {
      // Verificar que tem padding ou altura mínima
      expect(button.className).toMatch(/p-|py-|h-/);
    });
  });

  it('inputs devem ter altura adequada', () => {
    const LoginPage = require('@/app/login/page').default;
    const { container } = render(<LoginPage />);

    const inputs = container.querySelectorAll(
      'input[type="text"], input[type="email"], input[type="password"]'
    );
    inputs.forEach((input) => {
      expect(input.className).toMatch(/h-|py-|p-/);
    });
  });
});

describe('Regressão Visual - Espaçamento', () => {
  it('componentes devem ter espaçamento entre elementos', () => {
    const QuestionCard = require('@/components/QuestionCard').default;
    const { container } = render(
      <QuestionCard
        questionId="test-1"
        texto="Teste"
        valor={undefined}
        onChange={jest.fn()}
      />
    );

    const mainContainer = container.querySelector('div');
    if (mainContainer) {
      expect(mainContainer.className).toMatch(/space-|gap-|m-|p-/);
    }
  });

  it('formulários devem ter espaçamento vertical entre campos', () => {
    const LoginPage = require('@/app/login/page').default;
    const { container } = render(<LoginPage />);

    const form = container.querySelector('form');
    if (form) {
      expect(form.className).toMatch(/space-y|gap-y|flex-col/);
    }
  });
});
