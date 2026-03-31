'use client';

import { XCircle } from 'lucide-react';
import { AcaoPendente, ACAO_COR, ACAO_LABEL, fmt, fmtMes } from './types';

interface CiclosActionModalProps {
  acaoPendente: AcaoPendente | null;
  motivoRejeicao: string;
  comprovanteFile: File | null;
  comprovanteErro: string;
  comprovanteInputRef: React.RefObject<HTMLInputElement>;
  actionLoading: number | null;
  onChangeMotivoRejeicao: (v: string) => void;
  onChangeComprovanteFile: (f: File | null) => void;
  onChangeComprovanteErro: (v: string) => void;
  onFechar: () => void;
  onExecutar: () => void;
}

function ModalCycleInfo({ acaoPendente }: { acaoPendente: AcaoPendente }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 w-28 shrink-0">Beneficiário</span>
        <span className="font-medium">{acaoPendente.ciclo.beneficiario_nome}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 w-28 shrink-0">Mês</span>
        <span>{fmtMes(acaoPendente.ciclo.mes_referencia)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 w-28 shrink-0">Valor Total</span>
        <span className="font-semibold text-gray-900">{fmt(acaoPendente.ciclo.valor_total)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-400 w-28 shrink-0">Laudos</span>
        <span>{acaoPendente.ciclo.qtd_comissoes}</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line max-lines-per-function
export function CiclosActionModal({
  acaoPendente, motivoRejeicao, comprovanteFile, comprovanteErro,
  comprovanteInputRef, actionLoading, onChangeMotivoRejeicao,
  onChangeComprovanteFile, onChangeComprovanteErro, onFechar, onExecutar,
}: CiclosActionModalProps) {
  if (!acaoPendente) return null;

  const isDisabled =
    actionLoading !== null ||
    (acaoPendente.acao === 'rejeitar_nf' && motivoRejeicao.trim().length < 5) ||
    (acaoPendente.acao === 'pagar' && !comprovanteFile) ||
    !!comprovanteErro;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 id="modal-titulo" className="font-semibold text-gray-900 text-base">
          {ACAO_LABEL[acaoPendente.acao]}
        </h2>

        <ModalCycleInfo acaoPendente={acaoPendente} />

        {acaoPendente.acao === 'rejeitar_nf' && (
          <div>
            <label htmlFor="motivo-rejeicao" className="block text-sm font-medium text-gray-700 mb-1">
              Motivo da rejeição <span className="text-red-500">(obrigatório)</span>
            </label>
            <textarea
              id="motivo-rejeicao"
              value={motivoRejeicao}
              onChange={(e) => onChangeMotivoRejeicao(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-400 focus:outline-none"
              rows={3}
              placeholder="Descreva o motivo para o representante corrigir e reenviar..."
              maxLength={500}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{motivoRejeicao.length}/500</p>
          </div>
        )}

        {acaoPendente.acao === 'pagar' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comprovante de pagamento <span className="text-red-500">(obrigatório)</span>
            </label>
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 transition-colors focus-within:ring-2 focus-within:ring-blue-400"
              onClick={() => comprovanteInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') comprovanteInputRef.current?.click(); }}
              role="button" tabIndex={0} aria-label="Clique para selecionar comprovante"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onChangeComprovanteFile(e.dataTransfer.files?.[0] ?? null); }}
            >
              <input
                ref={comprovanteInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden" aria-label="Selecionar arquivo comprovante"
                onChange={(e) => onChangeComprovanteFile(e.target.files?.[0] ?? null)}
              />
              {comprovanteFile ? (
                <div className="flex items-center justify-between gap-2 text-left">
                  <span className="text-sm text-gray-700 truncate">{comprovanteFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onChangeComprovanteFile(null); onChangeComprovanteErro(''); if (comprovanteInputRef.current) comprovanteInputRef.current.value = ''; }}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                    aria-label="Remover arquivo"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Clique ou arraste — PDF, PNG, JPG, WEBP · máx. 5 MB</p>
              )}
            </div>
            {comprovanteErro && <p className="text-xs text-red-600 mt-1" role="alert">{comprovanteErro}</p>}
          </div>
        )}

        {acaoPendente.acao === 'fechar' && (
          <p className="text-sm text-gray-600">
            Isso irá vincular todas as comissões pendentes do mês ao ciclo e alterar o status para{' '}
            <strong>Aguardando NF</strong>. O representante poderá então enviar a NF/RPA.
          </p>
        )}

        {acaoPendente.acao === 'aprovar_nf' && (
          <p className="text-sm text-gray-600">
            A NF/RPA{' '}
            {acaoPendente.ciclo.nf_nome_arquivo && <strong>{acaoPendente.ciclo.nf_nome_arquivo}</strong>}{' '}
            será aprovada e o ciclo ficará pronto para pagamento.
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={onFechar} disabled={actionLoading !== null}
            className="flex-1 border px-4 py-2 rounded-lg text-sm hover:bg-gray-50 cursor-pointer transition-colors focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onExecutar} disabled={isDisabled}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 disabled:opacity-50 ${ACAO_COR[acaoPendente.acao]}`}
          >
            {actionLoading !== null ? 'Salvando...' : ACAO_LABEL[acaoPendente.acao]}
          </button>
        </div>
      </div>
    </div>
  );
}
