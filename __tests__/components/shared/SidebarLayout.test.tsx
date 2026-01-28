import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SidebarLayout from '@/components/shared/SidebarLayout';

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('SidebarLayout snapshots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders default layout and matches snapshot', () => {
    const { container } = render(
      <SidebarLayout
        title="QWork"
        subtitle="Painel Teste"
        userName="Usuário Teste"
        roleLabel="Gestor Teste"
      >
        <button>Item 1</button>
        <button>Item 2</button>
      </SidebarLayout>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders collapsed layout and matches snapshot', () => {
    const { container } = render(
      <SidebarLayout
        title="QWork"
        subtitle="Painel Teste"
        userName="Usuário Teste"
        roleLabel="Gestor Teste"
        isCollapsed
      >
        <button>Item 1</button>
      </SidebarLayout>
    );

    expect(container.firstChild).toMatchSnapshot();
  });

  it('logout button triggers API call and navigation', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({ ok: true });

    render(
      <SidebarLayout
        title="QWork"
        subtitle="Painel Teste"
        userName="Usuário Teste"
        roleLabel="Gestor Teste"
      >
        <button>Item</button>
      </SidebarLayout>
    );

    const logoutButton = screen.getByText('Sair');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
      });
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
