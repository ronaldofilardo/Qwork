import React from 'react';
import { render, waitFor } from '@testing-library/react';
import EntidadeLayout from '@/app/entidade/layout';

// Mock useRouter push
const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/entidade',
}));

afterEach(() => {
  jest.clearAllMocks();
  // restore fetch
  // @ts-ignore
  if (global.fetch && global.fetch.mockRestore) global.fetch.mockRestore();
});

test('Entidade layout redireciona para login se perfil incorreto', async () => {
  // Mock session endpoint returning perfil 'rh'
  // @ts-ignore
  global.fetch = jest.fn((url: RequestInfo) => {
    if (String(url).endsWith('/api/auth/session')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({ cpf: '123', nome: 'Usuário RH', perfil: 'rh' }),
          { status: 200 }
        )
      );
    }
    return Promise.resolve(new Response('{}', { status: 200 }));
  });

  render(<EntidadeLayout>{<div>conteudo</div>}</EntidadeLayout>);

  await waitFor(() => {
    expect(pushMock).toHaveBeenCalledWith('/login');
  });
});

test('Entidade layout aceita gestor_entidade e carrega conteudo', async () => {
  // @ts-ignore
  global.fetch = jest.fn((url: RequestInfo) => {
    if (String(url).endsWith('/api/auth/session')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            cpf: '87545772920',
            nome: 'RONALDO',
            perfil: 'gestor_entidade',
          }),
          { status: 200 }
        )
      );
    }
    // Simulate other APIs used by loadCounts
    if (String(url).endsWith('/api/entidade/notificacoes')) {
      return Promise.resolve(
        new Response(JSON.stringify({ totalNaoLidas: 0 }), { status: 200 })
      );
    }
    return Promise.resolve(new Response(JSON.stringify({}), { status: 200 }));
  });

  const { getByText } = render(
    <EntidadeLayout>{<div>conteudo</div>}</EntidadeLayout>
  );

  await waitFor(() => {
    expect(getByText('conteudo')).toBeInTheDocument();
  });

  expect(pushMock).not.toHaveBeenCalled();
});
