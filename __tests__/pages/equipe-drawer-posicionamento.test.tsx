/**
 * @file __tests__/pages/equipe-drawer-posicionamento.test.tsx
 *
 * Testes de regressão para a correção do drawer de edição do vendedor
 * no painel do representante (/representante/equipe).
 *
 * Problema original: o drawer usava `top-0 h-full` — como o <header> sticky
 * tem z-30 e h-14 (56 px), o topo do drawer ficava oculto atrás do header e
 * os botões do rodapé (Cancelar / Salvar) eram cortados no final do viewport.
 *
 * Correção aplicada: `top-14 h-[calc(100vh-3.5rem)]` para que o drawer inicie
 * exatamente abaixo do header e ocupe toda a altura restante visível.
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Mocks de módulos externos
// ---------------------------------------------------------------------------

jest.mock('@/app/representante/(portal)/equipe/CadastrarVendedorModal', () => ({
  __esModule: true,
  default: () => <div data-testid="mock-cadastrar-modal" />,
  CodigoVendedorSucesso: () => <div data-testid="mock-codigo-sucesso" />,
}));

// Silencia erros de act() warnings do React
const consoleError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('act(')) return;
    consoleError(...args);
  };
});
afterAll(() => {
  console.error = consoleError;
});

// ---------------------------------------------------------------------------
// Setup do fetch mock
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const vendedorMock = {
  vinculo_id: 1,
  vendedor_id: 42,
  vendedor_nome: 'Huguinho Dsiney',
  vendedor_email: 'huguinho@teste.com',
  vendedor_cpf: '12345678901',
  codigo_vendedor: 'VND-QYW8Q',
  leads_ativos: 0,
  vinculado_em: '2026-01-01T00:00:00Z',
};

function setupFetchMocks(overrides: Record<string, unknown> = {}) {
  mockFetch.mockImplementation((url: string) => {
    // Dados completos de um vendedor específico (GET /vendedores/[id]) — deve
    // vir ANTES do match genérico para não ser capturado prematuramente
    if (/\/vendedores\/\d+$/.test(url)) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            vendedor: {
              ...vendedorMock,
              sexo: 'masculino',
              endereco: 'Rua Antônio Bianchetti, 90',
              cidade: 'São José dos Pinhais',
              estado: 'PR',
              cep: '83065370',
            },
          }),
      });
    }
    // Lista inativos
    if (url.includes('ativo=false')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ vendedores: [], total: 0 }),
      });
    }
    // Lista ativos (com paginação)
    if (url.includes('/api/representante/equipe/vendedores')) {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            vendedores: [vendedorMock],
            total: 1,
            ...overrides,
          }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

// ---------------------------------------------------------------------------
// Import do componente (feito dentro de describe para pegar mocks corretos)
// ---------------------------------------------------------------------------

let EquipePage: React.ComponentType;

beforeAll(async () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  EquipePage = (await import('@/app/representante/(portal)/equipe/page'))
    .default;
});

// ---------------------------------------------------------------------------
// Suite de testes
// ---------------------------------------------------------------------------

describe('EditarVendedorDrawer — posicionamento corrigido', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupFetchMocks();
  });

  it('drawer deve ter classe top-14 (não top-0)', async () => {
    // Arrange
    render(<EquipePage />);

    // Aguarda o card do vendedor carregar
    await waitFor(() =>
      expect(screen.getByText('Huguinho Dsiney')).toBeInTheDocument()
    );

    // Act — abre o drawer clicando no chevron
    const botaoEditar = screen.getByTitle('Editar dados do vendedor');
    fireEvent.click(botaoEditar);

    // Assert — drawer com posição correta
    const drawer = screen.getByRole('dialog');
    expect(drawer.className).toContain('top-14');
    expect(drawer.className).not.toContain('top-0');
  });

  it('drawer deve ter classe h-[calc(100vh-3.5rem)] (não h-full)', async () => {
    // Arrange
    render(<EquipePage />);
    await waitFor(() =>
      expect(screen.getByText('Huguinho Dsiney')).toBeInTheDocument()
    );

    // Act
    fireEvent.click(screen.getByTitle('Editar dados do vendedor'));

    // Assert
    const drawer = screen.getByRole('dialog');
    expect(drawer.className).toContain('h-[calc(100vh-3.5rem)]');
    expect(drawer.className).not.toContain('h-full');
  });

  it('drawer fechado deve ter classe translate-x-full (fora da tela)', () => {
    // Arrange — renderiza sem abrir o drawer
    render(<EquipePage />);

    // Assert — drawer presente no DOM mas fora da tela
    const drawer = screen.getByRole('dialog');
    expect(drawer.className).toContain('translate-x-full');
    expect(drawer.className).not.toContain('translate-x-0');
  });

  it('drawer aberto deve ter classe translate-x-0', async () => {
    // Arrange
    render(<EquipePage />);
    await waitFor(() =>
      expect(screen.getByText('Huguinho Dsiney')).toBeInTheDocument()
    );

    // Act
    fireEvent.click(screen.getByTitle('Editar dados do vendedor'));

    // Assert
    const drawer = screen.getByRole('dialog');
    expect(drawer.className).toContain('translate-x-0');
    expect(drawer.className).not.toContain('translate-x-full');
  });

  it('botão Cancelar deve estar presente no rodapé do drawer', async () => {
    // Arrange
    render(<EquipePage />);
    await waitFor(() =>
      expect(screen.getByText('Huguinho Dsiney')).toBeInTheDocument()
    );

    // Act
    fireEvent.click(screen.getByTitle('Editar dados do vendedor'));

    // Assert — botão Cancelar no footer (não o que aparece no confirm de inativar)
    const botoesCancel = await screen.findAllByRole('button', {
      name: /cancelar/i,
    });
    expect(botoesCancel.length).toBeGreaterThanOrEqual(1);
  });

  it('botão Salvar deve estar presente no rodapé do drawer', async () => {
    // Arrange
    render(<EquipePage />);
    await waitFor(() =>
      expect(screen.getByText('Huguinho Dsiney')).toBeInTheDocument()
    );

    // Act
    fireEvent.click(screen.getByTitle('Editar dados do vendedor'));

    // Assert
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /salvar/i })
      ).toBeInTheDocument()
    );
  });

  it('botão Inativar Vendedor deve estar visível no drawer', async () => {
    // Arrange
    render(<EquipePage />);
    await waitFor(() =>
      expect(screen.getByText('Huguinho Dsiney')).toBeInTheDocument()
    );

    // Act
    fireEvent.click(screen.getByTitle('Editar dados do vendedor'));

    // Assert
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /inativar vendedor/i })
      ).toBeInTheDocument()
    );
  });

  it('drawer deve ter role="dialog" e aria-modal="true"', () => {
    // Arrange
    render(<EquipePage />);

    // Assert — acessibilidade
    const drawer = screen.getByRole('dialog');
    expect(drawer).toHaveAttribute('aria-modal', 'true');
  });

  it('fechar drawer com botão X deve retornar translate-x-full', async () => {
    // Arrange
    render(<EquipePage />);
    await waitFor(() =>
      expect(screen.getByText('Huguinho Dsiney')).toBeInTheDocument()
    );

    // Abre drawer
    fireEvent.click(screen.getByTitle('Editar dados do vendedor'));
    const drawer = screen.getByRole('dialog');
    expect(drawer.className).toContain('translate-x-0');

    // Fecha com X
    const botoesX = screen
      .getAllByRole('button')
      .filter(
        (b) =>
          b.getAttribute('class')?.includes('rounded-lg') &&
          b.querySelectorAll('svg').length > 0 &&
          !b.getAttribute('title')
      );
    // Usa o botão X do header do drawer (primeiro entre os de fechar sem title)
    const btnX = screen.getByRole('dialog').querySelector('button');
    if (btnX) fireEvent.click(btnX);

    // Assert
    await waitFor(() => expect(drawer.className).toContain('translate-x-full'));
  });
});
