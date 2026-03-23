'use client';

/**
 * CriarSenhaVendedorForm — Client Component
 *
 * Fluxo:
 * 1. Lê ?token= da URL
 * 2. GET /api/vendedor/criar-senha?token= para validar
 * 3. Exibe formulário (ou estado de erro)
 * 4. POST /api/vendedor/criar-senha com { token, senha, confirmacao }
 * 5. Redireciona para /login com mensagem de sucesso
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Estado =
  | { fase: 'validando' }
  | { fase: 'formulario'; nome: string; email: string | null }
  | { fase: 'token_invalido' }
  | { fase: 'token_expirado' }
  | { fase: 'token_ja_usado' }
  | { fase: 'token_bloqueado' }
  | { fase: 'sucesso' }
  | { fase: 'erro_inesperado'; mensagem: string };

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

const FORCA_COLORS = [
  '',
  'bg-red-400',
  'bg-yellow-400',
  'bg-blue-400',
  'bg-green-500',
];

export default function CriarSenhaVendedorForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [estado, setEstado] = useState<Estado>({ fase: 'validando' });
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const forca = calcularForcaSenha(senha);

  const validarToken = useCallback(async () => {
    if (!token || token.length !== 64) {
      setEstado({ fase: 'token_invalido' });
      return;
    }
    try {
      const res = await fetch(
        `/api/vendedor/criar-senha?token=${encodeURIComponent(token)}`
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
      const res = await fetch('/api/vendedor/criar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha, confirmacao }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEstado({ fase: 'sucesso' });
        setTimeout(() => {
          router.push('/login?msg=senha_criada');
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

  const ERROS: Record<string, { titulo: string; descricao: string }> = {
    token_invalido: {
      titulo: 'Link inválido',
      descricao:
        'Este link de convite não é válido. Verifique o link ou solicite um novo ao seu representante.',
    },
    token_expirado: {
      titulo: 'Link expirado',
      descricao:
        'Este link de convite expirou (validade de 7 dias). Solicite um novo convite ao seu representante.',
    },
    token_ja_usado: {
      titulo: 'Link já utilizado',
      descricao:
        'Esta senha já foi criada com este link. Entre em contato com o seu representante se precisar de ajuda.',
    },
    token_bloqueado: {
      titulo: 'Link bloqueado',
      descricao:
        'Este link foi bloqueado por excesso de tentativas. Solicite um novo convite ao seu representante.',
    },
    erro_inesperado: {
      titulo: 'Erro inesperado',
      descricao:
        estado.fase === 'erro_inesperado'
          ? estado.mensagem
          : 'Tente novamente mais tarde.',
    },
  };

  if (estado.fase !== 'formulario') {
    const info = ERROS[estado.fase] ?? ERROS.erro_inesperado;
    return (
      <div className="flex flex-col items-center py-6 gap-3 text-center">
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
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center pb-2">
        <p className="text-sm text-gray-600">
          Olá, <strong>{estado.nome}</strong>!
        </p>
        {estado.email && (
          <p className="text-xs text-gray-400 mt-0.5">{estado.email}</p>
        )}
      </div>

      {erroForm && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {erroForm}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nova senha
        </label>
        <div className="relative">
          <input
            type={mostrarSenha ? 'text' : 'password'}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Mínimo 8 caracteres"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            {mostrarSenha ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {senha && (
          <div className="mt-2 space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    forca.pontos >= i
                      ? FORCA_COLORS[forca.pontos]
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">{forca.label}</p>
          </div>
        )}
        <ul className="mt-2 space-y-0.5 text-xs text-gray-500">
          <li className={senha.length >= 8 ? 'text-green-600' : ''}>
            ↳ Mínimo 8 caracteres
          </li>
          <li className={/[A-Z]/.test(senha) ? 'text-green-600' : ''}>
            ↳ Uma letra maiúscula
          </li>
          <li className={/[0-9]/.test(senha) ? 'text-green-600' : ''}>
            ↳ Um número
          </li>
        </ul>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Confirmar senha
        </label>
        <input
          type={mostrarSenha ? 'text' : 'password'}
          value={confirmacao}
          onChange={(e) => setConfirmacao(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Repita a senha"
        />
        {confirmacao && senha !== confirmacao && (
          <p className="text-xs text-red-500 mt-1">As senhas não conferem</p>
        )}
      </div>

      <button
        type="submit"
        disabled={enviando || !senha || !confirmacao}
        className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:ring-2 focus:ring-blue-400 focus:outline-none"
      >
        {enviando ? 'Criando senha...' : 'Criar senha'}
      </button>
    </form>
  );
}
