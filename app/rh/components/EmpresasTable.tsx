'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Users,
  CheckCircle2,
  Clock,
  FileCheck2,
  Loader2,
  XCircle,
  Flag,
  CreditCard,
  FileText,
  Edit2,
} from 'lucide-react';
import type {
  EmpresaOverview,
  LoteAtualInfo,
} from '@/app/api/rh/empresas-overview/route';
import StatusBadge from './StatusBadge';
import ProgressBarLote from './ProgressBarLote';

function CicloStatusCell({ lote }: { lote: LoteAtualInfo | null }) {
  if (!lote) return <span className="text-xs text-gray-300">—</span>;

  switch (lote.status) {
    case 'rascunho':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
          <Clock size={12} className="shrink-0" />
          Aguardando liberação
        </span>
      );

    case 'ativo':
      return (
        <div className="w-28">
          <ProgressBarLote
            percentual={lote.percentual_conclusao}
            total={lote.total_avaliacoes}
            concluidas={lote.avaliacoes_concluidas}
          />
        </div>
      );

    case 'concluido':
      if (lote.status_pagamento === 'pago') {
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-700">
            <FileText size={13} className="shrink-0" />
            Pagamento confirmado - aguard. emissao
          </span>
        );
      }

      if (lote.status_pagamento === 'aguardando_pagamento') {
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700">
            <CreditCard size={13} className="shrink-0" />
            Aguardando pagamento
          </span>
        );
      }

      if (lote.status_pagamento === 'aguardando_cobranca') {
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
            <Clock size={13} className="shrink-0" />
            Aguardando link de pgto
          </span>
        );
      }

      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 size={13} className="shrink-0" />
          Pronto para solicitar laudo
        </span>
      );

    case 'emissao_solicitada': {
      const pgto = lote.status_pagamento;

      if (pgto === 'pago') {
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
            <FileText size={13} className="shrink-0" />
            Na fila de emissão
          </span>
        );
      }

      if (pgto === 'aguardando_pagamento') {
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700">
            <CreditCard size={13} className="shrink-0" />
            Aguardando pagamento
          </span>
        );
      }

      // aguardando_cobranca ou null: admin ainda não gerou o link
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
          <Clock size={13} className="shrink-0" />
          Aguardando link de pgto
        </span>
      );
    }

    case 'emissao_em_andamento':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
          <Loader2 size={12} className="animate-spin shrink-0" />
          Gerando laudo...
        </span>
      );

    case 'laudo_emitido':
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
          <FileCheck2 size={13} className="shrink-0" />
          Laudo disponível
        </span>
      );

    case 'cancelado':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-red-500">
          <XCircle size={12} className="shrink-0" />
          Cancelado
        </span>
      );

    case 'finalizado':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
          <Flag size={12} className="shrink-0" />
          Ciclo concluído
        </span>
      );

    default:
      return <span className="text-xs text-gray-300">—</span>;
  }
}

interface EmpresasTableProps {
  empresas: EmpresaOverview[];
  selecionadas: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onEditEmpresa: (empresaId: number) => void;
}

export default function EmpresasTable({
  empresas,
  selecionadas,
  onToggle,
  onToggleAll,
  onEditEmpresa,
}: EmpresasTableProps) {
  const router = useRouter();

  const elegiveisIds = empresas
    .filter((e) => e.elegibilidade.elegivel)
    .map((e) => e.id);

  const todasElegiveisSelected =
    elegiveisIds.length > 0 && elegiveisIds.every((id) => selecionadas.has(id));

  if (empresas.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center">
        <Users className="mx-auto text-gray-300 mb-3" size={48} />
        <p className="text-gray-600">
          Nenhuma empresa encontrada para os filtros aplicados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="md:hidden space-y-3 p-3 bg-gray-50/60">
        {empresas.map((empresa) => {
          const lote = empresa.lote_atual;
          const elegivel = empresa.elegibilidade.elegivel;
          const isSelected = selecionadas.has(empresa.id);

          return (
            <div
              key={`mobile-${empresa.id}`}
              className={`qw-mobile-card ${isSelected ? 'ring-2 ring-primary/20 border-primary/30' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="qw-mobile-card-label">Empresa / CNPJ</div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => router.push(`/rh/empresa/${empresa.id}`)}
                      className="qw-mobile-card-value font-semibold text-primary-700 hover:text-primary-900 hover:underline text-left cursor-pointer"
                    >
                      {empresa.nome}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditEmpresa(empresa.id)}
                      title="Editar dados da empresa"
                      className="text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 break-all">
                    {empresa.cnpj}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  disabled={!elegivel}
                  onChange={() => onToggle(empresa.id)}
                  title={
                    !elegivel
                      ? (empresa.elegibilidade.motivo_bloqueio ??
                        'Não elegível')
                      : 'Selecionar para liberar ciclo'
                  }
                  className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-40"
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3">
                <div>
                  <div className="qw-mobile-card-label">Lote atual</div>
                  <div className="qw-mobile-card-value">
                    {lote ? `#${lote.id}` : 'Sem ciclo'}
                  </div>
                </div>

                <div>
                  <div className="qw-mobile-card-label">Ciclo atual</div>
                  <div className="qw-mobile-card-value">
                    {lote ? (
                      <StatusBadge
                        status={lote.status}
                        pagamento={
                          empresa.lote_anterior?.status_pagamento ?? undefined
                        }
                      />
                    ) : (
                      <span className="text-gray-400 italic">Sem ciclo</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="qw-mobile-card-label">Ciclo</div>
                  <div className="qw-mobile-card-value">
                    <CicloStatusCell lote={lote ?? null} />
                  </div>
                </div>

                <div>
                  <div className="qw-mobile-card-label">Elegibilidade</div>
                  <div className="qw-mobile-card-value">
                    {elegivel ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded">
                          Elegível
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {empresa.elegibilidade.count_elegiveis} funcionário
                          {empresa.elegibilidade.count_elegiveis !== 1
                            ? 's'
                            : ''}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded">
                          Bloqueado
                        </span>
                        {empresa.elegibilidade.motivo_bloqueio && (
                          <p className="text-sm text-gray-500 mt-1 break-words">
                            {empresa.elegibilidade.motivo_bloqueio}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="qw-mobile-card-label">Laudos (geral)</div>
                  <div className="qw-mobile-card-value text-sm space-y-1">
                    {empresa.laudos_status.aguardando_emissao > 0 && (
                      <p className="text-amber-600">
                        {empresa.laudos_status.aguardando_emissao} aguardando
                        link (geral)
                      </p>
                    )}
                    {empresa.laudos_status.aguardando_pagamento > 0 && (
                      <p className="text-yellow-600">
                        {empresa.laudos_status.aguardando_pagamento} aguard.
                        pgto (geral)
                      </p>
                    )}
                    {empresa.laudos_status.pago > 0 && (
                      <p className="text-teal-600">
                        {empresa.laudos_status.pago} pago - aguard. emissao
                        (geral)
                      </p>
                    )}
                    {empresa.laudos_status.laudo_emitido > 0 && (
                      <p className="text-green-600">
                        {empresa.laudos_status.laudo_emitido} disponivel(eis)
                        (geral)
                      </p>
                    )}
                    {empresa.laudos_status.aguardando_emissao === 0 &&
                      empresa.laudos_status.aguardando_pagamento === 0 &&
                      empresa.laudos_status.pago === 0 &&
                      empresa.laudos_status.laudo_emitido === 0 && (
                        <span className="text-gray-400">—</span>
                      )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/rh/empresa/${empresa.id}`)}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-white px-4 py-3 font-medium hover:bg-primary-hover transition-colors cursor-pointer"
              >
                Ver detalhes
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-10 px-4 py-3 text-left">
                <input
                  type="checkbox"
                  title="Selecionar todas as elegíveis"
                  checked={todasElegiveisSelected}
                  onChange={onToggleAll}
                  disabled={elegiveisIds.length === 0}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Lote
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ciclo Atual
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Elegibilidade
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ciclo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Laudos (geral)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {empresas.map((empresa) => {
              const lote = empresa.lote_atual;
              const elegivel = empresa.elegibilidade.elegivel;
              const isSelected = selecionadas.has(empresa.id);

              return (
                <tr
                  key={empresa.id}
                  className={`transition-colors ${
                    isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!elegivel}
                      onChange={() => onToggle(empresa.id)}
                      title={
                        !elegivel
                          ? (empresa.elegibilidade.motivo_bloqueio ??
                            'Não elegível')
                          : 'Selecionar para liberar ciclo'
                      }
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-40"
                    />
                  </td>

                  {/* Empresa */}
                  <td className="px-4 py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/rh/empresa/${empresa.id}`)
                          }
                          className="font-medium text-primary-600 hover:text-primary-800 hover:underline text-sm text-left"
                        >
                          {empresa.nome}
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditEmpresa(empresa.id)}
                          title="Editar dados da empresa"
                          className="text-gray-400 hover:text-primary-600 transition-colors flex-shrink-0"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">{empresa.cnpj}</p>
                    </div>
                  </td>

                  {/* Lote */}
                  <td className="px-4 py-3">
                    {lote ? (
                      <span className="text-xs font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        #{lote.id}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>

                  {/* Ciclo Atual */}
                  <td className="px-4 py-3">
                    {lote ? (
                      <StatusBadge
                        status={lote.status}
                        pagamento={
                          empresa.lote_anterior?.status_pagamento ?? undefined
                        }
                      />
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        Sem ciclo
                      </span>
                    )}
                  </td>

                  {/* Elegibilidade */}
                  <td className="px-4 py-3">
                    {elegivel ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded">
                          Elegível
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {empresa.elegibilidade.count_elegiveis} funcionário
                          {empresa.elegibilidade.count_elegiveis !== 1
                            ? 's'
                            : ''}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Bloqueado
                        </span>
                        {empresa.elegibilidade.motivo_bloqueio && (
                          <p
                            className="text-xs text-gray-400 mt-0.5 max-w-[140px] truncate"
                            title={empresa.elegibilidade.motivo_bloqueio}
                          >
                            {empresa.elegibilidade.motivo_bloqueio}
                          </p>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Ciclo */}
                  <td className="px-4 py-3">
                    <CicloStatusCell lote={lote ?? null} />
                  </td>

                  {/* Laudos */}
                  <td className="px-4 py-3">
                    <div className="text-xs space-y-0.5">
                      {empresa.laudos_status.aguardando_emissao > 0 && (
                        <p className="text-amber-600">
                          {empresa.laudos_status.aguardando_emissao} aguardando
                          link (geral)
                        </p>
                      )}
                      {empresa.laudos_status.aguardando_pagamento > 0 && (
                        <p className="text-yellow-600">
                          {empresa.laudos_status.aguardando_pagamento} aguard.
                          pgto (geral)
                        </p>
                      )}
                      {empresa.laudos_status.pago > 0 && (
                        <p className="text-teal-600">
                          {empresa.laudos_status.pago} pago - aguard. emissao
                          (geral)
                        </p>
                      )}
                      {empresa.laudos_status.laudo_emitido > 0 && (
                        <p className="text-green-600">
                          {empresa.laudos_status.laudo_emitido} disponivel(eis)
                          (geral)
                        </p>
                      )}
                      {empresa.laudos_status.aguardando_emissao === 0 &&
                        empresa.laudos_status.aguardando_pagamento === 0 &&
                        empresa.laudos_status.pago === 0 &&
                        empresa.laudos_status.laudo_emitido === 0 && (
                          <span className="text-gray-400">—</span>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
