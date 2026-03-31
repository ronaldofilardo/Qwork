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
} from 'lucide-react';
import type { Solicitacao } from './types';

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
  onVincularRepresentante: (loteId: number) => void;
  onGerarComissao: (loteId: number) => void;
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

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGES[status] || STATUS_BADGES['aguardando_cobranca'];
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
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-600 mb-1">Valor por Funcionário</p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(solicitacao.valor_por_funcionario)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 mb-1">Valor Total</p>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(solicitacao.valor_total_calculado)}
          </p>
        </div>
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

function StatusActions({
  solicitacao,
  processando,
  valorInput,
  setValorInput,
  onDefinirValor,
  onGerarLink,
  onVerLink,
  onVerificarPagamento,
}: Omit<
  SolicitacaoCardProps,
  | 'formatCurrency'
  | 'formatDate'
  | 'codigoRepInput'
  | 'setCodigoRepInput'
  | 'onVincularRepresentante'
  | 'onGerarComissao'
>) {
  const loteId = solicitacao.lote_id;
  const isProcessando = processando === loteId;

  if (solicitacao.status_pagamento === 'aguardando_cobranca') {
    const temSugestao =
      solicitacao.lead_valor_negociado != null &&
      solicitacao.lead_valor_negociado > 0;
    return (
      <div className="space-y-2">
        {temSugestao && (
          <p className="text-xs text-emerald-600">
            Valor negociado pelo representante:{' '}
            <strong>
              R${' '}
              {Number(solicitacao.lead_valor_negociado).toLocaleString(
                'pt-BR',
                { minimumFractionDigits: 2, maximumFractionDigits: 2 }
              )}
            </strong>
          </p>
        )}
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="R$ 0,00"
            value={valorInput[loteId] || ''}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              const formatted = (Number(value) / 100).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              });
              setValorInput((prev) => ({
                ...prev,
                [loteId]: `R$ ${formatted}`,
              }));
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isProcessando}
          />
          <button
            onClick={() => onDefinirValor(loteId)}
            disabled={isProcessando || !valorInput[loteId]}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Definir Valor
          </button>
          {solicitacao.valor_por_funcionario &&
            solicitacao.valor_por_funcionario > 0 && (
              <button
                onClick={() => onGerarLink(loteId)}
                disabled={isProcessando}
                className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                Gerar Link
              </button>
            )}
        </div>
      </div>
    );
  }

  if (solicitacao.status_pagamento === 'aguardando_pagamento') {
    return (
      <div className="flex items-center gap-3">
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
      </div>
    );
  }

  // pago
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-5 h-5" />
        <span className="font-medium">Pagamento confirmado</span>
      </div>
    </div>
  );
}

function ComissaoSection({
  solicitacao,
  processando,
  codigoRepInput,
  setCodigoRepInput,
  onVincularRepresentante,
  onGerarComissao,
  formatCurrency,
}: {
  solicitacao: Solicitacao;
  processando: number | null;
  codigoRepInput: Record<number, string>;
  setCodigoRepInput: React.Dispatch<
    React.SetStateAction<Record<number, string>>
  >;
  onVincularRepresentante: (loteId: number) => void;
  onGerarComissao: (loteId: number) => void;
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
                Código: {solicitacao.representante_codigo}
                {solicitacao.representante_tipo_pessoa && (
                  <span className="ml-2 uppercase">
                    ({solicitacao.representante_tipo_pessoa})
                  </span>
                )}
              </p>
            </div>
            {isPago &&
              (solicitacao.comissao_gerada ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Comissão gerada
                </span>
              ) : (
                <button
                  onClick={() => onGerarComissao(loteId)}
                  disabled={isProcessando}
                  className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Coins className="w-4 h-4" />
                  {isProcessando ? 'Gerando...' : 'Gerar Comissão'}
                </button>
              ))}
          </div>

          {/* Preview dos valores - apenas quando pago */}
          {isPago &&
            !solicitacao.comissao_gerada &&
            solicitacao.valor_total_calculado && (
              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-lg p-3">
                <div>
                  <p className="text-gray-500">Valor total pago</p>
                  <p className="font-medium">
                    {formatCurrency(solicitacao.valor_total_calculado)}
                  </p>
                </div>
                {solicitacao.representante_percentual_comissao != null ? (
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

export function SolicitacaoCard(props: SolicitacaoCardProps) {
  const { solicitacao, formatCurrency, formatDate } = props;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Lote #{solicitacao.lote_id}
            </h3>
            <StatusBadge status={solicitacao.status_pagamento} />
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
                {solicitacao.num_avaliacoes_concluidas}
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

      <ComissaoSection
        solicitacao={solicitacao}
        processando={props.processando}
        codigoRepInput={props.codigoRepInput}
        setCodigoRepInput={props.setCodigoRepInput}
        onVincularRepresentante={props.onVincularRepresentante}
        onGerarComissao={props.onGerarComissao}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
