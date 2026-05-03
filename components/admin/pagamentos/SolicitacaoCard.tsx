'use client';

import {
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  ExternalLink,
  Link2,
  Users,
  RefreshCw,
  UserCheck,
  Coins,
  ChevronDown,
  ChevronUp,
  Send,
  Wrench,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { Solicitacao, ParcelaDetalhe } from './types';

interface SolicitacaoCardProps {
  solicitacao: Solicitacao;
  processando: number | null;
  valorInput: Record<number, string>;
  setValorInput: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  codigoRepInput: Record<number, string>;
  setCodigoRepInput: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
  onDefinirValor: (loteId: number) => void;
  onGerarLink: (loteId: number) => void;
  onVerLink: (solicitacao: Solicitacao) => void;
  onVerificarPagamento: (loteId: number) => void;
  onDisponibilizarLink: (loteId: number) => void;
  onDeletarLink: (loteId: number) => void;
  onConfirmarPagamento: (
    loteId: number,
    metodo: string,
    parcelas: number
  ) => void;
  onCancelarCobranca: (loteId: number) => void;
  onVincularRepresentante: (loteId: number) => void;
  formatCurrency: (value: number | null) => string;
  formatDate: (dateString: string | null) => string;
}

const STATUS_BADGES: Record<
  string,
  { icon: typeof Clock; text: string; class: string }
> = {
  aguardando_cobranca: {
    icon: Clock,
    text: 'Aguardando Cobrança',
    class: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  aguardando_pagamento: {
    icon: CreditCard,
    text: 'Aguardando Pagamento',
    class: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  pago: {
    icon: CheckCircle,
    text: 'Pago',
    class: 'bg-green-100 text-green-800 border-green-300',
  },
};

function StatusBadge({
  status,
  isento = false,
}: {
  status: string;
  isento?: boolean;
}) {
  const resolvedStatus = isento ? 'pago' : status;
  const badge =
    STATUS_BADGES[resolvedStatus] || STATUS_BADGES['aguardando_cobranca'];
  const Icon = badge.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${badge.class}`}
    >
      <Icon className="w-4 h-4" />
      {badge.text}
    </span>
  );
}

function PaymentInfo({
  solicitacao,
  formatCurrency,
  formatDate,
}: {
  solicitacao: Solicitacao;
  formatCurrency: (v: number | null) => string;
  formatDate: (d: string | null) => string;
}) {
  // Oculta para aguardando_cobranca sem valor definido — evita mostrar R$ 0,00 confuso
  const hasValor =
    (solicitacao.valor_negociado_vinculo ??
      solicitacao.valor_por_funcionario ??
      0) > 0;
  if (solicitacao.status_pagamento === 'aguardando_cobranca' && !hasValor) {
    return null;
  }

  // Calcular valor pago a partir das parcelas
  let valorPago = 0;
  if (solicitacao.detalhes_parcelas) {
    const parcelas =
      typeof solicitacao.detalhes_parcelas === 'string'
        ? JSON.parse(solicitacao.detalhes_parcelas)
        : solicitacao.detalhes_parcelas;
    valorPago = parcelas
      .filter((p: any) => p.pago || p.status === 'pago')
      .reduce((sum: number, p: any) => sum + (p.valor || 0), 0);
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-600 mb-1">Valor por Funcionário</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(
              solicitacao.valor_negociado_vinculo ??
                solicitacao.valor_por_funcionario
            )}
          </p>
          {solicitacao.valor_negociado_vinculo &&
            solicitacao.valor_negociado_vinculo !==
              solicitacao.valor_por_funcionario && (
              <p className="text-xs text-gray-500 mt-1">
                (Negociado:{' '}
                {formatCurrency(solicitacao.valor_negociado_vinculo)})
              </p>
            )}
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Valor Total</p>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(solicitacao.valor_total_calculado)}
          </p>
        </div>
        {valorPago > 0 && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Valor Pago</p>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(valorPago)}
            </p>
          </div>
        )}
        {solicitacao.pago_em && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Pago em</p>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(solicitacao.pago_em)}
            </p>
          </div>
        )}
        {solicitacao.pagamento_metodo && (
          <div>
            <p className="text-xs text-gray-600 mb-1">Método</p>
            <p className="text-sm font-medium text-gray-900 capitalize">
              {solicitacao.pagamento_metodo}
              {solicitacao.pagamento_parcelas &&
              solicitacao.pagamento_parcelas > 1
                ? ` (${solicitacao.pagamento_parcelas}x)`
                : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ParcelasDetalheSection({
  parcelas,
  total,
}: {
  parcelas: ParcelaDetalhe[] | null;
  total: number;
}) {
  const [aberto, setAberto] = useState(false);

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString('pt-BR') : '—';

  return (
    <div className="mt-2">
      <button
        onClick={() => setAberto((p) => !p)}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
      >
        {aberto ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
        {aberto ? 'Ocultar' : 'Ver'} parcelas ({total}x)
      </button>
      {aberto && (
        <div className="mt-2 border rounded-lg overflow-hidden text-xs">
          {parcelas && parcelas.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500">Parc.</th>
                  <th className="px-3 py-2 text-left text-gray-500">Valor</th>
                  <th className="px-3 py-2 text-left text-gray-500">
                    Vencimento
                  </th>
                  <th className="px-3 py-2 text-left text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {parcelas.map((p) => (
                  <tr key={p.numero} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-700">
                      {p.numero}/{total}
                    </td>
                    <td className="px-3 py-2">{fmt(p.valor)}</td>
                    <td className="px-3 py-2">
                      {p.pago && p.data_pagamento
                        ? fmtDate(p.data_pagamento)
                        : fmtDate(p.data_vencimento)}
                    </td>
                    <td className="px-3 py-2">
                      {p.pago ? (
                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          Pago
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          A pagar
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            Array.from({ length: total }, (_, i) => i + 1).map((n) => (
              <div
                key={n}
                className="px-3 py-2 border-t first:border-0 text-gray-500"
              >
                Parcela {n}/{total} — detalhes não disponíveis
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatusActions({
  solicitacao,
  processando,
  valorInput,
  setValorInput,
  onDefinirValor,
  onGerarLink,
  onVerLink,
  onVerificarPagamento,
  onDisponibilizarLink,
  onDeletarLink,
  onCancelarCobranca,
  onConfirmarPagamento,
}: Omit<
  SolicitacaoCardProps,
  | 'formatCurrency'
  | 'formatDate'
  | 'codigoRepInput'
  | 'setCodigoRepInput'
  | 'onVincularRepresentante'
>) {
  const loteId = solicitacao.lote_id;
  const isProcessando = processando === loteId;
  const [showConfirmarForm, setShowConfirmarForm] = useState(false);
  const [metodoConfirm, setMetodoConfirm] = useState('pix');
  const [parcelasConfirm, setParcelasConfirm] = useState(1);

  if (solicitacao.isento_pagamento) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">
            Tomador isento — nenhuma cobrança é necessária
          </span>
        </div>
        <p className="text-sm text-gray-600">
          O lote permanece liberado para emissão sem geração de link de
          pagamento.
        </p>
      </div>
    );
  }

  if (solicitacao.status_pagamento === 'aguardando_cobranca') {
    const temSugestao =
      solicitacao.lead_valor_negociado != null &&
      solicitacao.lead_valor_negociado > 0;
    const modelo = solicitacao.modelo_comissionamento;
    const isCustoFixo = modelo === 'custo_fixo';
    const temRep = !!solicitacao.representante_id;

    // Calcula preview do total com base no input atual
    const rawNum = (valorInput[loteId] || '').replace(/\D/g, '');
    const valorDigitado = rawNum ? Number(rawNum) / 100 : 0;
    const numAvaliacoes = Number(
      solicitacao.num_avaliacoes_cobradas ??
        solicitacao.num_avaliacoes_concluidas ??
        0
    );
    const totalPreview = valorDigitado * numAvaliacoes;

    const modeloBadge = modelo ? (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          isCustoFixo
            ? 'bg-orange-100 text-orange-700 border border-orange-200'
            : 'bg-blue-100 text-blue-700 border border-blue-200'
        }`}
      >
        {isCustoFixo
          ? `Custo Fixo${solicitacao.valor_custo_fixo_snapshot != null ? ` · R$ ${Number(solicitacao.valor_custo_fixo_snapshot).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`
          : [
              solicitacao.representante_percentual_comissao != null
                ? `Rep ${solicitacao.representante_percentual_comissao}%`
                : null,
            ]
              .filter(Boolean)
              .join(' · ')}
      </span>
    ) : null;

    return (
      <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-4">
        {/* Título da seção */}
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-semibold text-amber-800">
            Definir Valor de Cobrança
          </span>
        </div>

        {/* Info rep + modelo + negociado — linha compacta */}
        {(temRep || temSugestao || modelo) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-white rounded-lg px-3 py-2.5 border border-amber-100">
            {temRep && (
              <span className="flex items-center gap-1.5 text-sm">
                <UserCheck className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                <span className="font-medium text-gray-800">
                  {solicitacao.representante_nome}
                </span>
                <span className="text-gray-400 text-xs">
                  · #{solicitacao.representante_id}
                </span>
              </span>
            )}
            {modeloBadge}
            {temSugestao && (
              <span className="text-sm text-emerald-700 font-medium">
                Negociado:{' '}
                <strong>
                  R${' '}
                  {Number(solicitacao.lead_valor_negociado).toLocaleString(
                    'pt-BR',
                    { minimumFractionDigits: 2 }
                  )}
                </strong>
              </span>
            )}
          </div>
        )}

        {/* Painel de valores negociados por tipo de tomador e modelo de comissionamento */}
        {temRep &&
          modelo &&
          (() => {
            const tipoProduto = solicitacao.clinica_id
              ? 'clinica'
              : solicitacao.entidade_id
                ? 'entidade'
                : null;
            const baseQWork =
              tipoProduto === 'clinica'
                ? 5
                : tipoProduto === 'entidade'
                  ? 12
                  : null;

            // Custo fixo efetivo: prioridade snapshot do lote > snapshot do lead > global do rep por tipo
            const custoFixoEfetivo = isCustoFixo
              ? (solicitacao.valor_custo_fixo_snapshot ??
                solicitacao.lead_valor_custo_fixo_snapshot ??
                (tipoProduto === 'clinica'
                  ? solicitacao.rep_valor_custo_fixo_clinica
                  : tipoProduto === 'entidade'
                    ? solicitacao.rep_valor_custo_fixo_entidade
                    : null))
              : null;

            // Percentuais efetivos: prioridade vínculo > lead > global do rep
            const percRepEfetivo = !isCustoFixo
              ? (solicitacao.vinculo_percentual_rep ??
                solicitacao.lead_percentual_rep ??
                solicitacao.representante_percentual_comissao)
              : null;
            const percRepFonte = !isCustoFixo
              ? solicitacao.vinculo_percentual_rep != null
                ? 'vínculo'
                : solicitacao.lead_percentual_rep != null
                  ? 'lead'
                  : 'global'
              : null;
            const minVenda =
              baseQWork != null && custoFixoEfetivo != null
                ? baseQWork + Number(custoFixoEfetivo)
                : null;

            const fmt2 = (v: number) =>
              `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

            return (
              <div className="bg-white rounded-lg border border-amber-100 px-3 py-2.5">
                <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                  {/* Tipo do tomador */}
                  {tipoProduto && (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                        Tipo
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          tipoProduto === 'clinica'
                            ? 'bg-sky-100 text-sky-700 border border-sky-200'
                            : 'bg-violet-100 text-violet-700 border border-violet-200'
                        }`}
                      >
                        {tipoProduto === 'clinica' ? 'Clínica' : 'Entidade'}
                      </span>
                    </div>
                  )}

                  {/* Custo fixo + base + mínimo */}
                  {isCustoFixo && (
                    <>
                      {custoFixoEfetivo != null && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            Custo Fixo Rep
                          </span>
                          <span className="text-sm font-bold text-orange-700">
                            {fmt2(Number(custoFixoEfetivo))}
                          </span>
                        </div>
                      )}
                      {baseQWork != null && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            Base QWork
                          </span>
                          <span className="text-sm font-bold text-gray-600">
                            {fmt2(baseQWork)}
                          </span>
                        </div>
                      )}
                      {minVenda != null && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            Mínimo de Venda
                          </span>
                          <span className="text-sm font-bold text-emerald-700">
                            {fmt2(minVenda)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {/* Percentuais para modelo percentual */}
                  {!isCustoFixo && (
                    <>
                      {percRepEfetivo != null && (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            Rep{percRepFonte ? ` (${percRepFonte})` : ''}
                          </span>
                          <span className="text-sm font-bold text-blue-700">
                            {percRepEfetivo}%
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })()}

        {/* Input de valor + botão */}
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-0">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Valor por avaliação
            </label>
            <input
              type="text"
              placeholder="R$ 0,00"
              value={valorInput[loteId] || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                const formatted = (Number(value) / 100).toLocaleString(
                  'pt-BR',
                  { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                );
                setValorInput((prev) => ({
                  ...prev,
                  [loteId]: `R$ ${formatted}`,
                }));
              }}
              className="w-full px-4 py-2.5 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 font-medium"
              disabled={isProcessando}
            />
            {temSugestao && (
              <p className="mt-1 text-xs text-gray-500">
                Sugestão do lead: R${' '}
                {Number(solicitacao.lead_valor_negociado).toLocaleString(
                  'pt-BR',
                  { minimumFractionDigits: 2 }
                )}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onDefinirValor(loteId)}
              disabled={isProcessando || !valorInput[loteId]}
              className="px-5 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <DollarSign className="w-4 h-4" />
              {isProcessando ? 'Salvando...' : 'Definir Valor'}
            </button>
            {solicitacao.valor_por_funcionario != null &&
              solicitacao.valor_por_funcionario > 0 && (
                <button
                  onClick={() => onGerarLink(loteId)}
                  disabled={isProcessando}
                  className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Link2 className="w-4 h-4" />
                  Gerar Link
                </button>
              )}
          </div>
        </div>

        {/* Preview do total */}
        {valorDigitado > 0 && numAvaliacoes > 0 && (
          <div className="flex items-center gap-2 text-sm bg-white rounded-lg px-3 py-2 border border-amber-200">
            <span className="text-gray-500">
              {numAvaliacoes} {numAvaliacoes === 1 ? 'avaliação' : 'avaliações'}{' '}
              &times; R${' '}
              {valorDigitado.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-gray-400">=</span>
            <span className="font-bold text-gray-900">
              R${' '}
              {totalPreview.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        )}

        {/* Cancelar cobrança */}
        <div className="pt-1 border-t border-amber-200">
          <button
            onClick={() => onCancelarCobranca(loteId)}
            disabled={isProcessando}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isProcessando ? 'Cancelando...' : 'Cancelar Cobrança'}
          </button>
        </div>
      </div>
    );
  }

  if (solicitacao.status_pagamento === 'aguardando_pagamento') {
    const jaDisponibilizado = !!solicitacao.link_disponibilizado_em;
    return (
      <div className="space-y-2">
        {!jaDisponibilizado && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Send className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-sm text-amber-800 flex-1">
              Link gerado mas ainda não enviado ao tomador.
            </span>
            <button
              onClick={() => onDisponibilizarLink(loteId)}
              disabled={isProcessando}
              className="px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {isProcessando
                ? 'Enviando...'
                : 'Disponibilizar na conta do Tomador'}
            </button>
          </div>
        )}
        {jaDisponibilizado && (
          <p className="text-xs text-green-600">
            ✓ Disponibilizado em{' '}
            {new Date(solicitacao.link_disponibilizado_em!).toLocaleString(
              'pt-BR',
              {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            )}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onVerLink(solicitacao)}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Link / QR Code
          </button>
          <button
            onClick={() => onVerificarPagamento(loteId)}
            disabled={isProcessando}
            className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${isProcessando ? 'animate-spin' : ''}`}
            />
            {isProcessando ? 'Verificando...' : 'Verificar Pagamento'}
          </button>
          <button
            onClick={() => onDeletarLink(loteId)}
            disabled={isProcessando}
            className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Deletar Link
          </button>
        </div>
        {/* Confirmar pagamento manualmente */}
        {!showConfirmarForm ? (
          <button
            type="button"
            onClick={() => setShowConfirmarForm(true)}
            disabled={isProcessando}
            className="mt-2 px-5 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Confirmar Pagamento Manualmente
          </button>
        ) : (
          <div className="mt-3 p-3 border border-green-200 bg-green-50 rounded-lg space-y-3">
            <p className="text-sm font-medium text-green-900">
              Registrar pagamento
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs text-green-800 mb-1">
                  Método
                </label>
                <select
                  value={metodoConfirm}
                  onChange={(e) => setMetodoConfirm(e.target.value)}
                  className="px-3 py-2 text-sm border border-green-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500"
                  disabled={isProcessando}
                >
                  <option value="pix">PIX</option>
                  <option value="boleto">Boleto</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="transferencia">Transferência</option>
                  <option value="isento">Isento</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-green-800 mb-1">
                  Parcelas
                </label>
                <select
                  value={parcelasConfirm}
                  onChange={(e) => setParcelasConfirm(Number(e.target.value))}
                  className="px-3 py-2 text-sm border border-green-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500"
                  disabled={isProcessando}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      {n}x
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  onConfirmarPagamento(loteId, metodoConfirm, parcelasConfirm);
                  setShowConfirmarForm(false);
                }}
                disabled={isProcessando}
                className="px-5 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                {isProcessando ? 'Confirmando...' : 'Confirmar'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmarForm(false)}
                disabled={isProcessando}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // pago
  const isPago = solicitacao.status_pagamento === 'pago';
  const temParcelas =
    isPago &&
    solicitacao.pagamento_parcelas != null &&
    solicitacao.pagamento_parcelas > 1;

  // Normalizar detalhes_parcelas (pode vir como string JSON ou array)
  let detalhes: ParcelaDetalhe[] | null = null;
  if (temParcelas && solicitacao.detalhes_parcelas) {
    try {
      const raw: ParcelaDetalhe[] =
        typeof solicitacao.detalhes_parcelas === 'string'
          ? JSON.parse(solicitacao.detalhes_parcelas)
          : solicitacao.detalhes_parcelas;
      // Fallback: se o lote está pago mas nenhuma parcela registra pago=true,
      // infere parcela 1 como paga usando pago_em do lote.
      // Corrige dados stale do webhook processado antes do fix.
      const algumaPaga = raw.some((p) => p.pago);
      detalhes =
        !algumaPaga && solicitacao.pago_em
          ? raw.map((p) =>
              p.numero === 1
                ? {
                    ...p,
                    pago: true,
                    status: 'pago' as const,
                    data_pagamento: solicitacao.pago_em,
                  }
                : p
            )
          : raw;
    } catch {
      detalhes = null;
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Pagamento confirmado</span>
      </div>
      {temParcelas && (
        <ParcelasDetalheSection
          parcelas={detalhes}
          total={solicitacao.pagamento_parcelas!}
        />
      )}
    </div>
  );
}

function ComissaoSection({
  solicitacao,
  processando,
  codigoRepInput,
  setCodigoRepInput,
  onVincularRepresentante,
  formatCurrency,
}: {
  solicitacao: Solicitacao;
  processando: number | null;
  codigoRepInput: Record<number, string>;
  setCodigoRepInput: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
  onVincularRepresentante: (loteId: number) => void;
  formatCurrency: (value: number | null) => string;
}) {
  const loteId = solicitacao.lote_id;
  const isProcessando = processando === loteId;
  const temRep = !!solicitacao.vinculo_id && !!solicitacao.representante_id;
  const isPago = solicitacao.status_pagamento === 'pago';

  // Mostra a seção se há representante vinculado (qualquer status) ou se está pago (para permitir vincular)
  if (!temRep && !isPago) return null;

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center gap-2 mb-3">
        <Coins className="w-4 h-4 text-purple-600" />
        <h4 className="text-sm font-semibold text-gray-700">
          {isPago ? 'Comissão' : 'Representante Responsável'}
        </h4>
      </div>

      {temRep ? (
        <div className="space-y-3">
          {/* Info do representante vinculado */}
          <div className="flex items-center gap-3 bg-purple-50 rounded-lg p-3">
            <UserCheck className="w-5 h-5 text-purple-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {solicitacao.representante_nome}
              </p>
              <p className="text-xs text-gray-500">
                ID: #{solicitacao.representante_id}
              </p>
              {(() => {
                const modelo = solicitacao.modelo_comissionamento;
                if (!modelo) return null;
                const isCF = modelo === 'custo_fixo';
                const percRep = solicitacao.representante_percentual_comissao;
                return (
                  <span
                    className={`mt-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                      isCF
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isCF
                      ? `Custo Fixo${solicitacao.valor_custo_fixo_snapshot != null ? ` · R$ ${Number(solicitacao.valor_custo_fixo_snapshot).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : ''}`
                      : [percRep != null ? `Rep ${percRep}%` : '% Percentual']
                          .filter(Boolean)
                          .join(' · ')}
                  </span>
                );
              })()}
              {solicitacao.lead_valor_negociado != null &&
                solicitacao.lead_valor_negociado > 0 && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Negociado:{' '}
                    <strong>
                      R${' '}
                      {Number(solicitacao.lead_valor_negociado).toLocaleString(
                        'pt-BR',
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </strong>
                  </p>
                )}
            </div>
            {isPago &&
              (() => {
                const totalParcelas = solicitacao.pagamento_parcelas ?? 1;
                const geradas = solicitacao.comissoes_geradas_count ?? 0;
                const ativas = solicitacao.comissoes_ativas_count ?? 0;
                const todosProvisionados = geradas >= totalParcelas;

                if (todosProvisionados) {
                  const futuras = geradas - ativas;
                  if (futuras === 0) {
                    // Todas as parcelas foram pagas e comissões ativas
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {totalParcelas > 1
                          ? `${geradas}/${totalParcelas} com comissão`
                          : 'Comissão gerada'}
                      </span>
                    );
                  }
                  // Parcelas futuras ainda provisionadas (aguardando pagamento)
                  return (
                    <div className="flex flex-col items-end gap-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {geradas} provisionadas
                      </span>
                      <span className="text-xs text-gray-500">
                        {ativas} ativa{ativas !== 1 ? 's' : ''} · {futuras}{' '}
                        aguardando parcela
                      </span>
                    </div>
                  );
                }

                // Lote sem provisionamento automático — aguardando webhook
                return (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    Aguardando confirmação via gateway
                  </span>
                );
              })()}
          </div>

          {/* Preview dos valores - apenas quando pago e lote sem provisionamento automático */}
          {isPago &&
            (solicitacao.comissoes_geradas_count ?? 0) <
              (solicitacao.pagamento_parcelas ?? 1) &&
            solicitacao.valor_total_calculado && (
              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-gray-500">Valor total pago</p>
                  <p className="font-medium">
                    {formatCurrency(solicitacao.valor_total_calculado)}
                  </p>
                </div>
                {solicitacao.modelo_comissionamento === 'custo_fixo' ? (
                  <div>
                    <p className="text-gray-500">Comissão (custo fixo)</p>
                    {(() => {
                      const negociado =
                        solicitacao.valor_negociado_vinculo ??
                        solicitacao.lead_valor_negociado;
                      const custo = solicitacao.valor_custo_fixo_snapshot;
                      if (negociado != null && custo != null) {
                        const totalParcelas =
                          solicitacao.pagamento_parcelas ?? 1;
                        const valorTotal = Number(
                          solicitacao.valor_total_calculado
                        );
                        const ratio =
                          negociado > 0 ? (negociado - custo) / negociado : 0;
                        const valorComissao =
                          Math.round(ratio * valorTotal * 100) / 100;
                        return (
                          <div>
                            <p className="font-bold text-purple-600">
                              {formatCurrency(valorComissao)}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              R$ {negociado.toFixed(2)} − R$ {custo.toFixed(2)}
                              /avaliação × {totalParcelas}p
                            </p>
                          </div>
                        );
                      }
                      return (
                        <p className="font-medium text-orange-600">
                          ⚠️ Valor negociado não definido
                        </p>
                      );
                    })()}
                  </div>
                ) : solicitacao.representante_percentual_comissao != null ? (
                  <div>
                    <p className="text-gray-500">
                      Comissão ({solicitacao.representante_percentual_comissao}
                      %)
                    </p>
                    <p className="font-bold text-purple-600">
                      {formatCurrency(
                        (solicitacao.valor_total_calculado *
                          solicitacao.representante_percentual_comissao) /
                          100
                      )}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-500">Comissão</p>
                    <p className="font-medium text-orange-600">
                      ⚠️ % não definido
                    </p>
                  </div>
                )}
              </div>
            )}
        </div>
      ) : isPago ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">
              Nenhum representante vinculado. Informe o código para vincular:
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Código do representante (ex: REP-PJ123)"
                value={codigoRepInput[loteId] || ''}
                onChange={(e) =>
                  setCodigoRepInput((prev) => ({
                    ...prev,
                    [loteId]: e.target.value.toUpperCase(),
                  }))
                }
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isProcessando}
              />
              <button
                onClick={() => onVincularRepresentante(loteId)}
                disabled={isProcessando || !codigoRepInput[loteId]?.trim()}
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                {isProcessando ? 'Vinculando...' : 'Vincular'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const STATUS_BORDER: Record<string, string> = {
  aguardando_cobranca: 'border-l-4 border-l-amber-400',
  aguardando_pagamento: 'border-l-4 border-l-blue-400',
  pago: 'border-l-4 border-l-green-400',
};

export function SolicitacaoCard(props: SolicitacaoCardProps) {
  const { solicitacao, formatCurrency, formatDate } = props;
  const isAguardandoCobranca =
    solicitacao.status_pagamento === 'aguardando_cobranca';
  const borderClass =
    STATUS_BORDER[solicitacao.status_pagamento] ??
    'border-l-4 border-l-gray-300';

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow ${borderClass}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Lote #{solicitacao.lote_id}
            </h3>
            <StatusBadge
              status={solicitacao.status_pagamento}
              isento={solicitacao.isento_pagamento}
            />
            {solicitacao.isento_pagamento && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-300">
                <CheckCircle className="w-3 h-3" />
                Isento
              </span>
            )}
            {solicitacao.tipo_cobranca === 'manutencao' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-300">
                <Wrench className="w-3 h-3" />
                Taxa Manutenção
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Tomador:</span>
              <span className="ml-2 font-medium text-gray-900">
                {solicitacao.nome_tomador}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Solicitante:</span>
              <span className="ml-2 font-medium text-gray-900">
                {solicitacao.solicitante_nome}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Avaliações:</span>
              <span className="font-medium text-gray-900">
                {solicitacao.num_avaliacoes_cobradas ??
                  solicitacao.num_avaliacoes_concluidas}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Solicitado em:</span>
              <span className="ml-2 font-medium text-gray-900">
                {formatDate(solicitacao.solicitacao_emissao_em)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <PaymentInfo
        solicitacao={solicitacao}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      <StatusActions {...props} />

      {/* ComissaoSection: omitida para aguardando_cobranca (info inline no StatusActions) */}
      {!isAguardandoCobranca && (
        <ComissaoSection
          solicitacao={solicitacao}
          processando={props.processando}
          codigoRepInput={props.codigoRepInput}
          setCodigoRepInput={props.setCodigoRepInput}
          onVincularRepresentante={props.onVincularRepresentante}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  );
}
