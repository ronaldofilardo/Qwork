'use client';

/**
 * app/emissor/components/LoteCard.tsx
 *
 * Individual lote card with status badge, company info, timestamps,
 * hash integrity section, notifications and action buttons.
 */

import toast from 'react-hot-toast';
import UploadLaudoButton from '@/components/UploadLaudoButton';
import type { Lote } from '../types';
import { getStatusColor } from '../types';

interface LoteCardProps {
  lote: Lote;
  onEmitirLaudo: (loteId: number) => void;
  onDownloadLaudo: (lote: Lote) => void;
  onReprocessar: (params: { loteId: number }) => void;
  isReprocessando: boolean;
  onUploadSuccess: () => void;
}

export default function LoteCard({
  lote,
  onEmitirLaudo,
  onDownloadLaudo,
  onReprocessar,
  isReprocessando,
  onUploadSuccess,
}: LoteCardProps) {
  return (
    <div className={`border-l-4 rounded-r-lg p-4 ${getStatusColor(lote)}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Lote ID: {lote.id}
          </h3>
        </div>
        <div className="text-right">
          {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
          <StatusBadge lote={lote} />
        </div>
      </div>

      {/* Aviso de Pagamento Pendente */}
      {lote.pagamento_pendente && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r">
          <div className="flex items-start gap-3">
            <span className="text-xl">⏳</span>
            <div>
              <p className="font-semibold text-yellow-800">
                Aguardando Pagamento
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                Este lote foi solicitado para emissão e aguarda confirmação de
                pagamento do cliente antes de ser liberado para emissão.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Company info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-sm font-medium text-gray-500">Empresa Cliente</p>
          <p className="text-sm text-gray-900">{lote.empresa_nome}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">Clínica Origem</p>
          <p className="text-sm text-gray-900">{lote.clinica_nome}</p>
        </div>
      </div>

      {/* Progresso de avaliações (Política 70% — Migration 1130) */}
      {lote.taxa_conclusao !== undefined && (
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        <ProgressoAvaliacoes
          taxaConclusao={lote.taxa_conclusao}
          totalAvaliacoes={lote.total_avaliacoes}
        />
      )}

      {/* Timestamps */}
      <div className="space-y-1 mb-4">
        <div className="text-sm text-gray-500">
          Recebido em {new Date(lote.liberado_em).toLocaleDateString('pt-BR')}{' '}
          às{' '}
          {new Date(lote.liberado_em).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>

        {lote.solicitado_em && lote.solicitado_por && (
          <div className="text-sm text-blue-600 font-medium">
            🚀 Emissão solicitada por {lote.solicitado_por} em{' '}
            {new Date(lote.solicitado_em).toLocaleDateString('pt-BR')} às{' '}
            {new Date(lote.solicitado_em).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}

        {lote.previsao_emissao && (
          <div className="text-sm text-gray-500">
            Previsão de emissão: {lote.previsao_emissao.formatada}
          </div>
        )}

        {lote.laudo?.emitido_em && (
          <div className="text-sm text-gray-500">
            Laudo emitido em{' '}
            {new Date(lote.laudo.emitido_em).toLocaleDateString('pt-BR')} às{' '}
            {new Date(lote.laudo.emitido_em).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}

        {lote.laudo?.emissor_nome && (
          <div className="text-sm text-blue-700 font-medium">
            Emissor: {lote.laudo.emissor_nome}
          </div>
        )}

        {lote.laudo?.enviado_em && (
          <div className="text-sm text-gray-500">
            Enviado em{' '}
            {new Date(lote.laudo.enviado_em).toLocaleDateString('pt-BR')} às{' '}
            {new Date(lote.laudo.enviado_em).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      {/* Hash do Laudo - Seção destacada */}
      {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
      {lote.laudo && lote.laudo._emitido && <HashSection lote={lote} />}

      {/* Notificações do Lote */}
      {lote.notificacoes && lote.notificacoes.length > 0 && (
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        <NotificacoesSection notificacoes={lote.notificacoes} />
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-2 items-center flex-wrap">
        {/* Upload para bucket */}
        {lote.laudo && lote.laudo._emitido && (
          <UploadLaudoButton
            laudoId={lote.laudo.id}
            loteId={lote.id}
            status={lote.laudo.status}
            arquivoRemotoKey={lote.laudo.arquivo_remoto_key || null}
            onUploadSuccess={onUploadSuccess}
          />
        )}{' '}
        {/* Botão reprocessar */}
        {lote.status === 'concluido' &&
          (!lote.laudo || !lote.laudo._emitido) && (
            <button
              onClick={() => onReprocessar({ loteId: lote.id })}
              disabled={isReprocessando}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {isReprocessando ? 'Processando...' : 'Reprocessar'}
            </button>
          )}
        {/* Botão principal */}
        {/* eslint-disable-next-line @typescript-eslint/no-use-before-define */}
        <MainActionButton
          lote={lote}
          onDownloadLaudo={onDownloadLaudo}
          onEmitirLaudo={onEmitirLaudo}
        />
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS (file-private)
// ============================================================================

function StatusBadge({ lote }: { lote: Lote }) {
  const colorClass =
    lote.status === 'concluido' && lote.laudo?.status === 'enviado'
      ? 'bg-green-100 text-green-800'
      : lote.status === 'finalizado'
        ? 'bg-green-100 text-green-800'
        : lote.status === 'concluido'
          ? 'bg-blue-100 text-blue-800'
          : lote.status === 'ativo'
            ? 'bg-orange-100 text-orange-800'
            : lote.status === 'cancelado'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800';

  const label =
    lote.status === 'concluido' && lote.laudo?.status === 'enviado'
      ? 'Finalizado'
      : lote.status === 'finalizado'
        ? 'Finalizado'
        : lote.status === 'concluido'
          ? 'Concluído'
          : lote.status === 'ativo'
            ? 'Ativo'
            : lote.status === 'cancelado'
              ? 'Cancelado'
              : 'Rascunho';

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colorClass}`}
    >
      {label}
    </span>
  );
}

function HashSection({ lote }: { lote: Lote }) {
  const hashPdf = lote.laudo?.hash_pdf;

  const handleCopyHash = (e: React.MouseEvent) => {
    e.stopPropagation();
    const h = hashPdf as string;
    navigator.clipboard
      .writeText(h)
      .then(() => toast.success('Hash copiado!'))
      .catch(() => {
        const ta = document.createElement('textarea');
        ta.value = h;
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          toast.success('Hash copiado!');
        } catch {
          toast.error('Não foi possível copiar o hash');
        }
        document.body.removeChild(ta);
      });
  };

  return (
    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-blue-800 uppercase">
          🔒 Hash de Integridade (SHA-256)
        </span>
        {hashPdf && (
          <button
            onClick={handleCopyHash}
            aria-label={`Copiar hash do laudo ${lote.id}`}
            title="Copiar hash completo para área de transferência"
            className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            📋 Copiar Hash
          </button>
        )}
      </div>
      <div className="bg-white p-2 rounded border border-blue-100">
        {hashPdf ? (
          <code className="text-xs font-mono text-gray-800 break-all block">
            {hashPdf}
          </code>
        ) : (
          <div className="text-xs text-gray-500 italic">
            Hash não disponível para este laudo
          </div>
        )}
      </div>
      {hashPdf ? (
        <p className="text-xs text-blue-600 mt-2">
          Use este hash para verificar a integridade do PDF do laudo
        </p>
      ) : (
        <p className="text-xs text-gray-500 mt-2">
          Este laudo foi gerado antes da implementação do hash. Regenere o laudo
          para obter o hash.
        </p>
      )}
    </div>
  );
}

function NotificacoesSection({
  notificacoes,
}: {
  notificacoes: NonNullable<Lote['notificacoes']>;
}) {
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">Notificações</h4>
      <div className="space-y-2">
        {notificacoes.map((notif) => (
          <div
            key={notif.id}
            className={`p-3 rounded-lg border ${
              notif.visualizada
                ? 'bg-gray-50 border-gray-200'
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                  notif.tipo === 'lote_liberado'
                    ? 'bg-green-500'
                    : 'bg-purple-500'
                }`}
              ></div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">{notif.mensagem}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notif.data_evento).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(notif.data_evento).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              {!notif.visualizada && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Barra de progresso de avaliações com marcador de 70% (Política Migration 1130) */
const PERCENTUAL_MINIMO = 70;

function ProgressoAvaliacoes({
  taxaConclusao,
  totalAvaliacoes,
}: {
  taxaConclusao: number;
  totalAvaliacoes: number;
}) {
  const pct = Math.min(Math.round(taxaConclusao), 100);
  const atingiuMinimo = pct >= PERCENTUAL_MINIMO;
  const progressColor = atingiuMinimo
    ? 'bg-green-500'
    : pct >= 50
      ? 'bg-amber-400'
      : 'bg-red-400';
  const textColor = atingiuMinimo
    ? 'text-green-700'
    : pct >= 50
      ? 'text-amber-600'
      : 'text-red-600';

  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-600">
          Progresso das avaliações
        </span>
        <span className={`text-xs font-semibold ${textColor}`}>
          {pct}% concluído ({totalAvaliacoes} total)
        </span>
      </div>
      <div className="relative h-2.5 bg-gray-200 rounded-full overflow-visible">
        {/* Marcador 70% */}
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-500 z-10"
          style={{ left: `${PERCENTUAL_MINIMO}%` }}
          title={`Mínimo para emissão: ${PERCENTUAL_MINIMO}%`}
        />
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {atingiuMinimo && (
        <p className="text-xs text-green-700 mt-1 font-medium">
          ✓ Atingiu o mínimo de {PERCENTUAL_MINIMO}% para emissão do laudo
        </p>
      )}
    </div>
  );
}

function MainActionButton({
  lote,
  onDownloadLaudo,
  onEmitirLaudo,
}: {
  lote: Lote;
  onDownloadLaudo: (lote: Lote) => void;
  onEmitirLaudo: (loteId: number) => void;
}) {
  const laudoDisponivelParaDownload = Boolean(
    lote.laudo &&
    (lote.laudo._emitido ||
      lote.laudo.status === 'enviado' ||
      lote.laudo.hash_pdf)
  );

  const laudoFoiEmitido = Boolean(lote.laudo && lote.laudo._emitido);

  const label = laudoDisponivelParaDownload
    ? 'Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO)'
    : lote.emissao_automatica
      ? !laudoFoiEmitido
        ? 'Pré-visualização'
        : lote.laudo?.status === 'enviado'
          ? 'Ver Laudo/Baixar PDF'
          : 'Ver Prévia (edição bloqueada)'
      : !laudoFoiEmitido
        ? 'Iniciar Laudo'
        : lote.laudo?.status === 'enviado'
          ? 'Ver Laudo/Baixar PDF'
          : 'Abrir Laudo Biopsicossocial';

  return (
    <button
      onClick={() => {
        if (laudoDisponivelParaDownload) {
          onDownloadLaudo(lote);
        } else {
          onEmitirLaudo(lote.id);
        }
      }}
      className={`px-4 py-2 ${
        lote.emissao_automatica
          ? 'bg-orange-600 hover:bg-orange-700'
          : 'bg-blue-600 hover:bg-blue-700'
      } text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 ${
        lote.emissao_automatica
          ? 'focus:ring-orange-500'
          : 'focus:ring-blue-500'
      } focus:ring-offset-2 transition-colors flex items-center gap-2`}
    >
      {label}
    </button>
  );
}
