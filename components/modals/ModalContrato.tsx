'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, FileText, Loader2 } from 'lucide-react';
import ContratoPadrao from '@/components/terms/ContratoPadrao';

interface ModalContratoProps {
  isOpen: boolean;
  onClose: () => void;
  contratoId: number | string;
  onAceiteSuccess?: () => void;
}

interface Contrato {
  id: number;
  tomador_id: number;
  plano_id: number;
  conteudo: string;
  aceito: boolean;
  ip_aceite?: string;
  data_aceite?: string;
  hash_contrato?: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
  tomador_nome?: string;
  tomador_cnpj?: string;
  tomador_tipo?: string;
}

export default function ModalContrato({
  isOpen,
  onClose,
  contratoId,
  onAceiteSuccess,
}: ModalContratoProps) {
  const router = useRouter();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [skipPaymentPhase, setSkipPaymentPhase] = useState(false);

  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [aceiteChecked, setAceiteChecked] = useState(false);

  const buscarContrato = useCallback(async () => {
    setLoading(true);
    setErro('');

    try {
      let response;

      if (typeof contratoId === 'number') {
        response = await fetch(`/api/contratos/${contratoId}`);
      } else {
        const query = `numero_contrato=${encodeURIComponent(String(contratoId))}`;
        response = await fetch(`/api/contratos?${query}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar contrato');
      }

      // O endpoint /api/contratos/:id retorna o contrato diretamente
      setContrato(data.contrato || data);
    } catch (error) {
      console.error('Erro ao buscar contrato:', error);
      setErro(
        error instanceof Error ? error.message : 'Erro ao carregar contrato'
      );
    } finally {
      setLoading(false);
    }
  }, [contratoId]);

  useEffect(() => {
    if (isOpen && contratoId) {
      buscarContrato();
    }
  }, [isOpen, contratoId, buscarContrato]);

  // Detectar feature flag de pular pagamento
  useEffect(() => {
    const skipPayment =
      typeof window !== 'undefined' &&
      (window as any).NEXT_PUBLIC_SKIP_PAYMENT_PHASE === 'true';
    setSkipPaymentPhase(skipPayment);
  }, []);

  // Reset checkbox and evaluate initial scroll state quando modal abre ou contrato muda
  useEffect(() => {
    if (!isOpen) return;
    setAceiteChecked(false);
    setScrolledToEnd(false);

    const checkInitialScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      // se o conteúdo não tem barra de rolagem, consideramos como já rolado ao fim
      if (el.clientHeight >= el.scrollHeight) {
        setScrolledToEnd(true);
      }
    };

    // Pequeno delay para o DOM atualizar
    const t = setTimeout(checkInitialScroll, 100);
    return () => clearTimeout(t);
  }, [isOpen, contrato?.conteudo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-orange-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Contrato de Serviço
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
            </div>
          ) : erro ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {erro}
            </div>
          ) : contrato ? (
            <>
              {/* Dados da Tomadora */}
              {contrato.tomador_nome && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">
                    Dados da Contratante
                  </h3>
                  <div className="space-y-1">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">Razão Social:</span>{' '}
                      {contrato.tomador_nome}
                    </p>
                    {contrato.tomador_cnpj && (
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">CNPJ:</span>{' '}
                        {contrato.tomador_cnpj}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Conteúdo do contrato (área rolável com detecção de fim de rolagem) */}
              <div
                ref={(_el) => {
                  /* noop ref placeholder for TS */
                }}
                className="bg-gray-50 border border-gray-200 rounded-lg p-0 overflow-hidden"
              >
                <div
                  data-testid="contrato-content"
                  ref={contentRef}
                  onScroll={() => {
                    if (!contentRef.current) return;
                    const el = contentRef.current;
                    const atEnd =
                      el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
                    setScrolledToEnd(atEnd);
                  }}
                  className="max-h-[56vh] overflow-y-auto p-6 text-sm text-gray-800"
                >
                  {/* Exibir contrato padrão unificado (texto estático, sem dados dinâmicos) */}
                  <div className="prose prose-slate max-w-none">
                    <ContratoPadrao />
                  </div>{' '}
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Nenhum contrato encontrado
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col p-6 border-t gap-4">
          {/* Alerta sobre cobrança de manutenção */}
          {contrato &&
            contrato.tomador_tipo === 'clinica' &&
            !contrato.aceito && (
              <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-amber-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-amber-800">
                      Atenção:
                    </h3>
                    <p className="mt-1 text-sm text-amber-700">
                      Cada empresa cliente que você cadastrar na QWork gerará um
                      ambiente contratual independente. Após 90 dias sem emissão
                      de laudo para determinada empresa, será cobrada taxa de R$
                      200,00 referente à manutenção do ambiente ativo desta
                      empresa específica.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* Checkbox de aceite */}
          <div className="flex items-center gap-3">
            <input
              id="aceite-contrato"
              data-testid="aceite-checkbox"
              type="checkbox"
              checked={aceiteChecked}
              onChange={(e) => setAceiteChecked(e.target.checked)}
              disabled={!scrolledToEnd || loading}
              className="w-4 h-4"
            />
            <label htmlFor="aceite-contrato" className="text-sm text-gray-700">
              Li e concordo com os termos do contrato (role até o final para
              habilitar)
            </label>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              disabled={loading}
            >
              Fechar
            </button>

            {!loading && contrato && !contrato.aceito && (
              <button
                onClick={async () => {
                  if (!scrolledToEnd) {
                    setErro(
                      'Por favor, role até o final do contrato antes de aceitar.'
                    );
                    return;
                  }
                  if (!aceiteChecked) {
                    setErro(
                      'Você precisa confirmar que leu e concordou com o contrato.'
                    );
                    return;
                  }

                  setLoading(true);
                  setErro('');
                  try {
                    const res = await fetch('/api/contratos', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        acao: 'aceitar',
                        contrato_id: contrato.id,
                      }),
                    });
                    const data = await res.json();
                    if (!res.ok)
                      throw new Error(data.error || 'Erro ao aceitar contrato');

                    console.info(
                      '[CONTRATO] Aceite registrado:',
                      JSON.stringify({
                        contrato_id: contrato.id,
                        simulador_url: data.simulador_url,
                        timestamp: new Date().toISOString(),
                      })
                    );

                    // Redirecionar para boas-vindas se credenciais foram geradas
                    if (data.boasVindasUrl) {
                      console.info(
                        '[CONTRATO] Redirecionando para boas-vindas'
                      );
                      router.push(data.boasVindasUrl);
                      return;
                    }

                    // Redirecionar diretamente para o simulador se URL fornecida
                    if (data.simulador_url) {
                      window.location.href = data.simulador_url;
                      return;
                    }

                    // Se login foi liberado automaticamente (feature flag ativada)
                    if (data.loginLiberadoImediatamente) {
                      console.info(
                        '[CONTRATO] Login liberado automaticamente após aceite'
                      );
                      alert(
                        'Contrato aceito com sucesso!\n\n' +
                          'Seu acesso foi liberado imediatamente.\n' +
                          'Login: CPF do responsável + últimos 6 dígitos do CNPJ como senha.\n\n' +
                          'Redirecionando para login...'
                      );
                      router.push('/login');
                      return;
                    }

                    // Caso contrário, fechar modal e chamar callback de sucesso
                    onClose();
                    onAceiteSuccess?.();
                  } catch (err) {
                    console.error('[CONTRATO] Erro ao aceitar:', err);
                    setErro(
                      err instanceof Error
                        ? err.message
                        : 'Erro ao aceitar contrato'
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                data-testid="aceitar-button"
                className="px-6 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#E55A00] flex items-center gap-2"
                disabled={loading || !scrolledToEnd || !aceiteChecked}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : skipPaymentPhase ? (
                  '✓ Aceitar Contrato e Liberar Acesso'
                ) : (
                  '✓ Aceitar Contrato e Iniciar o Uso'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
