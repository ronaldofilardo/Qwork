'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QworkLogo from '@/components/QworkLogo';
import ModalCadastrotomador from '@/components/modals/ModalCadastrotomador';
import ModalBoasVindasCadastro from '@/components/modals/ModalBoasVindasCadastro';
import ModalConfirmacaoIdentidade from '@/components/modals/ModalConfirmacaoIdentidade';
import ModalTermosAceite from '@/components/modals/ModalTermosAceite';
import { Building2 } from 'lucide-react';
import maintenanceConfig from '@/config/maintenance.json';

type DbEnvironment = 'development' | 'staging' | 'production';
type EnvAvailability = Record<
  DbEnvironment,
  { allowed: boolean; reason: string }
>;

// Aviso de manutenção: lê de config/maintenance.json
const MAINTENANCE_START_UTC = new Date(maintenanceConfig.startTime);
const MAINTENANCE_END_UTC = new Date(maintenanceConfig.endTime);

/**
 * Verifica se o sistema está ou estará em manutenção
 * (mostra aviso 12h antes se habilitado)
 */
function isMaintenanceActive(): boolean {
  if (!maintenanceConfig.enabled) return false;
  const now = new Date();
  return now >= MAINTENANCE_START_UTC && now <= MAINTENANCE_END_UTC;
}

export default function LoginPage() {
  const [cpf, setCpf] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [maintenanceError, setMaintenanceError] = useState<{
    message: string;
    until?: string;
    contact?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isConfirmingIdentity, setIsConfirmingIdentity] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [boasVindasAberto, setBoasVindasAberto] = useState(false);
  const [showConfirmacaoModal, setShowConfirmacaoModal] = useState(false);
  const [showTermosModal, setShowTermosModal] = useState(false);
  const [showMaintenanceWarning, setShowMaintenanceWarning] = useState(
    maintenanceConfig.enabled && new Date() < MAINTENANCE_END_UTC
  );
  const [showDbSelector, setShowDbSelector] = useState(false);
  const [dbEnvironment, setDbEnvironment] =
    useState<DbEnvironment>('development');
  const [pendingEmissorData, setPendingEmissorData] = useState<{
    redirectTo: string;
  } | null>(null);
  const [envAvailability, setEnvAvailability] =
    useState<EnvAvailability | null>(null);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Enviar CPF + senha (funcionários digitam data de nascimento no campo senha)
      const body: any = { cpf };
      if (senha) {
        body.senha = senha;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'same-origin',
      });

      // Verificar se é erro de manutenção (503)
      if (response.status === 503) {
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          if (data.error === 'MAINTENANCE_MODE') {
            const until = data.maintenanceUntil
              ? new Date(data.maintenanceUntil).toLocaleString('pt-BR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'em breve';
            setMaintenanceError({
              message: data.message,
              until,
              contact: data.contactEmail,
            });
            setLoading(false);
            return;
          }
        }
        setError(
          'Sistema em manutenção. Voltamos em 27 de abril às 8h.'
        );
        setLoading(false);
        return;
      }

      let data;
      try {
        data = await response.json();
      } catch (parseErr) {
        console.error('[LOGIN] Erro ao fazer parse da resposta:', parseErr);
        // Se não conseguir fazer parse de JSON, provavelmente é uma página HTML (erro do middleware)
        setError(
          'Sistema temporariamente indisponível. Tente novamente em instantes.'
        );
        setLoading(false);
        return;
      }

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
        (data.termosPendentes || data.precisaTrocarSenha)
      ) {
        // Determinar destino final após termos e/ou troca de senha
        const destinoFinal = data.precisaTrocarSenha
          ? '/trocar-senha'
          : data.redirectTo || '/dashboard';

        // Verificar se precisa aceitar termos (apenas rh e gestor)
        const { termos_uso, politica_privacidade } = data.termosPendentes || {};

        if (termos_uso || politica_privacidade) {
          // Tem termos pendentes - mostrar modal
          // Após aceitar termos, redireciona para troca de senha (se necessário) ou dashboard
          console.log(
            '[LOGIN] Termos pendentes detectados - mostrar modal de aceite'
          );
          setRedirectTo(destinoFinal);
          setShowTermosModal(true);
          setLoading(false);
          return;
        }

        // Se precisa trocar senha mas não tem termos pendentes
        if (data.precisaTrocarSenha) {
          console.log(
            '[LOGIN] Primeiro acesso detectado - redirecionando para troca de senha'
          );
          window.location.href = '/trocar-senha';
          return;
        }

        // Se não há termos pendentes nem troca de senha, redirecionar normal
        const targetUrl = data.redirectTo || '/dashboard';
        console.log(
          '[LOGIN] Redirecionando para:',
          targetUrl,
          'Perfil:',
          data.perfil
        );
        window.location.href = targetUrl;
      } else if (data.perfil === 'emissor') {
        // Emissor: mostrar seletor de ambiente de banco
        setPendingEmissorData({ redirectTo: data.redirectTo || '/emissor' });
        if (data.environmentAvailability) {
          setEnvAvailability(data.environmentAvailability as EnvAvailability);
        }
        setShowDbSelector(true);
        setLoading(false);
        return;
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

  const handleConfirmarAmbiente = async () => {
    if (!pendingEmissorData) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/emissor/selecionar-ambiente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbEnvironment }),
        credentials: 'same-origin',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao selecionar ambiente');
      }
      window.location.href = pendingEmissorData.redirectTo;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-3 sm:p-6"
      style={{
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Modal de Aviso de Manutenção Programada */}
      {showMaintenanceWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Cabeçalho amber */}
            <div className="bg-amber-500 px-6 py-4 flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-white flex-shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="text-white font-bold text-base">
                Manutenção Programada
              </h2>
            </div>

            {/* Corpo */}
            <div className="px-6 py-5 space-y-3">
              <p className="text-gray-800 text-sm font-medium">
                {maintenanceConfig.message || 'Sistema em manutenção.'}
              </p>
              <p className="text-gray-600 text-sm">
                Se precisar de suporte urgente, entre em contato pelo e-mail{' '}
                <a
                  href={`mailto:${maintenanceConfig.contactEmail}`}
                  className="text-amber-600 underline hover:text-amber-700"
                >
                  {maintenanceConfig.contactEmail}
                </a>
                .
              </p>
            </div>

            {/* Rodapé */}
            <div className="px-6 pb-5">
              <button
                type="button"
                onClick={() => setShowMaintenanceWarning(false)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-sm"
              >
                Entendido, continuar
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal de Seletor de Ambiente — apenas emissor */}
      {showDbSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Selecionar Banco de Dados
            </h2>
            <p className="text-sm text-gray-600 mb-5">
              Escolha qual ambiente deseja acessar para gerar laudos.
            </p>

            <div className="space-y-3 mb-6">
              {(
                [
                  {
                    value: 'development',
                    label: 'Desenvolvimento (local)',
                    description: 'Banco LOCAL — dados de desenvolvimento',
                  },
                  {
                    value: 'staging',
                    label: 'Homologação (staging)',
                    description: 'Banco STAGING — Neon Cloud',
                  },
                  {
                    value: 'production',
                    label: 'Produção',
                    description: 'Banco PRODUÇÃO — Neon Cloud (dados reais)',
                  },
                ] as {
                  value: DbEnvironment;
                  label: string;
                  description: string;
                }[]
              ).map((opt) => {
                const avail = envAvailability?.[opt.value];
                const isUnavailable = avail !== undefined && !avail.allowed;
                const isSelected = dbEnvironment === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (isUnavailable) return;
                      setDbEnvironment(opt.value);
                      setError('');
                    }}
                    disabled={isUnavailable}
                    className={[
                      'w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-150',
                      isUnavailable
                        ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'border-orange-500 bg-orange-50 cursor-pointer'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={[
                          'font-semibold text-sm',
                          isUnavailable ? 'text-gray-400' : 'text-gray-900',
                        ].join(' ')}
                      >
                        {opt.label}
                      </span>
                      {isSelected && !isUnavailable && (
                        <span className="text-orange-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p
                      className={[
                        'text-xs mt-0.5',
                        isUnavailable ? 'text-gray-400' : 'text-gray-500',
                      ].join(' ')}
                    >
                      {opt.description}
                    </p>
                    {isUnavailable && avail?.reason && (
                      <p className="text-xs text-red-500 mt-1 font-medium">
                        {avail.reason}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            {maintenanceError && (
              <div className="mb-4 text-sm bg-amber-50 border-2 border-amber-400 rounded-md p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-900">
                      {maintenanceError.message}
                    </p>
                    <p className="text-amber-800 text-xs mt-1">
                      Retornamos às <strong>{maintenanceError.until}</strong>
                    </p>
                    {maintenanceError.contact && (
                      <p className="text-amber-700 text-xs mt-2">
                        Suporte urgente:{' '}
                        <a
                          href={`mailto:${maintenanceError.contact}`}
                          className="underline font-medium hover:text-amber-900"
                        >
                          {maintenanceError.contact}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {dbEnvironment === 'production' &&
              envAvailability?.production?.allowed && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-md">
                  <p className="text-xs text-amber-800 font-medium">
                    ⚠ Acesso à produção restrito. Apenas emissores autorizados
                    podem acessar este ambiente.
                  </p>
                </div>
              )}

            <button
              type="button"
              onClick={handleConfirmarAmbiente}
              disabled={
                loading ||
                (!!envAvailability && !envAvailability[dbEnvironment]?.allowed)
              }
              className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
            >
              {loading ? 'Conectando...' : 'Confirmar e Entrar'}
            </button>
          </div>
        </div>
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

      <div className="bg-white rounded-lg shadow-xl p-5 sm:p-8 w-full max-w-md">
        <div className="text-center mb-5 sm:mb-8">
          <QworkLogo size="3xl" showSlogan={false} className="mb-3 sm:mb-4" />
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            Avaliação Psicossocial baseada no COPSOQ III
          </p>
        </div>

        {/* Box Explicativo de Formas de Login */}
        <div className="mb-5 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-xs sm:text-sm font-semibold text-blue-900 mb-2">
            Como Fazer Login?
          </h3>
          <ul className="space-y-1.5 text-xs sm:text-sm text-blue-800">
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
                <strong>Com Data de Nascimento</strong> - Funcionários sem
                senha: insira seu CPF e digite a Data de Nascimento no campo
                Senha
              </span>
            </li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
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
              inputMode="numeric"
              value={cpf}
              onChange={(e) =>
                setCpf(formatarCPF((e.target as HTMLInputElement).value))
              }
              placeholder="00000000000"
              className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base"
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
              className="mt-1 block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-base"
              disabled={showConfirmacaoModal}
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Funcionários sem senha: use sua data de nascimento no formato{' '}
              <span className="font-mono font-semibold">ddmmaaaa</span> (ex:
              15031990)
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
              onClick={() => setBoasVindasAberto(true)}
              disabled={showConfirmacaoModal}
              className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 border border-orange-300 rounded-md shadow-sm bg-white text-sm font-medium text-orange-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Building2 className="w-5 h-5" />
              <span>Cadastrar Empresa</span>
            </button>
          </div>
        </div>
      </div>

      <ModalBoasVindasCadastro
        isOpen={boasVindasAberto}
        onClose={() => setBoasVindasAberto(false)}
        onContinuar={() => {
          setBoasVindasAberto(false);
          setModalAberto(true);
        }}
      />
      <ModalCadastrotomador
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
      />
    </div>
  );
}
