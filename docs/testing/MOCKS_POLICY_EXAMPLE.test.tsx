/**
 * Exemplo de Teste Seguindo a Política de Mocks
 *
 * Este arquivo demonstra como aplicar corretamente a Política de Mocks
 * documentada em docs/testing/MOCKS_POLICY.md
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// import LoginForm from '@/components/LoginForm'; // Componente exemplo não existe
import {
  mockFetchResponse,
  mockRouter,
  setupPWAMocks,
} from '@/__tests__/lib/test-helpers';

// Componente exemplo inline para demonstração
function LoginForm() {
  return (
    <div>
      <input aria-label="email" placeholder="Email" />
      <input aria-label="senha" type="password" placeholder="Senha" />
      <button>Entrar</button>
    </div>
  );
}

// Configuração global dos mocks
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

describe('LoginForm - Exemplo de Política de Mocks', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    // ✅ Limpeza obrigatória entre testes
    jest.clearAllMocks();

    // Setup de mocks PWA se necessário
    setupPWAMocks();

    // ✅ Mock consistente para fetch
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  });

  describe('Cenários de Sucesso', () => {
    it('deve fazer login com credenciais válidas', async () => {
      // ✅ Padrão correto: mockImplementationOnce para controle preciso
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(
          mockFetchResponse({
            success: true,
            user: { id: 1, nome: 'João Silva' },
          })
        )
      );

      render(<LoginForm />);

      // Ações do usuário
      await userEvent.type(screen.getByLabelText(/email/i), 'joao@teste.com');
      await userEvent.type(screen.getByLabelText(/senha/i), '123456');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      // ✅ Usa waitFor para assincronia
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'joao@teste.com',
            senha: '123456',
          }),
        });
      });

      // ✅ Verificação robusta com papel semântico
      expect(
        screen.getByRole('button', { name: /entrando\.\.\./i })
      ).toBeInTheDocument();
    });
  });

  describe('Cenários de Erro', () => {
    it('deve mostrar erro para credenciais inválidas', async () => {
      // ✅ Padrão correto para cenários de erro
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve(
          mockFetchResponse(
            {
              success: false,
              error: 'Credenciais inválidas',
            },
            401
          )
        )
      );

      render(<LoginForm />);

      await userEvent.type(
        screen.getByLabelText(/email/i),
        'invalido@teste.com'
      );
      await userEvent.type(screen.getByLabelText(/senha/i), 'wrong');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      // ✅ Espera assíncrona com waitFor
      await waitFor(() => {
        expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
      });

      // ✅ Verifica que não navegou
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('deve tratar erro de rede', async () => {
      // ✅ Padrão correto para erros de rede
      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error('Falha na conexão'))
      );

      render(<LoginForm />);

      await userEvent.type(screen.getByLabelText(/email/i), 'joao@teste.com');
      await userEvent.type(screen.getByLabelText(/senha/i), '123456');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.getByText(/erro.*conexão/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cenários de Loading', () => {
    it('deve mostrar estado de loading durante requisição', async () => {
      // ✅ Mock que simula delay para testar loading
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockFetchResponse({ success: true })), 100)
          )
      );

      render(<LoginForm />);

      await userEvent.type(screen.getByLabelText(/email/i), 'joao@teste.com');
      await userEvent.type(screen.getByLabelText(/senha/i), '123456');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      // ✅ Verifica loading imediatamente
      expect(
        screen.getByRole('button', { name: /entrando\.\.\./i })
      ).toBeInTheDocument();

      // ✅ Aguarda resolução
      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: /entrando\.\.\./i })
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Validações de Componente', () => {
    it('deve desabilitar botão com campos vazios', () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /entrar/i });

      // ✅ Verificação de estado inicial
      expect(submitButton).toBeDisabled();

      // Preenche apenas email
      userEvent.type(screen.getByLabelText(/email/i), 'joao@teste.com');

      // ✅ Ainda deve estar desabilitado
      expect(submitButton).toBeDisabled();

      // Preenche senha
      userEvent.type(screen.getByLabelText(/senha/i), '123456');

      // ✅ Agora deve estar habilitado
      expect(submitButton).toBeEnabled();
    });
  });
});

/**
 * ❌ EXEMPLOS DE ANTI-PADRÕES (NÃO USE!)
 */

/*
// ❌ Mock inconsistente - pode falhar (NÃO USE ESTE PADRÃO)
// const badMock = () => mockFetch.mockResolvedValueOnce({ ok: true });

// ❌ Espera frágil - depende de texto exato
expect(screen.getByText('Entrando...')).toBeInTheDocument();

// ❌ Sem limpeza de mocks - pode causar interferência
// beforeEach sem jest.clearAllMocks()

// ❌ Sem waitFor para operações assíncronas
expect(mockFetch).toHaveBeenCalled(); // Pode executar antes da chamada

// ❌ Componente não renderizado - efeitos não executados
// render() faltando para componentes que precisam de setup
*/
