'use client';

import { DollarSign, CheckCircle, FileText, Clock, AlertCircle } from 'lucide-react';
import { ResumoCiclosMes, fmt } from './types';

interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  cor: string;
  valueClass: string;
  sublabel?: string;
}

function SummaryCard({ icon, label, value, cor, valueClass, sublabel }: SummaryCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${cor}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-600">{label}</span>
      </div>
      <div className={`text-xl font-bold ${valueClass}`}>{value}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>}
    </div>
  );
}

interface CiclosSummaryCardsProps {
  resumo: ResumoCiclosMes | null;
}

export function CiclosSummaryCards({ resumo }: CiclosSummaryCardsProps) {
  if (!resumo) return null;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <SummaryCard
        icon={<DollarSign size={18} className="text-blue-600" />}
        label="Total do Ciclo" value={fmt(resumo.valor_total)}
        cor="border-blue-200 bg-blue-50" valueClass="text-blue-700"
      />
      <SummaryCard
        icon={<CheckCircle size={18} className="text-green-600" />}
        label="Total Pago" value={fmt(resumo.valor_pago)}
        cor="border-green-200 bg-green-50" valueClass="text-green-700"
      />
      <SummaryCard
        icon={<FileText size={18} className="text-slate-500" />}
        label="Aguardando NF" value={String(resumo.qtd_aguardando_nf)}
        cor="border-slate-200 bg-slate-50" valueClass="text-slate-700"
        sublabel="ciclos fechados"
      />
      <SummaryCard
        icon={<Clock size={18} className="text-indigo-500" />}
        label="NF em Análise" value={String(resumo.qtd_nf_analise)}
        cor="border-indigo-200 bg-indigo-50" valueClass="text-indigo-700"
        sublabel="aguardando aprovação"
      />
      <SummaryCard
        icon={<AlertCircle size={18} className="text-purple-500" />}
        label="Prontos p/ Pagar" value={String(resumo.qtd_aprovados)}
        cor="border-purple-200 bg-purple-50" valueClass="text-purple-700"
        sublabel="NF aprovada"
      />
    </div>
  );
}
