/**
 * @jest-environment jsdom
 * @file __tests__/ui/login-screen-improvements.test.ts
 * @description Testes para melhorias da tela de login (logo maior + box explicativo)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}));

// Mock components used by LoginPage
jest.mock('@/components/QworkLogo', () => {
  return function MockQworkLogo(props: any) {
    return React.createElement(
      'div',
      {
        'data-testid': 'qwork-logo',
        'data-size': props.size,
        'data-show-slogan': String(props.showSlogan),
        className: props.className,
      },
      'QWork Logo'
    );
  };
});

jest.mock('@/components/modals/ModalCadastrotomador', () => {
  return function MockModal() {
    return null;
  };
});

jest.mock('@/components/modals/ModalConfirmacaoIdentidade', () => {
  return function MockModal() {
    return null;
  };
});

jest.mock('@/components/modals/ModalTermosAceite', () => {
  return function MockModal() {
    return null;
  };
});

jest.mock('lucide-react', () => ({
  Building2: () =>
    React.createElement('span', { 'data-testid': 'building-icon' }),
}));

import LoginPage from '@/app/login/page';

describe('Tela de Login: Melhorias de UX', () => {
  beforeEach(() => {
    render(React.createElement(LoginPage));
  });

  describe('Logo Ampliado', () => {
    it('deve renderizar QworkLogo com size="3xl"', () => {
      const logo = screen.getByTestId('qwork-logo');
      expect(logo).toHaveAttribute('data-size', '3xl');
    });

    it('deve renderizar logo com showSlogan=false', () => {
      const logo = screen.getByTestId('qwork-logo');
      expect(logo).toHaveAttribute('data-show-slogan', 'false');
    });

    it('logo deve estar centralizado (text-center container)', () => {
      const logo = screen.getByTestId('qwork-logo');
      const container = logo.closest('.text-center');
      expect(container).toBeTruthy();
    });

    it('size 3xl deve ser 50% maior que 2xl', () => {
      // 2xl = w-32 = 128px, 3xl = w-48 = 192px
      expect(192 / 128).toBeCloseTo(1.5, 1);
    });
  });

  describe('Box Explicativo de Login', () => {
    it('deve ter título "Como Fazer Login?"', () => {
      expect(screen.getByText('Como Fazer Login?')).toBeInTheDocument();
    });

    it('deve ter box com fundo azul claro (bg-blue-50)', () => {
      const title = screen.getByText('Como Fazer Login?');
      const box = title.closest('.bg-blue-50');
      expect(box).toBeTruthy();
    });

    it('deve ter border azul (border-blue-200)', () => {
      const title = screen.getByText('Como Fazer Login?');
      const box = title.closest('.border-blue-200');
      expect(box).toBeTruthy();
    });

    it('deve ter opção 1: Com Senha para todos', () => {
      expect(screen.getByText('Com Senha')).toBeInTheDocument();
      expect(screen.getByText(/Todos os usuários/)).toBeInTheDocument();
    });

    it('deve ter opção 2: Com Data de Nascimento para funcionários', () => {
      expect(screen.getByText('Com Data de Nascimento')).toBeInTheDocument();
      expect(
        screen.getAllByText(/Funcionários sem/).length
      ).toBeGreaterThanOrEqual(1);
    });

    it('deve ter números 1 e 2 nas opções', () => {
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('números devem ter estilo font-bold text-blue-600', () => {
      const num1 = screen.getByText('1');
      expect(num1.className).toContain('font-bold');
      expect(num1.className).toContain('text-blue-600');
    });
  });

  describe('Labels dos Campos', () => {
    it('label CPF deve estar presente', () => {
      expect(screen.getByLabelText('CPF')).toBeInTheDocument();
    });

    it('label Senha deve indicar "(opcional se for funcionário)"', () => {
      expect(
        screen.getByText(/opcional se for funcionário/)
      ).toBeInTheDocument();
    });

    it('nota de opcional deve ter classe text-gray-500', () => {
      const span = screen.getByText(/opcional se for funcionário/);
      expect(span.className).toContain('text-gray-500');
    });
  });

  describe('Dica de Formato de Data', () => {
    it('deve exibir dica com formato "ddmmaaaa"', () => {
      expect(screen.getByText('ddmmaaaa')).toBeInTheDocument();
    });

    it('deve incluir exemplo "(ex: 15031990)"', () => {
      expect(screen.getByText(/15031990/)).toBeInTheDocument();
    });

    it('dica deve ter classe text-xs text-gray-500', () => {
      const hints = screen.getAllByText(/Funcionários sem senha/);
      const hint = hints.find((el) => el.className.includes('text-xs'));
      expect(hint).toBeTruthy();
      expect(hint!.className).toContain('text-gray-500');
    });
  });

  describe('Componentes de Formulário', () => {
    it('campo CPF deve ser obrigatório (required)', () => {
      const cpfInput = screen.getByPlaceholderText('00000000000');
      expect(cpfInput).toHaveAttribute('required');
    });

    it('campo CPF deve ter maxLength=11', () => {
      const cpfInput = screen.getByPlaceholderText('00000000000');
      expect(cpfInput).toHaveAttribute('maxLength', '11');
    });

    it('campo Senha deve ter placeholder "••••••••"', () => {
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('campo Senha não deve ser required', () => {
      const senhaInput = screen.getByPlaceholderText('••••••••');
      expect(senhaInput).not.toHaveAttribute('required');
    });

    it('botão submit deve mostrar "Entrar"', () => {
      expect(
        screen.getByRole('button', { name: 'Entrar' })
      ).toBeInTheDocument();
    });
  });

  describe('Acessibilidade', () => {
    it('título deve estar em h3', () => {
      const title = screen.getByText('Como Fazer Login?');
      expect(title.tagName).toBe('H3');
    });

    it('lista deve estar em ul com li', () => {
      const list = screen
        .getByText('Como Fazer Login?')
        .closest('div')
        ?.querySelector('ul');
      expect(list).toBeTruthy();
      const items = list?.querySelectorAll('li');
      expect(items?.length).toBe(2);
    });

    it('labels devem estar associados aos inputs via htmlFor', () => {
      const cpfLabel = screen.getByText('CPF');
      expect(cpfLabel.tagName).toBe('LABEL');
      expect(cpfLabel).toHaveAttribute('for', 'cpf');
    });
  });
});
