import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConditionalHeader from '@/components/ConditionalHeader';

// Mock do next/navigation
const mockPathname = jest.fn();
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock do componente Header
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <header data-testid="header">Mock Header</header>;
  };
});

// Mock do fetch
global.fetch = jest.fn();

describe('ConditionalHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não deve renderizar header na rota /login', () => {
    mockPathname.mockReturnValue('/login');

    const { container } = render(<ConditionalHeader />);

    expect(container.querySelector('[data-testid="header"]')).toBeNull();
  });

  it('não deve renderizar header na rota /avaliacao', () => {
    mockPathname.mockReturnValue('/avaliacao');

    const { container } = render(<ConditionalHeader />);

    expect(container.querySelector('[data-testid="header"]')).toBeNull();
  });

  it('não deve renderizar header em rotas /avaliacao/*', () => {
    mockPathname.mockReturnValue('/avaliacao/grupo/1');

    const { container } = render(<ConditionalHeader />);

    expect(container.querySelector('[data-testid="header"]')).toBeNull();
  });

  it('deve renderizar header na rota /dashboard', () => {
    mockPathname.mockReturnValue('/dashboard');

    render(<ConditionalHeader />);

    // Se getByTestId não lançar erro, o header está presente
    screen.getByTestId('header');
  });

  it('deve renderizar header na rota /rh', () => {
    mockPathname.mockReturnValue('/rh');

    render(<ConditionalHeader />);

    screen.getByTestId('header');
  });

  it('deve renderizar header na rota /admin', () => {
    mockPathname.mockReturnValue('/admin');

    render(<ConditionalHeader />);

    screen.getByTestId('header');
  });

  it('deve renderizar header na rota /emissor', () => {
    mockPathname.mockReturnValue('/emissor');

    render(<ConditionalHeader />);

    screen.getByTestId('header');
  });

  it('deve renderizar header na rota /admin (compatibilidade com perfil antigo removida)', () => {
    mockPathname.mockReturnValue('/admin');

    render(<ConditionalHeader />);

    screen.getByTestId('header');
  });
});
