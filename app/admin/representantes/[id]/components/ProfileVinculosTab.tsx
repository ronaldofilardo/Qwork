'use client';

import type { Vinculo } from '../types';
import type { RepProfile } from '../types';
import { STATUS_BADGE_VINCULO, formatCNPJ, formatDate, n } from '../constants';

interface ProfileVinculosTabProps {
  rep: RepProfile;
  vinculos: Vinculo[];
  totalVinculos: number;
  pageVinculos: number;
  setPageVinculos: (p: number | ((prev: number) => number)) => void;
  statusVinculoFiltro: string;
  setStatusVinculoFiltro: (v: string) => void;
  loadingVinculos: boolean;
  contagensVinculos: {
    ativo: number;
    inativo: number;
    suspenso: number;
    encerrado: number;
  };
}

export function ProfileVinculosTab({
  rep,
  vinculos,
  totalVinculos,
  pageVinculos,
  setPageVinculos,
  statusVinculoFiltro,
  setStatusVinculoFiltro,
  loadingVinculos,
  contagensVinculos,
}: ProfileVinculosTabProps) {
  return (
    <div className="p-4 space-y-4">
      {/* Filtros de vínculos */}
      <div className="flex flex-wrap items-center gap-1">
        {['', 'ativo', 'inativo', 'suspenso', 'encerrado'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusVinculoFiltro(s);
              setPageVinculos(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusVinculoFiltro === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s === '' ? `Todos (${n(rep.total_vinculos)})` : null}
            {s === 'ativo' ? `Ativos (${contagensVinculos.ativo})` : null}
            {s === 'inativo' ? `Inativos (${contagensVinculos.inativo})` : null}
            {s === 'suspenso'
              ? `Suspensos (${contagensVinculos.suspenso})`
              : null}
            {s === 'encerrado'
              ? `Encerrados (${contagensVinculos.encerrado})`
              : null}
          </button>
        ))}
      </div>

      {/* Vínculos */}
      {loadingVinculos ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-6 w-6 rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : vinculos.length === 0 ? (
        <p className="text-center py-10 text-gray-400 text-sm">
          Nenhum vínculo encontrado.
        </p>
      ) : (
        <div className="space-y-3">
          {vinculos.map((v) => (
            <div
              key={v.id}
              className={`border rounded-xl p-4 ${
                v.vence_em_breve
                  ? 'border-orange-200 bg-orange-50'
                  : v.sem_laudo_recente
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'bg-white'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 truncate">
                      {v.entidade_nome ?? 'Entidade não identificada'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        STATUS_BADGE_VINCULO[v.status] ??
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {v.status}
                    </span>
                    {v.vence_em_breve && (
                      <span className="text-xs text-orange-600 font-medium">
                        ⚠ Vence em breve
                      </span>
                    )}
                    {v.sem_laudo_recente && (
                      <span className="text-xs text-yellow-700 font-medium">
                        ⚠ Sem laudo recente
                      </span>
                    )}
                  </div>
                  {v.entidade_cnpj && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {formatCNPJ(v.entidade_cnpj)}
                    </p>
                  )}
                  {v.lead_razao_social && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Lead: {v.lead_razao_social}
                    </p>
                  )}
                  {v.lead_valor_negociado != null &&
                    v.lead_valor_negociado > 0 && (
                      <p className="text-xs text-emerald-600 mt-0.5">
                        Valor negociado: R${' '}
                        {Number(v.lead_valor_negociado).toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 2,
                          }
                        )}
                      </p>
                    )}
                </div>
                <div className="text-right text-xs text-gray-500 space-y-1 flex-shrink-0">
                  <div>
                    Início: <strong>{formatDate(v.data_inicio)}</strong>
                  </div>
                  <div>
                    Expira:{' '}
                    <strong
                      className={v.vence_em_breve ? 'text-orange-600' : ''}
                    >
                      {formatDate(v.data_expiracao)}
                    </strong>
                  </div>
                  {v.ultimo_laudo_em && (
                    <div>Último laudo: {formatDate(v.ultimo_laudo_em)}</div>
                  )}
                  {!v.ultimo_laudo_em && v.status === 'ativo' && (
                    <div className="text-yellow-600">Sem laudos ainda</div>
                  )}
                  {v.encerrado_em && (
                    <div className="text-red-500">
                      Encerrado: {formatDate(v.encerrado_em)}
                    </div>
                  )}
                </div>
              </div>
              {v.encerrado_motivo && (
                <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded px-3 py-1.5">
                  Motivo: {v.encerrado_motivo}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginação vínculos */}
      {totalVinculos > 25 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            disabled={pageVinculos === 1}
            onClick={() => setPageVinculos((p) => p - 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Pág. {pageVinculos} de {Math.ceil(totalVinculos / 25)}
          </span>
          <button
            disabled={pageVinculos >= Math.ceil(totalVinculos / 25)}
            onClick={() => setPageVinculos((p) => p + 1)}
            className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
}
