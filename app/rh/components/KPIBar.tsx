'use client';

import { Building2, Users, Activity, FileText } from 'lucide-react';
import type { ResumoKPI } from '@/app/api/rh/empresas-overview/route';

interface KPIBarProps {
  kpi: ResumoKPI;
}

export default function KPIBar({ kpi }: KPIBarProps) {
  const cards = [
    {
      icon: Building2,
      iconColor: 'text-blue-500',
      value: kpi.total_empresas,
      label: 'Total de Empresas',
    },
    {
      icon: Activity,
      iconColor: 'text-indigo-500',
      value: kpi.lotes_em_andamento,
      label: 'Ciclos em Andamento',
    },
    {
      icon: Users,
      iconColor: 'text-emerald-500',
      value: `${kpi.percentual_medio_conclusao}%`,
      label: 'Média de Conclusão',
    },
    {
      icon: FileText,
      iconColor: 'text-amber-500',
      value: kpi.total_laudos_pendentes,
      label: 'Laudos Pendentes',
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(({ icon: Icon, iconColor, value, label }) => (
        <div
          key={label}
          className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4"
        >
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon size={28} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
