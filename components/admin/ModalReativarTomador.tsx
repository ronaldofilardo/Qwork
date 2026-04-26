'use client';

import { useState } from 'react';
import {
  CheckCircle,
  UserPlus,
  User,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface Tomador {
  id: string;
  tipo: 'clinica' | 'entidade';
  nome: string;
  cnpj: string;
  gestor: {
    nome: string;
    cpf: string;
    email: string;
    perfil: 'rh' | 'gestor';
  } | null;
}

interface NovoGestorCredenciais {
  cpf: string;
  nome: string;
  email: string;
  login: string;
  senha: string;
}

interface ModalReativarTomadorProps {
  tomador: Tomador;
  onCancel: () => void;
  onConfirm: (trocarGestor?: {
    cpf: string;
    nome: string;
    email: string;
  }) => Promise<NovoGestorCredenciais | null>;
}

export default function ModalReativarTomador({
  tomador,
  onCancel,
  onConfirm,
}: ModalReativarTomadorProps) {
  const [opcao, setOpcao] = useState<'manter' | 'trocar'>('manter');
  const [novoCpf, setNovoCpf] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [cpfIndisponivel, setCpfIndisponivel] = useState<string | null>(null);
  const [verificandoCpf, setVerificandoCpf] = useState(false);

  // Estado pós-sucesso com credenciais do novo gestor
  const [credenciais, setCredenciais] = useState<NovoGestorCredenciais | null>(
    null
  );
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [copiado, setCopiado] = useState<'login' | 'senha' | null>(null);

  const formatarCpf = (valor: string): string => {
    return valor.replace(/\D/g, '').slice(0, 11);
  };

  const cpfValido = novoCpf.replace(/\D/g, '').length === 11;
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail);

  const handleNovoCpfBlur = async () => {
    const cpfLimpo = novoCpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) return;
    setVerificandoCpf(true);
    try {
      const res = await fetch(`/api/utils/verificar-cpf?cpf=${cpfLimpo}`);
      if (res.ok) {
        const data = await res.json();
        setCpfIndisponivel(
          data.disponivel
            ? null
            : (data.motivo ?? 'CPF já cadastrado no sistema')
        );
      }
    } catch {
      // silencioso
    } finally {
      setVerificandoCpf(false);
    }
  };

  const formularioValido =
    opcao === 'manter' ||
    (opcao === 'trocar' &&
      cpfValido &&
      !cpfIndisponivel &&
      novoNome.trim().length > 0 &&
      emailValido);

  const copiarParaClipboard = async (
    texto: string,
    tipo: 'login' | 'senha'
  ) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(tipo);
      setTimeout(() => setCopiado(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  const handleConfirmar = async () => {
    if (!formularioValido) return;

    setErro('');
    setEnviando(true);

    try {
      const trocarGestor =
        opcao === 'trocar'
          ? {
              cpf: novoCpf.replace(/\D/g, ''),
              nome: novoNome.trim(),
              email: novoEmail.trim(),
            }
          : undefined;

      const resultado = await onConfirm(trocarGestor);

      if (resultado) {
        // Exibir credenciais do novo gestor
        setCredenciais(resultado);
      } else if (opcao === 'manter') {
        // Reativação simples sem troca — fechar
        onCancel();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErro(err.message);
      } else {
        setErro('Erro ao reativar. Tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  };

  const tipoLabel = tomador.tipo === 'clinica' ? 'Clínica' : 'Entidade';
  const gestorLabel = tomador.tipo === 'clinica' ? 'Gestor RH' : 'Gestor';

  // Tela de credenciais do novo gestor (pós-sucesso)
  if (credenciais) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onCancel}
      >
        <div
          className="bg-white rounded-xl shadow-xl max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="text-center mb-5">
              <div className="mx-auto w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {tipoLabel} Reativada!
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Novo {gestorLabel.toLowerCase()} designado com sucesso
              </p>
            </div>

            {/* Dados do novo gestor */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4">
              <div>
                <span className="text-xs text-gray-500 font-medium">Nome</span>
                <p className="text-sm font-semibold text-gray-900">
                  {credenciais.nome}
                </p>
              </div>
              <div>
                <span className="text-xs text-gray-500 font-medium">Email</span>
                <p className="text-sm text-gray-700">{credenciais.email}</p>
              </div>
            </div>

            {/* Credenciais */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-800">
                  Credenciais de Acesso
                </span>
              </div>
              <p className="text-xs text-amber-700 mb-3">
                Anote estas credenciais — a senha só será exibida uma vez. O
                novo gestor será solicitado a trocar a senha no primeiro acesso.
              </p>

              {/* Login */}
              <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 mb-2 border border-amber-200">
                <div>
                  <span className="text-xs text-gray-500">Login (CPF)</span>
                  <p className="text-sm font-mono font-semibold text-gray-900">
                    {credenciais.login}
                  </p>
                </div>
                <button
                  onClick={() =>
                    copiarParaClipboard(credenciais.login, 'login')
                  }
                  className="p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Copiar login"
                >
                  {copiado === 'login' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Senha */}
              <div className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-amber-200">
                <div>
                  <span className="text-xs text-gray-500">
                    Senha Provisória
                  </span>
                  <p className="text-sm font-mono font-semibold text-gray-900">
                    {senhaVisivel ? credenciais.senha : '••••••'}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSenhaVisivel(!senhaVisivel)}
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                    title={senhaVisivel ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {senhaVisivel ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      copiarParaClipboard(credenciais.senha, 'senha')
                    }
                    className="p-1.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Copiar senha"
                  >
                    {copiado === 'senha' ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={onCancel}
              className="w-full py-2.5 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tela principal do modal
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Reativar {tipoLabel}
              </h2>
              <p className="text-sm text-gray-600 mt-0.5">{tomador.nome}</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
              aria-label="Fechar"
            >
              &times;
            </button>
          </div>

          {/* Gestor atual */}
          <div className="bg-gray-50 rounded-lg p-4 mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              {gestorLabel} Atual
            </h3>
            {tomador.gestor ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {tomador.gestor.nome}
                </p>
                <p className="text-xs text-gray-600">
                  CPF: {tomador.gestor.cpf}
                </p>
                <p className="text-xs text-gray-600">{tomador.gestor.email}</p>
              </div>
            ) : (
              <p className="text-sm text-amber-600">Sem gestor vinculado</p>
            )}
          </div>

          {/* Opções */}
          <div className="space-y-3 mb-5">
            {/* Manter gestor */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                opcao === 'manter'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="opcao-gestor"
                value="manter"
                checked={opcao === 'manter'}
                onChange={() => setOpcao('manter')}
                className="mt-0.5 accent-green-600"
              />
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Manter o mesmo gestor
                  </span>
                  <p className="text-xs text-gray-500">
                    Reativa com as mesmas credenciais de acesso
                  </p>
                </div>
              </div>
            </label>

            {/* Trocar gestor */}
            <label
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                opcao === 'trocar'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="opcao-gestor"
                value="trocar"
                checked={opcao === 'trocar'}
                onChange={() => setOpcao('trocar')}
                className="mt-0.5 accent-blue-600"
              />
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Designar novo gestor
                  </span>
                  <p className="text-xs text-gray-500">
                    Desativa o gestor anterior e cria credenciais para o novo
                  </p>
                </div>
              </div>
            </label>
          </div>

          {/* Formulário do novo gestor */}
          {opcao === 'trocar' && (
            <div className="space-y-3 mb-5 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Dados do Novo {gestorLabel}
              </h3>

              <div>
                <label
                  htmlFor="novo-cpf"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  CPF
                </label>
                <input
                  id="novo-cpf"
                  type="text"
                  inputMode="numeric"
                  value={novoCpf}
                  onChange={(e) => {
                    setNovoCpf(formatarCpf(e.target.value));
                    setCpfIndisponivel(null);
                  }}
                  onBlur={handleNovoCpfBlur}
                  placeholder="00000000000"
                  maxLength={11}
                  className={`block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    cpfIndisponivel
                      ? 'border-red-400'
                      : novoCpf.length > 0 && !cpfValido
                        ? 'border-red-300'
                        : 'border-gray-300'
                  }`}
                />
                {verificandoCpf && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Verificando CPF...
                  </p>
                )}
                {cpfIndisponivel && (
                  <p className="text-xs text-red-500 mt-0.5">
                    {cpfIndisponivel}
                  </p>
                )}
                {!cpfIndisponivel && novoCpf.length > 0 && !cpfValido && (
                  <p className="text-xs text-red-500 mt-0.5">
                    CPF deve ter 11 dígitos
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="novo-nome"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Nome Completo
                </label>
                <input
                  id="novo-nome"
                  type="text"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Nome do novo gestor"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="novo-email"
                  className="block text-xs font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="novo-email"
                  type="email"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className={`block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    novoEmail.length > 0 && !emailValido
                      ? 'border-red-300'
                      : 'border-gray-300'
                  }`}
                />
                {novoEmail.length > 0 && !emailValido && (
                  <p className="text-xs text-red-500 mt-0.5">Email inválido</p>
                )}
              </div>
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div className="text-red-700 text-sm bg-red-50 p-3 rounded-lg border border-red-200 mb-4">
              {erro}
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={enviando}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!formularioValido || enviando}
              className="flex-1 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Processando...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Reativar
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
