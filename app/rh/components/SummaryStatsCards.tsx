'use client';

import { Building2, Users, Layers, FileText } from 'lucide-react';
import type { ResumoKPI } from '@/app/api/rh/empresas-overview/route';

interface SummaryStatsCardsProps {
  kpi: ResumoKPI;
}

export default function SummaryStatsCards({ kpi }: SummaryStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1 — Empresas */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4 flex items-start gap-4">
        <div className="flex-shrink-0 text-blue-500 mt-0.5">
          <Building2 size={26} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900">{kpi.total_empresas}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">
            Empresas
          </p>
          <div className="mt-1.5 space-y-0.5 text-xs text-gray-500">
            <p>{kpi.total_lotes} lotes no total</p>
            {kpi.total_lotes_pendentes > 0 && (
              <p className="text-amber-600">
                {kpi.total_lotes_pendentes} aguard. emissão
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card 2 — Funcionários */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4 flex items-start gap-4">
        <div className="flex-shrink-0 text-emerald-500 mt-0.5">
          <Users size={26} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900">
            {kpi.total_funcionarios}
          </p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">
            Funcionários
          </p>
          <div className="mt-1.5 space-y-0.5 text-xs text-gray-500">
            <p>cadastrados e ativos</p>
            {kpi.total_funcionarios_inativos > 0 && (
              <p className="text-gray-400">
                {kpi.total_funcionarios_inativos} inativos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card 3 — Lotes */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4 flex items-start gap-4">
        <div className="flex-shrink-0 text-indigo-500 mt-0.5">
          <Layers size={26} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900">{kpi.lotes_em_andamento}</p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">
            Ciclos em Andamento
          </p>
          <div className="mt-1.5 space-y-0.5 text-xs text-gray-500">
            <p>{kpi.total_lotes} liberados no total</p>
            {kpi.total_lotes_pendentes > 0 && (
              <p className="text-amber-600">
                {kpi.total_lotes_pendentes} pend. emissão
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Card 4 — Laudos */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4 flex items-start gap-4">
        <div className="flex-shrink-0 text-accent-hover mt-0.5">
          <FileText size={26} />
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900">
            {kpi.total_laudos_emitidos}
          </p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">
            Laudos Emitidos
          </p>
          <div className="mt-1.5 space-y-0.5 text-xs text-gray-500">
            {kpi.total_laudos_aguardando_emissao > 0 && (
              <p className="text-amber-600">
                {kpi.total_laudos_aguardando_emissao} aguard. emissão
              </p>
            )}
            {kpi.total_laudos_aguardando_pagamento > 0 && (
              <p className="text-yellow-600">
                {kpi.total_laudos_aguardando_pagamento} aguard. pgto
              </p>
            )}
            {kpi.total_laudos_aguardando_emissao === 0 &&
              kpi.total_laudos_aguardando_pagamento === 0 && (
                <p>sem pendências</p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
