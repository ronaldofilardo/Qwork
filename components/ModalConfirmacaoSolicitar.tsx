/**
 * Modal de Confirmação de Solicitação de Emissão de Laudo
 *
 * Exibido UMA VEZ por lote, logo após a solicitação de emissão ser
 * registrada com sucesso. Serve como feedback educativo ao solicitante.
 *
 * Comportamento:
 * - Aparece após retorno 200 da API (solicitação já processada)
 * - Só é exibido uma vez por lote por sessão (sessionStorage)
 * - Não impacta o fluxo de solicitação (puramente informativo)
 * - Exibe contato do gestor cadastrado (email e celular)
 * - Informa prazo de 24 horas úteis em horário comercial
 * - Email fixo da plataforma: contato@qwork.app.br
 */

'use client';

import { useEffect } from 'react';

const PLATAFORMA_EMAIL = 'contato@qwork.app.br';
const SESSION_KEY_PREFIX = 'modal_solicitar_emissao_';

/**
 * Verifica se a modal já foi exibida para este lote nesta sessão.
 */
export function foiExibidaParaLote(loteId: number): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(`${SESSION_KEY_PREFIX}${loteId}`) === 'shown';
  } catch {
    return false;
  }
}

/**
 * Marca que a modal foi exibida para este lote nesta sessão.
 */
export function marcarExibidaParaLote(loteId: number): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${loteId}`, 'shown');
  } catch {
    // sessionStorage pode não estar disponível em alguns contextos
  }
}

interface TomadorInfo {
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  responsavel_nome: string;
  responsavel_cpf: string;
  responsavel_email: string;
}

interface ModalConfirmacaoSolicitarProps {
  isOpen: boolean;
  onClose: () => void;
  loteId: number;
  gestorEmail?: string | null;
  gestorCelular?: string | null;
  /** Contexto de quem solicita a emissão: 'rh' = perfil RH (clínica), 'gestor' = Gestor de Entidade */
  contexto?: 'rh' | 'gestor';
  tomadorInfo?: TomadorInfo | null;
}

export function ModalConfirmacaoSolicitar({
  isOpen,
  onClose,
  loteId,
  gestorEmail,
  gestorCelular,
  contexto = 'gestor',
  tomadorInfo,
}: ModalConfirmacaoSolicitarProps) {
  const temDadosContato = Boolean(gestorEmail || gestorCelular);
  const labelPerfil =
    contexto === 'rh' ? 'do seu perfil RH' : 'do gestor cadastrado';

  // Marcar como exibida quando abrir
  useEffect(() => {
    if (isOpen) {
      marcarExibidaParaLote(loteId);
    }
  }, [isOpen, loteId]);

  // Fechar com ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Cabeçalho verde */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              ✅
            </span>
            <div>
              <h2 id="modal-titulo" className="text-xl font-bold leading-tight">
                Solicitação Recebida com Sucesso!
              </h2>
              <p className="text-sm text-green-100 mt-0.5">
                Lote #{loteId} · Emissão em análise
              </p>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="px-6 py-5 space-y-5">
          {/* Seção: Dados do Tomador (Clínica) */}
          {tomadorInfo && (
            <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Dados da Clínica (Tomador)
              </p>
              <div>
                <span className="text-sm font-semibold text-gray-900">
                  {tomadorInfo.nome}
                </span>
                {tomadorInfo.cnpj && (
                  <span className="ml-2 text-xs text-gray-500 font-mono">
                    CNPJ: {tomadorInfo.cnpj}
                  </span>
                )}
              </div>
              {(tomadorInfo.endereco || tomadorInfo.cidade) && (
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <span aria-hidden="true">📍</span>
                  <span>
                    {[
                      tomadorInfo.endereco,
                      tomadorInfo.cidade && tomadorInfo.estado
                        ? `${tomadorInfo.cidade}/${tomadorInfo.estado}`
                        : tomadorInfo.cidade || tomadorInfo.estado,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                </div>
              )}
              {(tomadorInfo.telefone || tomadorInfo.email) && (
                <div className="flex flex-col gap-1">
                  {tomadorInfo.telefone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span aria-hidden="true">📞</span>
                      <span>{tomadorInfo.telefone}</span>
                    </div>
                  )}
                  {tomadorInfo.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <span aria-hidden="true">📧</span>
                      <span className="font-mono break-all">
                        {tomadorInfo.email}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {tomadorInfo.responsavel_nome && (
                <div className="mt-1 pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Gestor Responsável
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {tomadorInfo.responsavel_nome}
                  </p>
                  {tomadorInfo.responsavel_cpf && (
                    <p className="text-xs text-gray-600 font-mono">
                      CPF: {tomadorInfo.responsavel_cpf}
                    </p>
                  )}
                  {tomadorInfo.responsavel_email && (
                    <p className="text-xs text-gray-600 font-mono break-all">
                      {tomadorInfo.responsavel_email}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Seção: Contato do Gestor / RH */}
          <div>
            <p className="text-sm text-gray-700 leading-relaxed">
              A plataforma entrará em contato com você através dos dados{' '}
              {labelPerfil}:
            </p>

            {temDadosContato ? (
              <div className="mt-3 rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 space-y-2">
                {gestorEmail ? (
                  <div className="flex items-center gap-2 text-sm text-blue-900">
                    <span className="text-base" aria-hidden="true">
                      📧
                    </span>
                    <span className="font-medium">Email:</span>
                    <span className="font-mono break-all">{gestorEmail}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <span className="text-base" aria-hidden="true">
                      📧
                    </span>
                    <span className="italic">Email não cadastrado</span>
                  </div>
                )}

                {gestorCelular ? (
                  <div className="flex items-center gap-2 text-sm text-blue-900">
                    <span className="text-base" aria-hidden="true">
                      📱
                    </span>
                    <span className="font-medium">Celular:</span>
                    <span className="font-mono">{gestorCelular}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <span className="text-base" aria-hidden="true">
                      📱
                    </span>
                    <span className="italic">Celular não cadastrado</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-sm text-amber-800">
                  ⚠️ Nenhum dado de contato foi encontrado{' '}
                  {contexto === 'rh'
                    ? 'no cadastro do perfil RH. Verifique se seu email e celular estão preenchidos em "Informações da Conta".'
                    : 'no cadastro. Para receber a proposta comercial, entre em contato diretamente com a plataforma pelo email abaixo.'}
                </p>
              </div>
            )}
          </div>

          {/* Seção: Prazo */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 px-4 py-3">
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5" aria-hidden="true">
                ⏱️
              </span>
              <div>
                <p className="text-sm font-semibold text-indigo-900">
                  Prazo de Retorno
                </p>
                <p className="text-sm text-indigo-800 mt-0.5">
                  Você receberá uma proposta comercial com valores em até{' '}
                  <strong>24 horas úteis</strong>, durante o horário comercial.
                </p>
              </div>
            </div>
          </div>

          {/* Seção: Dados mudaram */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
            <div className="flex items-start gap-2">
              <span className="text-base mt-0.5" aria-hidden="true">
                ⚠️
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Se seus dados de contato mudaram
                </p>
                <p className="text-sm text-gray-700 mt-0.5">
                  Caso os dados cadastrados tenham sido alterados ou atualizados
                  desde a criação da conta, entre em contato com a plataforma:
                </p>
                <a
                  href={`mailto:${PLATAFORMA_EMAIL}`}
                  className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                  aria-label={`Enviar email para ${PLATAFORMA_EMAIL}`}
                >
                  <span aria-hidden="true">📧</span>
                  {PLATAFORMA_EMAIL}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold text-base hover:from-green-700 hover:to-emerald-700 active:scale-[0.98] transition-all duration-150 shadow-md"
            autoFocus
          >
            Entendi, Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
