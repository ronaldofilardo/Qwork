'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, FileText, Loader2 } from 'lucide-react';
import ContratoPadrao from '@/components/terms/ContratoPadrao';

interface ModalContratoProps {
  isOpen: boolean;
  onClose: () => void;
  contratoId: number | string;
}

interface Contrato {
  id: number;
  contratante_id: number;
  plano_id: number;
  conteudo: string;
  aceito: boolean;
  ip_aceite?: string;
  data_aceite?: string;
  hash_contrato?: string;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

export default function ModalContrato({
  isOpen,
  onClose,
  contratoId,
}: ModalContratoProps) {
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

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
        <div className="flex flex-col md:flex-row items-center justify-between p-6 border-t gap-4">
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

          <div className="flex items-center">
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

                    // Redirecionar diretamente para o simulador se URL fornecida
                    if (data.simulador_url) {
                      window.location.href = data.simulador_url;
                      return;
                    }

                    // Caso contrário, apenas fechar e recarregar página para atualizar estado
                    onClose();
                    window.location.reload();
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
                className="ml-4 px-6 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-[#E55A00] flex items-center gap-2"
                disabled={loading || !scrolledToEnd || !aceiteChecked}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  '✓ Aceitar Contrato e Prosseguir para Pagamento'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
