'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QworkLogo from '@/components/QworkLogo';
import ModalCadastrotomador from '@/components/modals/ModalCadastrotomador';
import ModalConfirmacaoIdentidade from '@/components/modals/ModalConfirmacaoIdentidade';
import ModalTermosAceite from '@/components/modals/ModalTermosAceite';
import { Building2 } from 'lucide-react';

export default function LoginPage() {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConfirmingIdentity, setIsConfirmingIdentity] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [showConfirmacaoModal, setShowConfirmacaoModal] = useState(false);
  const [showTermosModal, setShowTermosModal] = useState(false);
  const [dadosConfirmacao, setDadosConfirmacao] = useState<{
    nome: string;
    cpf: string;
    dataNascimento: string;
  } | null>(null);
  const [redirectTo, setRedirectTo] = useState('');
  const _router = useRouter();

  const formatarCPF = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    return apenasNumeros.slice(0, 11);
  };

  const formatarDataNascimento = (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, '');
    return apenasNumeros.slice(0, 8); // ddmmaaaa
  };

  const handleConfirmarIdentidade = async () => {
    if (!dadosConfirmacao) return;

    setIsConfirmingIdentity(true);

    try {
      // Garantir que dataNascimento esteja em YYYY-MM-DD
      let dataFormatada = dadosConfirmacao.dataNascimento;
      if (dataFormatada.includes('/')) {
        // Converter DD/MM/YYYY para YYYY-MM-DD
        const partes = dataFormatada.split('/');
        if (partes.length === 3) {
          dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
      } else if (dataFormatada.includes('T')) {
        // Se for ISO string, extrair apenas a parte de data
        dataFormatada = dataFormatada.split('T')[0];
      }

      const response = await fetch('/api/avaliacao/confirmar-identidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avaliacaoId: null, // Não há avaliação no contexto de login
          nome: dadosConfirmacao.nome,
          cpf: dadosConfirmacao.cpf,
          dataNascimento: dataFormatada,
        }),
        credentials: 'same-origin',
      });

      if (response.ok) {
        console.log('[LOGIN] Identidade confirmada - redirecionando');
        // NÃO fechar o modal - deixar UI congelada com loading até o redirecionamento
        // O setTimeout garante que o redirecionamento aconteça após a UI estar pronta
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 500);
      } else {
        const errorData = await response.json();
        setIsConfirmingIdentity(false);
        setError(
          errorData.error || 'Erro ao confirmar identidade. Tente novamente.'
        );
      }
    } catch (err) {
      console.error('[LOGIN] Erro ao confirmar identidade:', err);
      setIsConfirmingIdentity(false);
      setError('Erro de conexão ao confirmar identidade. Tente novamente.');
    }
  };

  const handleCancelarConfirmacao = () => {
    setShowConfirmacaoModal(false);
    setDadosConfirmacao(null);
    setRedirectTo('');
    setCpf('');
    setSenha('');
    setDataNascimento('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Enviar senha ou data de nascimento
      const body: any = { cpf };
      if (senha) {
        body.senha = senha;
      }
      if (dataNascimento) {
        body.data_nascimento = dataNascimento;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'same-origin',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
      }

      // Esperar confirmação da sessão antes de redirecionar (garante cookie aplicado)
      const maxRetries = 4;
      for (let i = 0; i < maxRetries; i++) {
        try {
          const s = await fetch('/api/auth/session', {
            credentials: 'same-origin',
            cache: 'no-store',
          });
          if (s.ok) {
            break;
          }
        } catch {
          // ignore and retry
        }
        // pequeno atraso antes da próxima tentativa
        await new Promise((r) => setTimeout(r, 150));
      }

      // Se é funcionário, mostrar modal de confirmação de identidade
      if (data.perfil === 'funcionario') {
        console.log(
          '[LOGIN] Funcionário detectado - mostrar modal de confirmação'
        );

        // Buscar dados completos do funcionário incluindo data de nascimento
        try {
          const funcRes = await fetch(
            `/api/funcionarios/${cpf.replace(/\D/g, '')}`,
            {
              credentials: 'same-origin',
            }
          );

          if (funcRes.ok) {
            const funcData = await funcRes.json();
            setDadosConfirmacao({
              nome: funcData.nome || data.nome || 'Funcionário',
              cpf: cpf.replace(/\D/g, ''),
              dataNascimento: funcData.data_nascimento || '',
            });
          } else {
            // Se falhar, usar dados do login
            setDadosConfirmacao({
              nome: data.nome || 'Funcionário',
              cpf: cpf.replace(/\D/g, ''),
              dataNascimento: data.data_nascimento || '',
            });
          }
        } catch (err) {
          console.warn('[LOGIN] Erro ao buscar dados do funcionário:', err);
          setDadosConfirmacao({
            nome: data.nome || 'Funcionário',
            cpf: cpf.replace(/\D/g, ''),
            dataNascimento: data.data_nascimento || '',
          });
        }

        // Guardar URL de redirecionamento e mostrar modal
        setRedirectTo(data.redirectTo || '/dashboard');
        setShowConfirmacaoModal(true);
      } else if (
        (data.perfil === 'rh' || data.perfil === 'gestor') &&
        data.termosPendentes
      ) {
        // Verificar se precisa aceitar termos (apenas rh e gestor)
        const { termos_uso, politica_privacidade } = data.termosPendentes;

        if (termos_uso || politica_privacidade) {
          // Tem termos pendentes - mostrar modal
          console.log(
            '[LOGIN] Termos pendentes detectados - mostrar modal de aceite'
          );
          setRedirectTo(data.redirectTo || '/dashboard');
          setShowTermosModal(true);
          setLoading(false);
          return;
        }

        // Se não há termos pendentes, redirecionar normal
        const targetUrl = data.redirectTo || '/dashboard';
        console.log(
          '[LOGIN] Redirecionando para:',
          targetUrl,
          'Perfil:',
          data.perfil
        );
        window.location.href = targetUrl;
      } else {
        // Para outros perfis, redirecionar normalmente
        const targetUrl = data.redirectTo || '/dashboard';
        console.log(
          '[LOGIN] Redirecionando para:',
          targetUrl,
          'Perfil:',
          data.perfil
        );
        window.location.href = targetUrl;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-2 sm:p-4">
      {/* Modal de Confirmação de Identidade */}
      {showConfirmacaoModal && dadosConfirmacao && (
        <ModalConfirmacaoIdentidade
          isOpen={true}
          isLoading={isConfirmingIdentity}
          onConfirm={handleConfirmarIdentidade}
          onCancel={handleCancelarConfirmacao}
          nome={dadosConfirmacao.nome}
          cpf={dadosConfirmacao.cpf}
          dataNascimento={dadosConfirmacao.dataNascimento}
        />
      )}

      {/* Modal de Aceite de Termos */}
      {showTermosModal && (
        <ModalTermosAceite
          redirectTo={redirectTo}
          onConcluir={() => {
            setShowTermosModal(false);
            window.location.href = redirectTo;
          }}
        />
      )}

      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <QworkLogo size="2xl" showSlogan={false} className="mb-4" />
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Avaliação Psicossocial baseada no COPSOQ III
          </p>
        </div>

        {/* Box Explicativo de Formas de Login */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            Como Fazer Login?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 mt-0.5">1</span>
              <span>
                <strong>Com Senha</strong> - Todos os usuários (RH, Gestor,
                Emissor, etc.): insira seu CPF e Senha
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-blue-600 mt-0.5">2</span>
              <span>
                <strong>Com Data de Nascimento</strong> - Funcionários: insira
                seu CPF e Data de Nascimento (deixar o campo Senha em branco)
              </span>
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="cpf"
              className="block text-sm font-medium text-gray-700 required"
            >
              CPF
            </label>
            <input
              id="cpf"
              name="cpf"
              type="text"
              value={cpf}
              onChange={(e) =>
                setCpf(formatarCPF((e.target as HTMLInputElement).value))
              }
              placeholder="00000000000"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base"
              required
              maxLength={11}
              disabled={showConfirmacaoModal}
            />
          </div>

          <div>
            <label
              htmlFor="senha"
              className="block text-sm font-medium text-gray-700"
            >
              Senha{' '}
              <span className="text-gray-500 font-normal">
                (opcional se for funcionário)
              </span>
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha((e.target as HTMLInputElement).value)}
              placeholder="••••••••"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base"
              disabled={showConfirmacaoModal}
            />
          </div>

          <div>
            <label
              htmlFor="dataNascimento"
              className="block text-sm font-medium text-gray-700"
            >
              Data de nascimento{' '}
              <span className="text-gray-500 font-normal">
                (opcional se tiver senha)
              </span>
            </label>
            <input
              id="dataNascimento"
              name="dataNascimento"
              type="text"
              value={dataNascimento}
              onChange={(e) =>
                setDataNascimento(
                  formatarDataNascimento((e.target as HTMLInputElement).value)
                )
              }
              placeholder="ddmmaaaa"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base"
              maxLength={8}
              disabled={showConfirmacaoModal}
            />
            <p className="mt-2 text-xs text-gray-500">
              Use este formato: dia/mês/ano (ex: 15031990)
            </p>
          </div>

          {error && (
            <div className="text-danger text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || showConfirmacaoModal}
            className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 sm:mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Ou cadastre-se
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => setModalAberto(true)}
              disabled={showConfirmacaoModal}
              className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 border border-orange-300 rounded-md shadow-sm bg-white text-sm font-medium text-orange-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Building2 className="w-5 h-5" />
              <span>Cadastrar Empresa</span>
            </button>
          </div>
        </div>
      </div>

      <ModalCadastrotomador
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />
    </div>
  );
}
