'use client';

import { CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import type {
  ParcelaTimeline,
  EstadoCalculadoParcela,
} from '@/lib/types/financeiro-resumo';

interface ParcelasTimelineProps {
  parcelas: ParcelaTimeline[];
  mesSelecionado: string | null;
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

function formatarData(dataStr: string): string {
  return new Date(dataStr + 'T12:00:00').toLocaleDateString('pt-BR');
}

function labelMesAno(ano: number, mes: number): string {
  const meses = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  return `${meses[mes - 1]}/${ano}`;
}

interface EstadoCfg {
  label: string;
  textClass: string;
  iconClass: string;
  rowClass: string;
}

const ESTADO_CFG: Record<EstadoCalculadoParcela, EstadoCfg> = {
  pago: {
    label: 'Pago',
    textClass: 'text-green-700',
    iconClass: 'text-green-500',
    rowClass: 'bg-white',
  },
  processando: {
    label: 'Processando',
    textClass: 'text-blue-700',
    iconClass: 'text-blue-500',
    rowClass: 'bg-white',
  },
  atrasado: {
    label: 'Atrasada',
    textClass: 'text-red-700',
    iconClass: 'text-red-500',
    rowClass: 'bg-red-50',
  },
  a_vencer_urgente: {
    label: 'Vence em breve',
    textClass: 'text-yellow-700',
    iconClass: 'text-yellow-500',
    rowClass: 'bg-yellow-50',
  },
  pendente: {
    label: 'Pendente',
    textClass: 'text-gray-600',
    iconClass: 'text-gray-400',
    rowClass: 'bg-white',
  },
  aguardando_emissao: {
    label: 'Aguardando',
    textClass: 'text-gray-500',
    iconClass: 'text-gray-400',
    rowClass: 'bg-gray-50',
  },
};

function EstadoIcone({
  estado,
}: {
  estado: EstadoCalculadoParcela;
}): React.JSX.Element {
  const cfg = ESTADO_CFG[estado];

  if (estado === 'pago') {
    return <CheckCircle size={14} className={cfg.iconClass} />;
  }
  if (estado === 'atrasado') {
    return <AlertCircle size={14} className={cfg.iconClass} />;
  }
  return <Clock size={14} className={cfg.iconClass} />;
}

function metodoLabel(metodo: string | null): string {
  if (!metodo) return '';
  const map: Record<string, string> = {
    pix: 'PIX',
    boleto: 'Boleto',
    cartao: 'Cartão',
    avista: 'À Vista',
    parcelado: 'Parcelado',
  };
  return map[metodo.toLowerCase()] ?? metodo;
}

export function ParcelasTimeline({
  parcelas,
  mesSelecionado,
}: ParcelasTimelineProps): React.JSX.Element {
  // Filtrar por mês selecionado (formato "YYYY-MM") se houver
  const parcelasFiltradas = mesSelecionado
    ? parcelas.filter((p) => p.data_vencimento.startsWith(mesSelecionado))
    : parcelas;

  if (parcelas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Nenhuma parcela encontrada.
      </div>
    );
  }

  if (parcelasFiltradas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Nenhuma parcela no período selecionado.
      </div>
    );
  }

  // Agrupar por mês/ano
  const grupos = new Map<string, { label: string; items: ParcelaTimeline[] }>();

  for (const p of parcelasFiltradas) {
    const d = new Date(p.data_vencimento + 'T12:00:00');
    const ano = d.getFullYear();
    const mes = d.getMonth() + 1;
    const chave = `${ano}-${String(mes).padStart(2, '0')}`;

    if (!grupos.has(chave)) {
      grupos.set(chave, { label: labelMesAno(ano, mes), items: [] });
    }
    grupos.get(chave)!.items.push(p);
  }

  const gruposOrdenados = Array.from(grupos.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return (
    <div className="space-y-4">
      {gruposOrdenados.map(([chave, grupo]) => (
        <div key={chave}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {grupo.label}
          </p>

          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
            {grupo.items.map((p) => {
              const cfg = ESTADO_CFG[p.estado];

              return (
                <div
                  key={`${p.pagamento_id}-${p.parcela_numero}`}
                  className={`${cfg.rowClass} px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2`}
                >
                  {/* Coluna esquerda: data + descrição */}
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      <EstadoIcone estado={p.estado} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {formatarData(p.data_vencimento)}
                        {p.lote_id && (
                          <span className="ml-2 text-xs text-gray-500">
                            Lote #{p.lote_id}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                        {p.total_parcelas > 1 && (
                          <span className="text-xs text-gray-500">
                            Parcela {p.parcela_numero}/{p.total_parcelas}
                          </span>
                        )}
                        {p.total_parcelas === 1 && (
                          <span className="text-xs text-gray-500">Única</span>
                        )}
                        {p.metodo && (
                          <span className="text-xs text-gray-400">
                            · {metodoLabel(p.metodo)}
                          </span>
                        )}
                        {p.pago && p.data_pagamento && (
                          <span className="text-xs text-green-600">
                            · Pago em{' '}
                            {formatarData(p.data_pagamento.split('T')[0])}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coluna direita: valor + estado + ação */}
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatarMoeda(p.valor)}
                    </p>

                    <span
                      className={`text-xs font-medium ${cfg.textClass} hidden sm:inline`}
                    >
                      {cfg.label}
                    </span>

                    {/* Ação: boleto — apenas quando disponível */}
                    {p.boleto_url && !p.pago && (
                      <a
                        href={p.boleto_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                        aria-label="Baixar boleto"
                      >
                        <ExternalLink size={12} />
                        Boleto
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
