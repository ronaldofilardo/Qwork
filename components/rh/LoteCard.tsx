import React from 'react';
import toast from 'react-hot-toast';
import { LoteAvaliacao } from '@/lib/hooks';

/** Percentual mínimo de avaliações concluídas para emissão do laudo (Migration 1130) */
const PERCENTUAL_MINIMO_EMISSAO = 70;

interface LaudoItem {
  id: number;
  lote_id: number;
  emissor_nome: string;
  enviado_em: string;
  hash: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  status?: string;
}

interface LoteCardProps {
  lote: LoteAvaliacao;
  laudoAssociado: LaudoItem | undefined;
  downloadingLaudo: number | null;
  onLoteClick: (loteId: number) => void;
  onDownloadLaudo: (laudo: LaudoItem) => void;
}

function temLaudoDisponivel(
  lote: LoteAvaliacao,
  laudoAssociado: LaudoItem | undefined
): boolean {
  if (!laudoAssociado) return false;
  const temEnvio = Boolean(
    laudoAssociado.enviado_em ||
    laudoAssociado.emitido_em ||
    laudoAssociado.status === 'emitido' ||
    laudoAssociado.status === 'enviado' ||
    laudoAssociado.hash
  );
  return (
    temEnvio && (lote.status === 'concluido' || lote.status === 'finalizado')
  );
}

function StatusPagamentoBadge({ status }: { status: string }) {
  const config = {
    aguardando_cobranca: {
      cls: 'bg-orange-100 text-orange-800',
      label: '⏳ Aguardando Link',
    },
    aguardando_pagamento: {
      cls: 'bg-blue-100 text-blue-800',
      label: '💳 Link Enviado',
    },
  } as Record<string, { cls: string; label: string }>;
  const item = config[status] ?? {
    cls: 'bg-green-100 text-green-800',
    label: '✓ Pago',
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${item.cls}`}>
      {item.label}
    </span>
  );
}

function LaudoHashBox({
  hash,
  laudoId,
  onCopy,
}: {
  hash: string;
  laudoId: number;
  onCopy: () => void;
}) {
  return (
    <div className="bg-white p-2 rounded border border-blue-100">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-blue-800">
          🔒 Hash SHA-256
        </span>
        {hash && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            aria-label={`Copiar hash do laudo ID ${laudoId}`}
            title="Copiar hash completo"
            className="inline-flex items-center gap-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 focus:outline-none"
          >
            📋 Copiar
          </button>
        )}
      </div>
      {hash ? (
        <code className="text-[10px] font-mono text-gray-700 break-all block">
          {hash}
        </code>
      ) : (
        <div className="text-[10px] text-gray-500 italic">
          Não disponível (laudo gerado antes do sistema de hash)
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line max-lines-per-function, complexity
export function LoteCard({
  lote,
  laudoAssociado,
  downloadingLaudo,
  onLoteClick,
  onDownloadLaudo,
}: LoteCardProps) {
  const temLaudo = temLaudoDisponivel(lote, laudoAssociado);
  const isPronto = lote.pode_emitir_laudo || temLaudo;
  const isCancelado = lote.status === 'cancelado';
  const statusPagamento = (
    lote as LoteAvaliacao & { status_pagamento?: string }
  ).status_pagamento;

  const aguardandoPagamento = Boolean(
    lote.solicitado_em &&
    statusPagamento === 'aguardando_pagamento' &&
    !temLaudo
  );
  const emissaoSolicitada = Boolean(
    lote.solicitado_em &&
    statusPagamento !== 'aguardando_pagamento' &&
    !temLaudo
  );

  const statusRelatorioClass = isCancelado
    ? 'bg-red-100 text-red-800'
    : isPronto
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';

  return (
    <div
      className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:shadow-lg hover:border-primary transition-all cursor-pointer"
      onClick={() => onLoteClick(lote.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onLoteClick(lote.id);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Ver detalhes do lote ${lote.id}`}
    >
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <h5 className="font-semibold text-gray-800 text-base">
            Lote ID: {lote.id}
          </h5>
          {lote.avaliacoes_inativadas > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
              ⚠️ {lote.avaliacoes_inativadas} inativada
              {lote.avaliacoes_inativadas !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Empresa: {lote.empresa_nome || 'N/A'}
        </p>
        <p className="text-xs text-gray-500">
          Liberado em {new Date(lote.liberado_em).toLocaleDateString('pt-BR')}{' '}
          às{' '}
          {new Date(lote.liberado_em).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        {lote.hash_pdf && (
          <div className="mt-2 bg-white p-2 rounded border border-gray-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-800">
                🔒 Hash SHA-256
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard
                    .writeText(lote.hash_pdf as string)
                    .then(() => toast.success('Hash copiado!'))
                    .catch(() => toast.error('Erro ao copiar hash'));
                }}
                className="inline-flex items-center gap-1 bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs hover:bg-gray-300"
                title="Copiar hash do lote"
              >
                📋 Copiar
              </button>
            </div>
            <code className="text-[10px] font-mono text-gray-700 break-all block">
              {lote.hash_pdf}
            </code>
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span>Avaliações liberadas:</span>
          <span className="font-medium">{lote.total_avaliacoes}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Concluídas:</span>
          <span className="font-medium text-green-600">
            {lote.avaliacoes_concluidas}
          </span>
        </div>
        {lote.avaliacoes_inativadas > 0 && (
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1">
              <span>Inativadas:</span>
              <span
                className="text-xs text-gray-500"
                title="Avaliações de funcionários inativos não contam para a prontidão"
              >
                ⓘ
              </span>
            </span>
            <span className="font-medium text-red-600">
              {lote.avaliacoes_inativadas}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>Ativas consideradas:</span>
          <span className="font-medium text-blue-600">
            {lote.total_avaliacoes - lote.avaliacoes_inativadas}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Status relatório:</span>
          <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${statusRelatorioClass}`}
          >
            {isCancelado ? 'Cancelado' : isPronto ? 'Pronto' : 'Pendente'}
          </span>
        </div>
        {/* Barra de progresso de conclusão com marcador 70% */}
        {typeof lote.taxa_conclusao === 'number' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            {(() => {
              const pct = Math.min(Math.round(lote.taxa_conclusao), 100);
              const atingiu = pct >= PERCENTUAL_MINIMO_EMISSAO;
              const progressColor = atingiu
                ? 'bg-green-500'
                : pct >= 50
                  ? 'bg-amber-400'
                  : 'bg-red-400';
              const textColor = atingiu
                ? 'text-green-700'
                : pct >= 50
                  ? 'text-amber-700'
                  : 'text-red-600';
              return (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500 font-medium">
                      Progresso
                    </span>
                    <span className={`text-xs font-semibold ${textColor}`}>
                      {pct}%
                    </span>
                  </div>
                  <div className="relative h-2.5 bg-gray-200 rounded-full overflow-visible">
                    {/* Marcador 70% */}
                    <div
                      className="absolute top-0 bottom-0 w-px bg-gray-500 z-10"
                      style={{ left: `${PERCENTUAL_MINIMO_EMISSAO}%` }}
                      title={`Mínimo ${PERCENTUAL_MINIMO_EMISSAO}% para emissão`}
                    />
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {atingiu ? (
                    <p className="text-xs text-green-700 mt-1 font-medium">
                      ✓ Liberado para solicitar laudo
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      mín. {PERCENTUAL_MINIMO_EMISSAO}% para solicitar laudo
                    </p>
                  )}
                </>
              );
            })()}
          </div>
        )}
        {statusPagamento && (
          <div className="flex justify-between text-sm pt-2 border-t">
            <span>Status pagamento:</span>
            <StatusPagamentoBadge status={statusPagamento} />
          </div>
        )}
      </div>

      {isPronto && !emissaoSolicitada && !aguardandoPagamento && !temLaudo && (
        <div className="p-3 bg-amber-50 rounded border border-amber-200 mb-4">
          <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
            <span>⏳</span>
            Ciclo aguardando solicitação de emissão do laudo.
          </p>
        </div>
      )}

      {aguardandoPagamento && (
        <div className="p-3 bg-orange-50 rounded border border-orange-200 mb-4">
          <p className="text-sm font-medium text-orange-800 flex items-center gap-2">
            <span>💳</span>
            Aguardando pagamento — link de pagamento gerado, aguardando
            confirmação.
          </p>
        </div>
      )}

      {emissaoSolicitada && (
        <div className="p-3 bg-blue-50 rounded border border-blue-200 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              📄 Emissão Solicitada
            </span>
          </div>
          <p className="text-xs text-blue-700 mb-1">
            A emissão do laudo foi solicitada em{' '}
            {new Date(lote.solicitado_em!).toLocaleDateString('pt-BR')} às{' '}
            {new Date(lote.solicitado_em!).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            . O laudo está sendo processado pelo emissor.
          </p>
          {lote.solicitado_por && (
            <p className="text-xs text-blue-600">
              Solicitado por: {lote.solicitado_por}
            </p>
          )}
        </div>
      )}

      {temLaudo && laudoAssociado && (
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">
              📄 Laudo disponível
            </span>
            <span className="text-xs text-blue-600">
              {laudoAssociado.enviado_em || laudoAssociado.emitido_em
                ? `${new Date(laudoAssociado.enviado_em || laudoAssociado.emitido_em).toLocaleDateString('pt-BR')} às ${new Date(laudoAssociado.enviado_em || laudoAssociado.emitido_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                : 'Data não disponível'}
            </span>
          </div>
          <p className="text-xs text-blue-700 mb-2">
            Emissor: {laudoAssociado.emissor_nome}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownloadLaudo(laudoAssociado);
            }}
            disabled={!temLaudo || downloadingLaudo === laudoAssociado.id}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed mb-3"
          >
            {downloadingLaudo === laudoAssociado.id
              ? 'Baixando...'
              : 'Ver Laudo/Baixar PDF'}
          </button>
          <LaudoHashBox
            hash={laudoAssociado.hash}
            laudoId={laudoAssociado.id}
            onCopy={() => {
              navigator.clipboard
                .writeText(laudoAssociado.hash)
                .then(() => toast.success('Hash copiado!'))
                .catch(() => toast.error('Não foi possível copiar o hash'));
            }}
          />
        </div>
      )}
    </div>
  );
}
