/**
 * Testes para o layout compartilhado de /admin/representantes/
 * Correção: sidebar desaparecia ao navegar para detalhes de um representante
 *
 * Cobertura:
 * - Renderização do AdminSidebar dentro do layout
 * - Seção "Geral > Representantes" ativa por padrão
 * - Children (conteúdo da rota) são renderizados
 * - Navegação para outras seções redireciona para /admin
 * - Navegação para Representantes permanece em /admin/representantes
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RepresentantesLayout from '@/app/admin/representantes/layout';

// Mock do Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock do SidebarLayout para isolar o componente
jest.mock('@/components/shared/SidebarLayout', () => {
  return function MockSidebarLayout({
    children,
    title,
    subtitle,
  }: {
    children: React.ReactNode;
    title: string;
    subtitle: string;
  }) {
    return (
      <div data-testid="sidebar-layout">
        <div data-testid="sidebar-title">{title}</div>
        <div data-testid="sidebar-subtitle">{subtitle}</div>
        <nav>{children}</nav>
      </div>
    );
  };
});

describe('RepresentantesLayout — Sidebar em rotas de representantes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar a sidebar administrativa', () => {
    // Arrange / Act
    render(
      <RepresentantesLayout>
        <div data-testid="children">Conteúdo filho</div>
      </RepresentantesLayout>
    );

    // Assert — sidebar presente
    expect(screen.getByTestId('sidebar-layout')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-title')).toHaveTextContent('QWork');
    expect(screen.getByTestId('sidebar-subtitle')).toHaveTextContent(
      'Painel Administrativo'
    );
  });

  it('deve renderizar os children passados ao layout', () => {
    // Arrange / Act
    render(
      <RepresentantesLayout>
        <div data-testid="page-content">Perfil do representante</div>
      </RepresentantesLayout>
    );

    // Assert — conteúdo filho presente
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(screen.getByText('Perfil do representante')).toBeInTheDocument();
  });

  it('deve exibir seção "Geral" expandida com "Representantes" ativo', () => {
    // Arrange / Act
    render(
      <RepresentantesLayout>
        <div>conteúdo</div>
      </RepresentantesLayout>
    );

    // Assert — item de menu "Representantes" presente e com estilo de ativo
    const repBtn = screen.getByRole('button', { name: /representantes/i });
    expect(repBtn).toBeInTheDocument();
    // item ativo tem classe bg-orange-50
    expect(repBtn.className).toMatch(/orange/);
  });

  it('deve redirecionar para /admin ao clicar em seção Tomadores', async () => {
    // Arrange
    const user = userEvent.setup();

    render(
      <RepresentantesLayout>
        <div>conteúdo</div>
      </RepresentantesLayout>
    );

    // Act — clicar em "Tomadores"
    const tomadoresBtn = screen.getByRole('button', { name: /tomadores/i });
    await user.click(tomadoresBtn);

    // Assert — navega para o SPA principal
    expect(mockPush).toHaveBeenCalledWith('/admin');
  });

  it('deve redirecionar para /admin ao clicar em seção Financeiro', async () => {
    // Arrange
    const user = userEvent.setup();

    render(
      <RepresentantesLayout>
        <div>conteúdo</div>
      </RepresentantesLayout>
    );

    // Act — clicar em "Financeiro"
    const finBtn = screen.getByRole('button', { name: /financeiro/i });
    await user.click(finBtn);

    // Assert
    expect(mockPush).toHaveBeenCalledWith('/admin');
  });

  it('deve redirecionar para /admin/representantes ao clicar em Representantes', async () => {
    // Arrange
    const user = userEvent.setup();

    render(
      <RepresentantesLayout>
        <div>conteúdo</div>
      </RepresentantesLayout>
    );

    // Act
    const repBtn = screen.getByRole('button', { name: /representantes/i });
    await user.click(repBtn);

    // Assert — permanece na rota de representantes
    expect(mockPush).toHaveBeenCalledWith('/admin/representantes');
  });
});
