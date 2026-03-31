'use client';

/**
 * CriarSenhaForm — Client Component
 *
 * Fluxo:
 * 1. Lê ?token= da URL
 * 2. GET /api/representante/criar-senha?token= para validar
 * 3. Exibe formulário (ou estado de erro)
 * 4. POST /api/representante/criar-senha com { token, senha, confirmacao }
 * 5. Redireciona para /representante/login com mensagem de sucesso
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Estado =
  | { fase: 'validando' }
  | { fase: 'formulario'; nome: string; email: string }
  | { fase: 'token_invalido' }
  | { fase: 'token_expirado' }
  | { fase: 'token_ja_usado' }
  | { fase: 'token_bloqueado' }
  | { fase: 'sucesso' }
  | { fase: 'erro_inesperado'; mensagem: string };

// ---------- Helpers ----------

function calcularForcaSenha(senha: string): { pontos: number; label: string } {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (senha.length >= 12) pontos++;
  if (/[A-Z]/.test(senha)) pontos++;
  if (/[0-9]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;

  const labels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte'];
  return { pontos: Math.min(pontos, 4), label: labels[Math.min(pontos, 4)] };
}

export default function CriarSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [estado, setEstado] = useState<Estado>({ fase: 'validando' });
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  // Calcular força da senha
  const forca = calcularForcaSenha(senha);

  const validarToken = useCallback(async () => {
    if (!token || token.length !== 64) {
      setEstado({ fase: 'token_invalido' });
      return;
    }

    try {
      const res = await fetch(
        `/api/representante/criar-senha?token=${encodeURIComponent(token)}`
      );
      const data = await res.json();

      if (data.valido) {
        setEstado({ fase: 'formulario', nome: data.nome, email: data.email });
      } else {
        const motivo = data.motivo as string;
        if (motivo === 'token_expirado') setEstado({ fase: 'token_expirado' });
        else if (motivo === 'token_ja_usado')
          setEstado({ fase: 'token_ja_usado' });
        else if (motivo === 'token_bloqueado')
          setEstado({ fase: 'token_bloqueado' });
        else setEstado({ fase: 'token_invalido' });
      }
    } catch {
      setEstado({
        fase: 'erro_inesperado',
        mensagem: 'Erro ao validar o link. Tente novamente.',
      });
    }
  }, [token]);

  useEffect(() => {
    validarToken();
  }, [validarToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    // Validação client-side
    if (senha.length < 8) {
      setErroForm('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (!/[A-Z]/.test(senha)) {
      setErroForm('A senha deve conter pelo menos uma letra maiúscula.');
      return;
    }
    if (!/[0-9]/.test(senha)) {
      setErroForm('A senha deve conter pelo menos um número.');
      return;
    }
    if (senha !== confirmacao) {
      setErroForm('A senha e a confirmação não conferem.');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/representante/criar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha, confirmacao }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEstado({ fase: 'sucesso' });
        // Redirecionar após 2s
        setTimeout(() => {
          router.push('/representante/login?msg=senha_criada');
        }, 2000);
      } else {
        setErroForm(data.error ?? 'Erro ao criar senha. Tente novamente.');
      }
    } catch {
      setErroForm('Erro de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  // ---------- Renderização por fase ----------

  if (estado.fase === 'validando') {
    return (
      <div className="flex flex-col items-center py-8 gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Validando link de convite...</p>
      </div>
    );
  }

  if (estado.fase === 'sucesso') {
    return (
      <div className="flex flex-col items-center py-8 gap-3 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Senha criada!</h3>
        <p className="text-sm text-gray-500">Redirecionando para o login...</p>
      </div>
    );
  }

  if (estado.fase !== 'formulario') {
    const mensagens: Record<string, { titulo: string; descricao: string }> = {
      token_invalido: {
        titulo: 'Link inválido',
        descricao:
          'Este link de convite não é válido. Verifique o link ou solicite um novo ao administrador.',
      },
      token_expirado: {
        titulo: 'Link expirado',
        descricao:
          'Este link de convite expirou (validade de 7 dias). Solicite um novo convite ao administrador.',
      },
      token_ja_usado: {
        titulo: 'Link já utilizado',
        descricao:
          'Esta senha já foi criada com este link. Caso precise recuperar o acesso, entre em contato com o administrador.',
      },
      token_bloqueado: {
        titulo: 'Link bloqueado',
        descricao:
          'Este link foi bloqueado por excesso de tentativas. Solicite um novo convite ao administrador.',
      },
      erro_inesperado: {
        titulo: 'Erro inesperado',
        descricao:
          estado.fase === 'erro_inesperado'
            ? estado.mensagem
            : 'Tente novamente mais tarde.',
      },
    };

    const info = mensagens[estado.fase] ?? mensagens.token_invalido;

    return (
      <div className="flex flex-col items-center py-8 gap-3 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{info.titulo}</h3>
        <p className="text-sm text-gray-500 max-w-xs">{info.descricao}</p>
        <a
          href="/representante/login"
          className="mt-4 text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Ir para o login
        </a>
      </div>
    );
  }

  // FASE: formulario
  const { nome, email } = estado;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Identificação */}
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-sm font-medium text-blue-900">Olá, {nome}!</p>
        <p className="text-xs text-blue-700 mt-0.5">
          Criando senha para: <strong>{email}</strong>
        </p>
      </div>

      {/* Campo senha */}
      <div>
        <label
          htmlFor="senha"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nova senha
        </label>
        <div className="relative">
          <input
            id="senha"
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Mínimo 8 caracteres"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            {mostrarSenha ? (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Indicador de força */}
        {senha.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    forca.pontos >= n
                      ? forca.pontos <= 1
                        ? 'bg-red-400'
                        : forca.pontos <= 2
                          ? 'bg-yellow-400'
                          : forca.pontos <= 3
                            ? 'bg-blue-400'
                            : 'bg-green-400'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">{forca.label}</p>
            <ul className="text-xs space-y-0.5">
              <li
                className={
                  senha.length >= 8 ? 'text-green-600' : 'text-gray-400'
                }
              >
                {senha.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
              </li>
              <li
                className={
                  /[A-Z]/.test(senha) ? 'text-green-600' : 'text-gray-400'
                }
              >
                {/[A-Z]/.test(senha) ? '✓' : '○'} Uma letra maiúscula
              </li>
              <li
                className={
                  /[0-9]/.test(senha) ? 'text-green-600' : 'text-gray-400'
                }
              >
                {/[0-9]/.test(senha) ? '✓' : '○'} Um número
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Campo confirmação */}
      <div>
        <label
          htmlFor="confirmacao"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirmar senha
        </label>
        <input
          id="confirmacao"
          type={mostrarSenha ? 'text' : 'password'}
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          required
          autoComplete="new-password"
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            confirmacao && confirmacao !== senha
              ? 'border-red-300 bg-red-50'
              : 'border-gray-300'
          }`}
          placeholder="Repita a senha"
        />
        {confirmacao && confirmacao !== senha && (
          <p className="text-xs text-red-500 mt-1">As senhas não conferem</p>
        )}
      </div>

      {/* Erro geral */}
      {erroForm && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{erroForm}</p>
        </div>
      )}

      {/* Botão */}
      <button
        type="submit"
        disabled={enviando || senha !== confirmacao || senha.length < 8}
        className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {enviando ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Criando senha...
          </span>
        ) : (
          'Criar senha e acessar portal'
        )}
      </button>
    </form>
  );
}
