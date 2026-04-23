'use client';

/**
 * ResetarSenhaForm — Client Component
 *
 * Fluxo:
 * 1. Lê ?token= da URL
 * 2. GET /api/admin/reset-senha/validar?token= para validar o token
 * 3. Exibe formulário (ou estado de erro)
 * 4. POST /api/admin/reset-senha/confirmar com { token, senha, confirmacao }
 * 5. Exibe mensagem de sucesso com link para o login
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, Check, X, ShieldCheck } from 'lucide-react';
import QworkLogo from '@/components/QworkLogo';
import Link from 'next/link';

type Estado =
  | { fase: 'validando' }
  | { fase: 'formulario'; nome: string; perfil: string }
  | { fase: 'token_invalido' }
  | { fase: 'token_expirado' }
  | { fase: 'token_ja_usado' }
  | { fase: 'token_bloqueado' }
  | { fase: 'sucesso' }
  | { fase: 'erro_inesperado'; mensagem: string };

const SENHA_MIN_LENGTH = 8;

const requisitos = [
  {
    id: 'length',
    label: 'Mínimo de 8 caracteres',
    test: (s: string) => s.length >= SENHA_MIN_LENGTH,
  },
  {
    id: 'upper',
    label: 'Ao menos uma letra maiúscula',
    test: (s: string) => /[A-Z]/.test(s),
  },
  {
    id: 'lower',
    label: 'Ao menos uma letra minúscula',
    test: (s: string) => /[a-z]/.test(s),
  },
  {
    id: 'number',
    label: 'Ao menos um número',
    test: (s: string) => /\d/.test(s),
  },
];

const perfilLabels: Record<string, string> = {
  suporte: 'Suporte',
  comercial: 'Comercial',
  rh: 'RH',
  gestor: 'Gestor',
  emissor: 'Emissor de Laudos',
  representante: 'Representante',
};

export default function ResetarSenhaForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [estado, setEstado] = useState<Estado>({ fase: 'validando' });
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const todasAtendidas = requisitos.every((r) => r.test(senha)) && senha === confirmacao;

  const validarToken = useCallback(async () => {
    if (!token || token.length !== 64) {
      setEstado({ fase: 'token_invalido' });
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/reset-senha/validar?token=${encodeURIComponent(token)}`
      );
      const data = await res.json();

      if (data.valido) {
        setEstado({ fase: 'formulario', nome: data.nome, perfil: data.perfil });
      } else {
        const motivo = data.motivo as string;
        if (motivo === 'token_expirado') setEstado({ fase: 'token_expirado' });
        else if (motivo === 'token_ja_usado') setEstado({ fase: 'token_ja_usado' });
        else if (motivo === 'token_bloqueado') setEstado({ fase: 'token_bloqueado' });
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

    if (!todasAtendidas) {
      setErroForm('Verifique todos os requisitos de senha.');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/admin/reset-senha/confirmar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha, confirmacao }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setEstado({ fase: 'sucesso' });
      } else {
        setErroForm(data.error ?? 'Erro ao definir a senha. Tente novamente.');
      }
    } catch {
      setErroForm('Erro de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  // ─── Estados de UI ────────────────────────────────────────────────────────

  if (estado.fase === 'validando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Validando link...</p>
        </div>
      </div>
    );
  }

  if (estado.fase === 'sucesso') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Senha criada com sucesso!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Sua nova senha foi definida. Agora você já pode fazer login no sistema.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-hover transition-colors"
          >
            Ir para o Login
          </Link>
        </div>
      </div>
    );
  }

  if (estado.fase !== 'formulario') {
    const mensagens: Record<string, { titulo: string; descricao: string }> = {
      token_invalido: {
        titulo: 'Link inválido',
        descricao:
          'Este link de reset não é válido. Verifique o link ou solicite um novo ao administrador.',
      },
      token_expirado: {
        titulo: 'Link expirado',
        descricao:
          'Este link expirou (validade de 7 dias). Solicite um novo reset ao administrador.',
      },
      token_ja_usado: {
        titulo: 'Link já utilizado',
        descricao:
          'Este link já foi usado. Caso precise redefinir a senha novamente, entre em contato com o administrador.',
      },
      token_bloqueado: {
        titulo: 'Link bloqueado',
        descricao:
          'Este link foi bloqueado por excesso de tentativas. Solicite um novo reset ao administrador.',
      },
      erro_inesperado: {
        titulo: 'Erro inesperado',
        descricao:
          estado.fase === 'erro_inesperado'
            ? estado.mensagem
            : 'Ocorreu um erro inesperado.',
      },
    };

    const msg = mensagens[estado.fase] ?? mensagens.token_invalido;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{msg.titulo}</h2>
          <p className="text-sm text-gray-500">{msg.descricao}</p>
        </div>
      </div>
    );
  }

  // ─── Formulário principal ─────────────────────────────────────────────────

  const { nome, perfil } = estado;
  const perfilLabel = perfilLabels[perfil] ?? perfil;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-center mb-6">
          <QworkLogo className="h-8" />
        </div>

        <div className="mb-6 text-center">
          <div className="w-12 h-12 bg-accent/15 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6 text-accent-hover" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Criar nova senha</h1>
          <p className="text-sm text-gray-500 mt-1">
            Olá, <span className="font-medium text-gray-700">{nome}</span>
          </p>
          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-accent/15 text-accent-hover rounded-full">
            {perfilLabel}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nova senha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={mostrarConfirmacao ? 'text' : 'password'}
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Repita a senha"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setMostrarConfirmacao((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {mostrarConfirmacao ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Requisitos */}
          {senha.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              {requisitos.map((r) => {
                const ok = r.test(senha);
                return (
                  <div key={r.id} className="flex items-center gap-2 text-xs">
                    {ok ? (
                      <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                    )}
                    <span className={ok ? 'text-green-700' : 'text-gray-500'}>{r.label}</span>
                  </div>
                );
              })}
              {confirmacao.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {senha === confirmacao ? (
                    <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                  )}
                  <span
                    className={
                      senha === confirmacao ? 'text-green-700' : 'text-gray-500'
                    }
                  >
                    Senhas iguais
                  </span>
                </div>
              )}
            </div>
          )}

          {erroForm && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{erroForm}</p>
          )}

          <button
            type="submit"
            disabled={!todasAtendidas || enviando}
            className="w-full py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enviando ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
