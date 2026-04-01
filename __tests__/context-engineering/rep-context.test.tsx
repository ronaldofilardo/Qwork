/**
 * @file __tests__/context-engineering/rep-context.test.tsx
 * Testes para RepresentanteProvider e useRepresentante (context engineering — fase 3)
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ----- Mocks -----
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  usePathname: () => '/representante/dashboard',
  useSearchParams: () => ({ get: () => null }),
}));

// Mock de modais que são renderizados nos gates
jest.mock('@/components/modals/ModalTermosRepresentante', () => ({
  __esModule: true,
  default: ({ onConcluir }: { onConcluir: () => void }) => (
    <div data-testid="modal-termos-rep">
      <button onClick={onConcluir}>aceitar</button>
    </div>
  ),
}));

// Mock de next/link (usado na nav)
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

const SESSION_OK = {
  representante: {
    id: 1,
    nome: 'João Rep',
    email: 'joao@rep.com',
    codigo: 'REP001',
    status: 'apto',
    tipo_pessoa: 'pf',
    telefone: null,
    aceite_termos: true,
    aceite_disclaimer_nv: true,
    aceite_politica_privacidade: true,
    criado_em: '2025-01-01',
    aprovado_em: '2025-01-02',
    precisa_trocar_senha: false,
  },
};

import {
  useRepresentante,
  RepContext,
} from '@/app/representante/(portal)/rep-context';

function Inspector() {
  const { session } = useRepresentante();
  return <span data-testid="nome">{session?.nome ?? 'null'}</span>;
}

describe('RepresentanteContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('useRepresentante retorna session null fora do provider', () => {
    render(<Inspector />);
    expect(screen.getByTestId('nome').textContent).toBe('null');
  });

  it('RepContext.Provider disponibiliza session customizada', () => {
    const session = SESSION_OK.representante;
    render(
      <RepContext.Provider
        value={{
          session,
          recarregarSessao: jest.fn(),
        }}
      >
        <Inspector />
      </RepContext.Provider>
    );
    expect(screen.getByTestId('nome').textContent).toBe('João Rep');
  });

  it('RepresentanteProvider redireciona para /login quando /api/representante/me falha', async () => {
    mockFetch.mockReturnValueOnce(
      Promise.resolve({ ok: false, status: 401 } as Response)
    );

    render(
      // @ts-expect-error - importar o Provider diretamente para o teste
      <RepresentanteProviderWrapper />
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('RepresentanteProvider redireciona para trocar-senha quando precisa_trocar_senha=true', async () => {
    const sessionNeedsTroca = {
      ...SESSION_OK.representante,
      precisa_trocar_senha: true,
    };
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ representante: sessionNeedsTroca }),
      } as Response)
    );

    render(
      // @ts-expect-error - importar o Provider diretamente
      <RepresentanteProviderWrapper />
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/representante/trocar-senha');
    });
  });

  it('RepresentanteProvider mostra modal quando política não aceita', async () => {
    const sessionNoPolicy = {
      ...SESSION_OK.representante,
      aceite_politica_privacidade: false,
      precisa_trocar_senha: false,
    };
    mockFetch.mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ representante: sessionNoPolicy }),
      } as Response)
    );

    render(
      // @ts-expect-error - importar o Provider diretamente
      <RepresentanteProviderWrapper />
    );

    await waitFor(() => {
      expect(screen.getByTestId('modal-termos-rep')).toBeInTheDocument();
    });
  });
});

// Componente wrapper separado para isolar o require
function RepresentanteProviderWrapper({
  children,
}: {
  children?: React.ReactNode;
}) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const {
    RepresentanteProvider,
  } = require('@/app/representante/(portal)/rep-context');
  return (
    <RepresentanteProvider>{children ?? <Inspector />}</RepresentanteProvider>
  );
}
